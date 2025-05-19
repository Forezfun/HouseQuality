import { AfterViewInit, Component, Input, Renderer2, ElementRef, HostListener, EventEmitter, Output, ViewChild, OnInit, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { modelInterface, SceneComponent } from '../scene/scene.component';
import { Location, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { throttle } from 'lodash';
import { objectSceneInterface } from '../scene/scene.component'
import { categoryData, CategoryService } from '../../services/category.service';
import { NotificationService } from '../../services/notification.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { roomData } from '../../services/project.service';



interface roomSpanSettings {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  gap: number;
}
@Component({
  selector: 'app-plan-house',
  standalone: true,
  imports: [NgTemplateOutlet, NgFor, ReactiveFormsModule, NgIf, SceneComponent],
  templateUrl: './plan-house.component.html',
  styleUrls: ['./plan-house.component.scss']
})
export class PlanHouseComponent implements AfterViewInit, OnInit {
  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef,
    private categoryService: CategoryService,
    private location: Location,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef,
    private accountCookieService: AccountCookieService
  ) { }

  private previousGridArea!: string;
  private roomSpan!: HTMLSpanElement;
  private roomSpanSettings!: roomSpanSettings;
  private isDragging = false;
  private isClick = false;
  private clickTimer: any;
  private isDoubleClick = false;
  private toggleModuleButton!: HTMLButtonElement
  private formElement!: HTMLFormElement;
  private oldSizeViewRoom: {
    height: number;
    width: number;
  } | undefined = undefined
  protected lastPlanHouse: roomData | undefined = undefined
  protected categoryArray: categoryData[] = []
  protected isGuideIncluded: boolean = false
  protected isGuideVisible: boolean = true;
  public currentViewRoom: undefined | number = undefined
  public sceneOpenToggle: boolean = false
  public currentIdClickedRoom: number | undefined = undefined
  public guideTemplate!: TemplateRef<any>

  @Input()
  planHouse!: roomData[]
  @ViewChild('scene') sceneComponent!: SceneComponent;
  @Output() initialized = new EventEmitter<void>();
  @Output()
  planHouseEmitter = new EventEmitter<roomData[]>()
  @Output()
  callSaveEmitter = new EventEmitter()
  @ViewChild('roomsGuideTemplate1', { static: true })
  roomsGuideTemplate1!: TemplateRef<any>;
  @ViewChild('roomsGuideTemplate2', { static: true })
  roomsGuideTemplate2!: TemplateRef<any>;
  @ViewChild('roomGuideTemplate', { static: true })
  roomGuideTemplate!: TemplateRef<any>;

  ngOnInit(): void {
    this.checkGuideInclude()
    this.initCategories()
  }
  ngAfterViewInit(): void {
    const PARENT_ELEMENT = this.elementRef.nativeElement.parentElement;
    if (PARENT_ELEMENT.classList.contains('projectPreviewSpan')) this.isGuideIncluded = false

    this.guideTemplate = this.roomsGuideTemplate1
    this.cdr.detectChanges()
    this.roomSpan = this.elementRef.nativeElement.querySelector('.roomSpan') as HTMLSpanElement;
    this.calculateRoomSpanSettings();
    this.formElement = this.elementRef.nativeElement.querySelector('form') as HTMLFormElement;
    this.toggleModuleButton = this.elementRef.nativeElement.querySelector('.addModuleBtn')
    this.initialized.emit();
  }

  private async initCategories() {
    this.categoryArray = (await this.categoryService.GETgetAllCategories()).categoryArray
  }
  private showGuide() {
    this.isGuideVisible = true;
  }
  private checkGuideInclude() {
    this.isGuideIncluded = this.accountCookieService.getGuideRule() === 'false' ? false : true
    this.isGuideVisible = this.isGuideIncluded
  }
  private emitPlanHouse() {
    this.planHouseEmitter.emit(this.planHouse)
  }
  private saveHouse() {
    this.callSaveEmitter.emit()
  }
  private findFreeSpace(roomProportions: modelInterface): string | false {
    const GRID_SIZE = 10;
    const GRID_OCCUPIED: boolean[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

    this.planHouse.forEach(room => {
      const [startRow, startColumn, endRow, endColumn] = room.gridArea.split('/').map(Number);

      for (let row = startRow - 1; row < endRow - 1; row++) {
        for (let column = startColumn - 1; column < endColumn - 1; column++) {
          GRID_OCCUPIED[row][column] = true;
        }
      }
    });

    for (let startRow = 0; startRow <= GRID_SIZE - roomProportions.length; startRow++) {
      for (let startColumn = 0; startColumn <= GRID_SIZE - roomProportions.width; startColumn++) {
        let canFit = true;


        for (let row = startRow; row < startRow + roomProportions.length; row++) {
          for (let column = startColumn; column < startColumn + roomProportions.width; column++) {
            if (GRID_OCCUPIED[row][column]) {
              canFit = false;
              break;
            }
          }
          if (!canFit) break;
        }

        if (canFit) {

          for (let row = startRow; row < startRow + roomProportions.length; row++) {
            for (let column = startColumn; column < startColumn + roomProportions.width; column++) {
              GRID_OCCUPIED[row][column] = true;
            }
          }


          return `${startRow + 1} / ${startColumn + 1} / ${startRow + roomProportions.length + 1} / ${startColumn + roomProportions.width + 1}`
        }
      }
    }
    this.notification.setError('Нет места', 15000)
    return false;
  }
  private calculateRoomSpanSettings() {
    const ROOM_SPAN_ELEMENT = this.roomSpan.getBoundingClientRect();
    this.roomSpanSettings = {
      startX: ROOM_SPAN_ELEMENT.left,
      startY: ROOM_SPAN_ELEMENT.top - document.documentElement.scrollTop,
      endX: ROOM_SPAN_ELEMENT.width + ROOM_SPAN_ELEMENT.left,
      endY: ROOM_SPAN_ELEMENT.height + ROOM_SPAN_ELEMENT.top,
      gap: +window.getComputedStyle(this.roomSpan).getPropertyValue('gap').slice(0, -2),
    };
  }
  private isAreaOccupied(gridArea: string, currentRoomIndex: number): boolean {
    const [startRow, startColumn, endRow, endColumn] = gridArea.split('/').map(Number);

    for (let i = 0; i < this.planHouse.length; i++) {
      if (i === currentRoomIndex) continue;

      const [otherStartRow, otherStartColumn, otherEndRow, otherEndColumn] = this.planHouse[i].gridArea.split('/').map(Number);
      if (
        startRow < otherEndRow &&
        endRow > otherStartRow &&
        startColumn < otherEndColumn &&
        endColumn > otherStartColumn
      ) {
        return true;
      }
    }

    return false;
  }
  private calculateGridArea(objectX: number, objectY: number): string | undefined {
    if (this.currentIdClickedRoom === undefined) return;
    const ROOM_PROPORTIONS = this.planHouse[this.currentIdClickedRoom].roomProportions;
    const RELATIVE_X = objectX - this.roomSpanSettings.startX;
    const RELATIVE_Y = objectY - this.roomSpanSettings.startY - document.documentElement.scrollTop
    const SIDE_AREA = (this.roomSpanSettings.endX - this.roomSpanSettings.startX) / 10 + this.roomSpanSettings.gap;
    const START_COLUMN = Math.floor(RELATIVE_X / SIDE_AREA) + 1;
    const START_ROW = Math.floor(RELATIVE_Y / SIDE_AREA) + 1;

    const END_COLUMN = START_COLUMN + Math.round(ROOM_PROPORTIONS.width) - 1;
    const END_ROW = START_ROW + Math.round(ROOM_PROPORTIONS.length) - 1;

    if (END_COLUMN > 10 || END_ROW > 10) {
      return undefined;
    }

    return `${START_ROW} / ${START_COLUMN} / ${END_ROW + 1} / ${END_COLUMN + 1}`;
  }
  private resetRoomPosition(clientX: number, clientY: number) {
    const TARGET_ELEMENT = this.roomSpan.querySelector(`[data-index="${this.currentIdClickedRoom}"]`) as HTMLDivElement;
    if (TARGET_ELEMENT) {
      const GRID_AREA = this.calculateGridArea(clientX, clientY);

      if (GRID_AREA && !this.isAreaOccupied(GRID_AREA, this.currentIdClickedRoom!)) {
        this.renderer.setStyle(TARGET_ELEMENT, 'grid-area', GRID_AREA);
        this.planHouse[this.currentIdClickedRoom!].gridArea = GRID_AREA;
      } else {
        this.renderer.setStyle(TARGET_ELEMENT, 'grid-area', this.previousGridArea);
      }

      this.renderer.removeStyle(TARGET_ELEMENT, 'background-color');
      this.renderer.removeStyle(TARGET_ELEMENT, 'z-index');

      this.currentIdClickedRoom = undefined;
    }
  }
  @HostListener('document:mouseleave', ['$event'])
  private onMouseLeave(event: MouseEvent) {
    if (this.isDragging && this.currentIdClickedRoom !== undefined) {
      this.onMouseUp(event);
    }
  }
  @HostListener('document:touchend', ['$event'])
  @HostListener('document:keyup.Enter', ['$event'])
  @HostListener('document:mouseup', ['$event'])
  private onMouseUp(event: MouseEvent | KeyboardEvent | TouchEvent) {
    if (this.sceneOpenToggle === true) return
    if (this.currentViewRoom !== undefined) return
    if (this.isDragging && this.currentIdClickedRoom !== undefined) {
      this.isDragging = false;
      if (event instanceof MouseEvent) {

        this.resetRoomPosition(event.clientX, event.clientY);
      }
      if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
        const touch = event.changedTouches[0];
        this.resetRoomPosition(touch.clientX, touch.clientY);
      }
      const DRAGGED_ELEMENT = this.elementRef.nativeElement.querySelector('[style*="cursor: grabbing"]');
      if (DRAGGED_ELEMENT) {
        this.renderer.removeStyle(DRAGGED_ELEMENT, 'cursor');
        this.renderer.removeStyle(DRAGGED_ELEMENT, 'background-color')
      }
      this.currentIdClickedRoom = undefined
      this.emitPlanHouse()
    }
    this.clickTimer = setTimeout(() => {
      if (this.isClick && !this.isDragging) {
        if (this.currentIdClickedRoom == undefined) return
        this.toggleOpenRoomModule(this.currentIdClickedRoom)
      }
      this.isClick = false
      this.isDoubleClick = false
      this.isDragging = false
      clearTimeout(this.clickTimer)
    }, 250)

  }
  @HostListener('document:touchmove', ['$event'])
  @HostListener('document:mousemove', ['$event'])
  private onMouseMove(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    if (this.isDragging && this.currentIdClickedRoom !== undefined) {
      const TARGET_ELEMENT = this.roomSpan.querySelector(`[data-index="${this.currentIdClickedRoom}"]`) as HTMLDivElement;
      if (!TARGET_ELEMENT) return;
      const gridArea = event instanceof MouseEvent ? this.calculateGridArea(event.clientX, event.clientY) : this.calculateGridArea(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
      this.renderer.setStyle(TARGET_ELEMENT, 'z-index', '4');
      if (gridArea) {
        this.renderer.setStyle(TARGET_ELEMENT, 'grid-area', gridArea);

        const isOccupied = this.isAreaOccupied(gridArea, this.currentIdClickedRoom);

        if (isOccupied) {
          this.renderer.setStyle(TARGET_ELEMENT, 'background-color', '#F18DC4');
        } else {
          this.renderer.setStyle(TARGET_ELEMENT, 'background-color', '#A3B18A');
        }
      }
    }
  }
  @HostListener('document:keydown.ArrowUp', ['$event'])
  @HostListener('document:keydown.ArrowDown', ['$event'])
  @HostListener('document:keydown.ArrowRight', ['$event'])
  @HostListener('document:keydown.ArrowLeft', ['$event'])
  private moveRoom(event: KeyboardEvent) {
    if (this.currentIdClickedRoom === undefined || !this.isDragging) return
    const MOVE_ROOM_ELEMENT = this.elementRef.nativeElement.querySelector(`[data-index="${this.currentIdClickedRoom}"]`) as HTMLDivElement;
    let [startRow, startColumn, endRow, endColumn] = this.planHouse[this.currentIdClickedRoom].gridArea.split('/').map(Number);
    switch (event.key) {
      case 'ArrowUp':
        startRow -= 1
        endRow -= 1
        break
      case 'ArrowDown':
        startRow += 1
        endRow += 1
        break
      case 'ArrowRight':
        startColumn += 1
        endColumn += 1
        break
      case 'ArrowLeft':
        startColumn -= 1
        endColumn -= 1
        break
    }
    if (startRow < 1 || startColumn < 1 || endRow > 11 || endColumn > 11) return
    const NEW_GRID_AREA = `${startRow} / ${startColumn} / ${endRow} / ${endColumn}`
    if (this.isAreaOccupied(NEW_GRID_AREA, this.currentIdClickedRoom)) return
    this.renderer.setStyle(MOVE_ROOM_ELEMENT, 'grid-area', NEW_GRID_AREA)
    this.planHouse[this.currentIdClickedRoom].gridArea = NEW_GRID_AREA
  }
  @HostListener('document:contextmenu', ['$event'])
  private onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }
  @HostListener('window:scroll')
  private onScroll = throttle(() => {
    if (this.currentIdClickedRoom === undefined) return
    this.calculateRoomSpanSettings()
  }, 100)
  @HostListener('document:keydown.Escape')
  private escapeDraggingMode() {
    this.isDragging = false
    this.currentIdClickedRoom = undefined
    const DRAGGED_ELEMENT = this.elementRef.nativeElement.querySelector('[style*="cursor: grabbing"]');
    if (DRAGGED_ELEMENT) {
      this.renderer.removeStyle(DRAGGED_ELEMENT, 'background-color')
      this.renderer.removeStyle(DRAGGED_ELEMENT, 'cursor');
    }
  }
  protected clickRoom(event: Event, indexRoom: number) {
    if (this.currentViewRoom !== undefined) return;
    this.currentIdClickedRoom = indexRoom;

    const EVENT_TARGET = event.target as HTMLDivElement;
    this.previousGridArea = window.getComputedStyle(EVENT_TARGET).getPropertyValue('grid-area');

    if (this.isClick && !this.isDragging) {
      this.isDoubleClick = true;
      this.isClick = false;
      this.openViewRoom(this.currentIdClickedRoom);
    } else {
      this.isClick = true;
    }

    setTimeout(() => {
      if (this.isDoubleClick || !this.isClick) return;
      this.calculateRoomSpanSettings()
      this.renderer.setStyle(EVENT_TARGET, 'cursor', 'grabbing');
      this.isDragging = true;
      this.renderer.setStyle(EVENT_TARGET, 'background-color', '#A3B18A');
      this.currentIdClickedRoom = indexRoom;
      this.isClick = false;
    }, 350);
  }

  protected closeGuide() {
    this.accountCookieService.setGuideRule()
    this.isGuideVisible = false;
    if (this.guideTemplate == this.roomsGuideTemplate1) {
      this.guideTemplate = this.roomsGuideTemplate2
      this.showGuide()
    }
  }
  protected turnoffGuides(turnoff: boolean) {
    if (turnoff) {
      this.accountCookieService.setGuideRule()
      if (this.sceneOpenToggle === true && this.currentViewRoom !== undefined) {
        this.guideTemplate = this.roomGuideTemplate
      }
    } else {
      this.accountCookieService.deleteGuideRule()
    }
    this.checkGuideInclude()
  }
  protected updateRoomObjects(objects: objectSceneInterface[]) {
    if (this.currentViewRoom === undefined) return
    this.planHouse[this.currentViewRoom].objects = objects
    this.emitPlanHouse()
    this.saveHouse()
  }
  protected openScene() {
    if (this.isGuideIncluded) {
      this.guideTemplate = this.roomGuideTemplate
      this.showGuide()
    }
    const NEW_URL = this.location.path() + '/' + this.currentViewRoom
    this.location.replaceState(NEW_URL)
    this.sceneOpenToggle = true
    this.sceneComponent.loadRoom()
  }
  protected closeScene() {
    const NEW_URL = this.location.path().split('/').slice(0, -1).join('/')
    this.location.replaceState(NEW_URL)
    this.sceneComponent.saveRoom()
    this.sceneOpenToggle = false
  }
  protected closeViewRoom() {
    const ROOM_ELEMENT = this.roomSpan.querySelector(`[data-index="${this.currentViewRoom}"]`) as HTMLDivElement;
    if (!ROOM_ELEMENT || !this.oldSizeViewRoom) return;
    this.currentViewRoom = undefined;
    this.currentIdClickedRoom = undefined
    this.renderer.setStyle(ROOM_ELEMENT, 'width', this.oldSizeViewRoom.width + 'px')
    this.renderer.setStyle(ROOM_ELEMENT, 'height', this.oldSizeViewRoom.height + 'px')
    this.renderer.removeStyle(ROOM_ELEMENT, 'border');
    this.renderer.removeClass(ROOM_ELEMENT, 'roomView');

    this.renderer.setStyle(this.roomSpan, 'display', 'grid');

    setTimeout(() => {
      this.renderer.removeStyle(ROOM_ELEMENT, 'width');
      this.renderer.removeStyle(ROOM_ELEMENT, 'height');
    }, 768);
  }
  protected updateRoom() {
    if (this.currentIdClickedRoom === undefined || !this.roomForm.value.name) return
    if (this.roomForm.value.name === this.planHouse[this.currentIdClickedRoom].name) {
      this.toggleOpenRoomModule()
      return
    }
    this.planHouse[this.currentIdClickedRoom].name = this.roomForm.value.name

    this.roomForm.patchValue({
      width: null,
      height: null,
      length: null,
      name: ''
    });

    this.emitPlanHouse()
    this.toggleOpenRoomModule()
    this.saveHouse()
  }
  protected addRoom() {
    const { width, length, height, name } = this.roomForm.value
    this.toggleOpenRoomModule()
    const NEW_ROOM: roomData = {
      name: name!,
      roomProportions: {
        width: +width!,
        height: +height!,
        length: +length!
      },
      objects: [],
      gridArea: ''
    }
    const GRID_AREA = this.findFreeSpace(NEW_ROOM.roomProportions)
    if (!GRID_AREA) {
      return
    }
    NEW_ROOM.gridArea = GRID_AREA
    this.planHouse = [...this.planHouse, NEW_ROOM]
    this.emitPlanHouse()
    this.saveHouse()
  }

  protected deleteRoom() {
    if (this.currentIdClickedRoom !== undefined) {
      this.planHouse.splice(this.currentIdClickedRoom, 1);
      this.currentIdClickedRoom = undefined;
      this.toggleOpenRoomModule()
      this.emitPlanHouse()
      this.saveHouse()
      this.toggleControls(true)
    }
  }
  protected toggleControls(enable: boolean): void {
    if (enable) {
      this.roomForm.get('width')?.enable();
      this.roomForm.get('height')?.enable();
      this.roomForm.get('length')?.enable();
    } else {
      this.roomForm.get('width')?.disable();
      this.roomForm.get('height')?.disable();
      this.roomForm.get('length')?.disable();
    }
  }
  protected toggleOpenRoomModule(indexRoom?: number) {
    if (!this.toggleModuleButton) return;
    if (indexRoom !== undefined) {
      const { width, height, length } = this.planHouse[indexRoom].roomProportions;
      this.roomForm.patchValue({
        width: width,
        height: height,
        length: length,
        name: this.planHouse[indexRoom].name
      });
      this.toggleControls(this.currentIdClickedRoom === undefined)
      this.formElement.classList.add('openAddModule');
      this.renderer.setStyle(this.toggleModuleButton, 'rotate', '135deg');
      return;
    }
    if (this.formElement.classList.contains('openAddModule')) {
      this.formElement.classList.remove('openAddModule');
      this.renderer.setStyle(this.toggleModuleButton, 'rotate', '0deg');
      this.currentIdClickedRoom = undefined
      this.roomForm.patchValue({
        width: null,
        height: null,
        length: null,
        name: ''
      });
    } else {
      this.formElement.classList.add('openAddModule');
      this.renderer.setStyle(this.toggleModuleButton, 'rotate', '135deg');
    }
  }
  public openViewRoom(indexRoom: number) {
    this.formElement.classList.remove('openAddModule');
    this.currentViewRoom = indexRoom
    this.lastPlanHouse = this.planHouse[indexRoom]
    const ROOM_ELEMENT = this.roomSpan.querySelector(`[data-index="${indexRoom}"]`) as HTMLDivElement
    const { width: roomWidth, height: roomHeight } = ROOM_ELEMENT.getBoundingClientRect()
    const { width: spanWidth, height: spanHeight } = this.roomSpan.getBoundingClientRect()
    this.oldSizeViewRoom = {
      height: roomHeight,
      width: roomWidth
    }

    this.renderer.setStyle(ROOM_ELEMENT, 'width', roomWidth + 'px')
    this.renderer.setStyle(ROOM_ELEMENT, 'height', roomHeight + 'px')

    setTimeout(() => {
      const COEFF_PROPORTIONS = roomWidth > roomHeight ? spanWidth / 2 / roomWidth : spanHeight / 2 / roomHeight

      this.renderer.setStyle(ROOM_ELEMENT, 'width', roomWidth * COEFF_PROPORTIONS + 'px')
      this.renderer.setStyle(ROOM_ELEMENT, 'height', roomHeight * COEFF_PROPORTIONS + 'px')
      this.renderer.setStyle(ROOM_ELEMENT, 'border', 'white 3px dashed')

      this.renderer.addClass(ROOM_ELEMENT, 'roomView')
      this.renderer.setStyle(this.roomSpan, 'display', 'flex')
    }, 0)
  }

  protected roomForm = new FormGroup({
    width: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.1),
      Validators.max(10),
      Validators.pattern(/^\d*\.?\d+$/)
    ]),
    height: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.1),
      Validators.max(10),
      Validators.pattern(/^\d*\.?\d+$/)
    ]),
    length: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(0.1),
      Validators.max(10),
      Validators.pattern(/^\d*\.?\d+$/)
    ]),
    name: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(20)
    ]),
  });
}
