import { AfterViewInit, Component, Input, Renderer2, ElementRef, HostListener, EventEmitter, Output, ViewChild } from '@angular/core';
import { modelInterface, SceneComponent } from '../../scene/scene.component';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { throttle } from 'lodash';
import {objectSceneInterface} from '../../scene/scene.component'
import { Router } from '@angular/router';

export interface roomData {
  name:string;
  gridArea: string;
  roomProportions: modelInterface;
  objects:objectSceneInterface[]
}

interface roomSpanSettings {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  gap: number;
}
interface furnitureData {
  name: string;
  cost: string;
  previewUrl: string;
  link: string;
}
@Component({
  selector: 'app-plan-house',
  standalone: true,
  imports: [NgFor, ReactiveFormsModule, NgIf, NgClass,SceneComponent],
  templateUrl: './plan-house.component.html',
  styleUrls: ['./plan-house.component.scss']
})
export class PlanHouseComponent implements AfterViewInit {
  @Input()
  planHouse!:roomData[]
  lastPlanHouse:roomData|undefined=undefined
  currentIdClickedRoom: number | undefined = undefined
  private previousGridArea!: string;
  private roomSpan!: HTMLSpanElement;
  private roomSpanSettings!: roomSpanSettings;
  private isDragging = false;
  private isClick = false;
  formElement!: HTMLFormElement;
  private clickTimer: any;
  private isDoubleClick = false;
  private furnitureListElement!: HTMLSpanElement
  private toggleModuleButton!: HTMLButtonElement
  currentViewRoom: undefined | number = undefined
  sceneOpenToggle:boolean=false
  furnitureCategoryDataArray: string[] = [
    'Chair', 'Lamp', 'Sofa', 'Table'
  ]
  @ViewChild('scene') sceneComponent!: SceneComponent;
  @Output() initialized = new EventEmitter<void>();
  @Output()
  planHouseEmitter = new EventEmitter<roomData[]>()
  @Output()
  callSaveEmitter = new EventEmitter()
  emitPlanHouse(){
    this.planHouseEmitter.emit(this.planHouse)
  }

  private oldSizeViewRoom: {
    height: number;
    width: number;
  } | undefined = undefined



  roomForm = new FormGroup({
    width: new FormControl<number | null>(
      null,
      [Validators.required, this.numberValidator()]
    ),
    height: new FormControl<number | null>(
      null,
      [Validators.required, this.numberValidator()]
    ),  
    length: new FormControl<number | null>(
      null,
      [Validators.required, this.numberValidator()]
    ),    
    name: new FormControl<string>('', [Validators.required]),
});
  updateRoomObjects(objects:objectSceneInterface[]){
    if(this.currentViewRoom===undefined)return
    this.planHouse[this.currentViewRoom].objects=objects
    this.emitPlanHouse()
    this.saveHouse()
  }
  saveHouse(){
    this.callSaveEmitter.emit()
  }
  numberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      const isNumber = !isNaN(parseFloat(value)) && isFinite(value);
      return isNumber ? null : { notANumber: { value: control.value } };
    };
  }

  constructor(
    private renderer: Renderer2, 
    private elementRef: ElementRef,
    private router:Router
  ) { }

  ngAfterViewInit(): void {
    console.log(this.planHouse)
    this.furnitureListElement = this.elementRef.nativeElement.querySelector('.furnitureCategory') as HTMLSpanElement
    this.roomSpan = this.elementRef.nativeElement.querySelector('.roomSpan') as HTMLSpanElement;
    this.calculateRoomSpanSettings();
    this.formElement = this.elementRef.nativeElement.querySelector('form') as HTMLFormElement;
    this.toggleModuleButton = this.elementRef.nativeElement.querySelector('.addModuleBtn')
    console.log(this.formElement)
    this.initialized.emit();
  }
  openScene() {
    this.sceneOpenToggle=true
  }
  closeScene() {
    this.sceneComponent.saveRoom()
    this.sceneOpenToggle=false
  }
  openViewRoom(indexRoom: number) {
    console.log(this.formElement,this.roomSpan)
    this.formElement.classList.remove('openAddModule');
    this.currentViewRoom = indexRoom
    this.lastPlanHouse=this.planHouse[indexRoom]
    const roomElement = this.roomSpan.querySelector(`[data-index="${indexRoom}"]`) as HTMLDivElement
    console.log(roomElement)
    const { width: roomWidth, height: roomHeight } = roomElement.getBoundingClientRect()
    const { width: spanWidth, height: spanHeight } = this.roomSpan.getBoundingClientRect()
    console.log(spanWidth, spanHeight)
    this.oldSizeViewRoom = {
      height: roomHeight,
      width: roomWidth
    }

    this.renderer.setStyle(roomElement, 'width', roomWidth + 'px')
    this.renderer.setStyle(roomElement, 'height', roomHeight + 'px')

    console.log('rotate', this.toggleModuleButton)
    setTimeout(() => {
      const coeffProportions = roomWidth > roomHeight ? spanWidth / 2 / roomWidth : spanHeight / 2 / roomHeight

      this.renderer.setStyle(roomElement, 'width', roomWidth * coeffProportions + 'px')
      this.renderer.setStyle(roomElement, 'height', roomHeight * coeffProportions + 'px')
      this.renderer.setStyle(roomElement, 'border', 'white 3px dashed')

      this.renderer.addClass(roomElement, 'roomView')
      this.renderer.setStyle(this.roomSpan, 'display', 'flex')
    }, 0)

  }
  closeViewRoom() {
    const roomElement = this.roomSpan.querySelector(`[data-index="${this.currentViewRoom}"]`) as HTMLDivElement;
    if (!roomElement || !this.oldSizeViewRoom) return;
    this.currentViewRoom = undefined;
    this.currentIdClickedRoom = undefined
    this.renderer.setStyle(roomElement, 'width', this.oldSizeViewRoom.width + 'px')
    this.renderer.setStyle(roomElement, 'height', this.oldSizeViewRoom.height + 'px')
    this.renderer.removeStyle(roomElement, 'border');
    this.renderer.removeClass(roomElement, 'roomView');

    this.renderer.setStyle(this.roomSpan, 'display', 'grid');

    setTimeout(() => {
      this.renderer.removeStyle(roomElement, 'width');
      this.renderer.removeStyle(roomElement, 'height');
    }, 750);
  }
  updateRoom(){
    console.log(this.planHouse)
    if(this.currentIdClickedRoom===undefined||!this.roomForm.value.name)return
    if(this.roomForm.value.name===this.planHouse[this.currentIdClickedRoom].name){
      this.toggleOpenRoomModule()
      return
    }
    this.planHouse[this.currentIdClickedRoom].name=this.roomForm.value.name
    
    this.roomForm.patchValue({
      width: null,
      height: null,
      length: null,
      name:''
    });
    
    this.emitPlanHouse()
    this.toggleOpenRoomModule()
    this.saveHouse()
  }
  addRoom() {
    const { width, length, height,name } = this.roomForm.value
    this.toggleOpenRoomModule()
    const newRoom: roomData = {
      name:name!,
      roomProportions: {
        width: +width!,
        height: +height!,
        length: +length!
      },
      objects:[],
      gridArea: ''
    }
    const gridArea = this.findFreeSpace(newRoom.roomProportions)
    if (!gridArea) {
      console.log('No place')
      return
    }
    newRoom.gridArea = gridArea
    this.planHouse = [...this.planHouse, newRoom]
    this.emitPlanHouse()
    this.saveHouse()
  }
  findFreeSpace(roomProportions: modelInterface): string | false {
    const gridSize = 10;
    const gridOccupied: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    this.planHouse.forEach(room => {
      const [startRow, startColumn, endRow, endColumn] = room.gridArea.split('/').map(Number);

      for (let row = startRow - 1; row < endRow - 1; row++) {
        for (let column = startColumn - 1; column < endColumn - 1; column++) {
          gridOccupied[row][column] = true;
        }
      }
    });

    // Найдите свободное место для новой комнаты
    for (let startRow = 0; startRow <= gridSize - roomProportions.length; startRow++) {
      for (let startColumn = 0; startColumn <= gridSize - roomProportions.width; startColumn++) {
        let canFit = true;

        // Проверьте, помещается ли комната в указанное место
        for (let row = startRow; row < startRow + roomProportions.length; row++) {
          for (let column = startColumn; column < startColumn + roomProportions.width; column++) {
            if (gridOccupied[row][column]) {
              canFit = false;
              break;
            }
          }
          if (!canFit) break;
        }

        if (canFit) {
          // Обновите сетку с учетом новой комнаты
          for (let row = startRow; row < startRow + roomProportions.length; row++) {
            for (let column = startColumn; column < startColumn + roomProportions.width; column++) {
              gridOccupied[row][column] = true;
            }
          }


          return `${startRow + 1} / ${startColumn + 1} / ${startRow + roomProportions.length + 1} / ${startColumn + roomProportions.width + 1}`
        }
      }
    }
    return false;
  }

  deleteRoom() {
    if (this.currentIdClickedRoom !== undefined) {
      this.planHouse.splice(this.currentIdClickedRoom, 1);
      this.currentIdClickedRoom = undefined;
      this.toggleOpenRoomModule()
      this.saveHouse()
    }
  }
  toggleControls(enable: boolean): void {
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
  toggleOpenRoomModule(indexRoom?: number) {
    if (!this.toggleModuleButton) return;
    if (indexRoom !== undefined) {
      const { width, height, length } = this.planHouse[indexRoom].roomProportions;
      this.roomForm.patchValue({
        width: width,
        height: height,
        length: length,
        name: this.planHouse[indexRoom].name
      });
      this.toggleControls(this.currentIdClickedRoom===undefined)
      this.formElement.classList.add('openAddModule');
      this.renderer.setStyle(this.toggleModuleButton, 'rotate', '135deg');
      return;
    }
    if (this.formElement.classList.contains('openAddModule')) {
      this.formElement.classList.remove('openAddModule');
      this.renderer.setStyle(this.toggleModuleButton, 'rotate', '0deg');
      this.currentIdClickedRoom=undefined
      this.roomForm.patchValue({
        width: null,
        height: null,
        length: null,
        name:''
      });
    } else {
      this.formElement.classList.add('openAddModule');
      this.renderer.setStyle(this.toggleModuleButton, 'rotate', '135deg');
    }
  }
  calculateRoomSpanSettings() {
    const roomSpanElement = this.roomSpan.getBoundingClientRect();
    this.roomSpanSettings = {
      startX: roomSpanElement.left,
      startY: roomSpanElement.top-document.documentElement.scrollTop,
      endX: roomSpanElement.width + roomSpanElement.left,
      endY: roomSpanElement.height + roomSpanElement.top,
      gap: +window.getComputedStyle(this.roomSpan).getPropertyValue('gap').slice(0, -2),
    };
  }

  clickRoom(event: Event, indexRoom: number) {
    this.startClickTime=new Date().getTime()
    console.log('Dragging', this.isDragging)
    console.log('Click', this.isClick)
    console.log('Double', this.isDoubleClick)
    if (this.currentViewRoom !== undefined) return;
    this.currentIdClickedRoom = indexRoom;

    const eventTarget = event.target as HTMLDivElement;
    this.previousGridArea = window.getComputedStyle(eventTarget).getPropertyValue('grid-area');

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
      this.renderer.setStyle(eventTarget, 'cursor', 'grabbing');
      this.isDragging = true;
      this.renderer.setStyle(eventTarget, 'background-color', '#A3B18A');
      this.currentIdClickedRoom = indexRoom;
      this.isClick = false;
    }, 350);
  }
  @HostListener('document:mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent) {
    if (this.isDragging && this.currentIdClickedRoom !== undefined) {
      this.onMouseUp(event);
    }
  }
  private startClickTime:any
  @HostListener('document:touchend', ['$event'])
  @HostListener('document:keyup.Enter', ['$event'])
  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent | KeyboardEvent | TouchEvent) {
    if(this.sceneOpenToggle===true)return
    console.log(new Date().getTime()-this.startClickTime)
    console.log('Dragging', this.isDragging)
    console.log('Click', this.isClick)
    console.log('Double', this.isDoubleClick)
    console.log(this.currentViewRoom,this.currentIdClickedRoom)
    console.log(this.currentIdClickedRoom)
    if (this.currentViewRoom !== undefined) return
    if (this.isDragging && this.currentIdClickedRoom !== undefined) {
      this.isDragging = false;
      if (event instanceof MouseEvent) {
        
        this.resetRoomPosition(event.clientX, event.clientY);
      }
      if (typeof TouchEvent !== 'undefined'&&event instanceof TouchEvent) {
        const touch = event.changedTouches[0];
        this.resetRoomPosition(touch.clientX, touch.clientY);
      }
      const draggedElement = this.elementRef.nativeElement.querySelector('[style*="cursor: grabbing"]');
      if (draggedElement) {
        this.renderer.removeStyle(draggedElement, 'cursor');
      }
      this.currentIdClickedRoom = undefined
      this.emitPlanHouse()
    }
    this.clickTimer = setTimeout(() => {
      if (this.isClick && !this.isDragging) {
        if (this.currentIdClickedRoom == undefined) return
        this.toggleOpenRoomModule(this.currentIdClickedRoom)
      }
      console.log('touchEnd')
      console.log('double: ',this.isDoubleClick)
      this.isClick = false
      this.isDoubleClick = false
      this.isDragging = false
      clearTimeout(this.clickTimer)
    }, 250)

  }




  resetRoomPosition(clientX: number, clientY: number) {
    const targetElement = this.roomSpan.querySelector(`[data-index="${this.currentIdClickedRoom}"]`) as HTMLDivElement;
    if (targetElement) {
      const gridArea = this.calculateGridArea(clientX, clientY);

      if (gridArea && !this.isAreaOccupied(gridArea, this.currentIdClickedRoom!)) {
        this.renderer.setStyle(targetElement, 'grid-area', gridArea);
        this.planHouse[this.currentIdClickedRoom!].gridArea = gridArea;
      } else {
        this.renderer.setStyle(targetElement, 'grid-area', this.previousGridArea);
      }

      this.renderer.removeStyle(targetElement, 'background-color');
      this.renderer.removeStyle(targetElement, 'z-index');

      this.currentIdClickedRoom = undefined;
    }
  }


  @HostListener('document:touchmove', ['$event'])
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent|TouchEvent) {
    event.preventDefault();
    if (this.isDragging && this.currentIdClickedRoom !== undefined) {
      const targetElement = this.roomSpan.querySelector(`[data-index="${this.currentIdClickedRoom}"]`) as HTMLDivElement;
      if (!targetElement) return;
      const gridArea = event instanceof MouseEvent?this.calculateGridArea(event.clientX, event.clientY):this.calculateGridArea(event.changedTouches[0].clientX, event.changedTouches[0].clientY)
      this.renderer.setStyle(targetElement, 'z-index', '4');
      if (gridArea) {
        this.renderer.setStyle(targetElement, 'grid-area', gridArea);

        const isOccupied = this.isAreaOccupied(gridArea, this.currentIdClickedRoom);

        if (isOccupied) {
          this.renderer.setStyle(targetElement, 'background-color', '#F18DC4');
        } else {
          this.renderer.setStyle(targetElement, 'background-color', '#A3B18A');
        }
      }
    }
  }


  isAreaOccupied(gridArea: string, currentRoomIndex: number): boolean {
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

  calculateGridArea(objectX: number, objectY: number): string | undefined {

    if (this.currentIdClickedRoom === undefined) return;
    const roomProportions = this.planHouse[this.currentIdClickedRoom].roomProportions;
    const relativeX = objectX - this.roomSpanSettings.startX;
    const relativeY = objectY - this.roomSpanSettings.startY-document.documentElement.scrollTop
    const sideArea = (this.roomSpanSettings.endX - this.roomSpanSettings.startX) / 10 + this.roomSpanSettings.gap;
    console.log(document.documentElement.scrollTop,this.roomSpanSettings.startY)
    const startColumn = Math.floor(relativeX / sideArea) + 1;
    const startRow = Math.floor(relativeY / sideArea) + 1;

    const endColumn = startColumn + Math.round(roomProportions.width) - 1;
    const endRow = startRow + Math.round(roomProportions.length) - 1;

    if (endColumn > 10 || endRow > 10) {
      return undefined;
    }

    return `${startRow} / ${startColumn} / ${endRow + 1} / ${endColumn + 1}`;
  }
  @HostListener('document:keydown.ArrowUp', ['$event'])
  @HostListener('document:keydown.ArrowDown', ['$event'])
  @HostListener('document:keydown.ArrowRight', ['$event'])
  @HostListener('document:keydown.ArrowLeft', ['$event'])
  moveRoom(event: KeyboardEvent) {
    console.log(this.currentIdClickedRoom === undefined || !this.isDragging, this.currentIdClickedRoom === undefined, this.isDragging)
    if (this.currentIdClickedRoom === undefined || !this.isDragging) return
    const moveRoomElement = this.elementRef.nativeElement.querySelector(`[data-index="${this.currentIdClickedRoom}"]`) as HTMLDivElement;
    let [startRow, startColumn, endRow, endColumn] = this.planHouse[this.currentIdClickedRoom].gridArea.split('/').map(Number);
    console.log(`${startRow} / ${startColumn} / ${endRow} / ${endColumn}`)

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
    console.log(`${startRow} / ${startColumn} / ${endRow} / ${endColumn}`)
    if (startRow < 1 || startColumn < 1 || endRow > 11 || endColumn > 11) return
    const newGridArea = `${startRow} / ${startColumn} / ${endRow} / ${endColumn}`
    console.log(this.isAreaOccupied(newGridArea, this.currentIdClickedRoom))
    if (this.isAreaOccupied(newGridArea, this.currentIdClickedRoom)) return
    this.renderer.setStyle(moveRoomElement, 'grid-area', newGridArea)
    this.planHouse[this.currentIdClickedRoom].gridArea = newGridArea
  }
  @HostListener('document:contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }
  @HostListener('window:scroll')
  onScroll = throttle(() => {
    if(this.currentIdClickedRoom===undefined)return
    this.calculateRoomSpanSettings()
  },50)
  @HostListener('document:keydown.Escape')
  escapeDragginMod() {
    console.log('escape')
    if (this.currentIdClickedRoom === undefined) return
    this.isDragging = false
    this.currentIdClickedRoom = undefined
    const draggedElement = this.elementRef.nativeElement.querySelector('[style*="cursor: grabbing"]');
    if (draggedElement) {
      this.renderer.removeStyle(draggedElement, 'background-color')
      this.renderer.removeStyle(draggedElement, 'cursor');
    }
    console.log(this.currentIdClickedRoom)
  }
}
