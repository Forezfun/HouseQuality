import { Component, AfterViewInit, ElementRef, HostListener, Input, SimpleChanges, Output, EventEmitter, OnChanges, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { ProjectService, roomData as roomDataPlan } from '../../services/project.service';
import { loadModel } from './loaders';
import { FurnitureModelControlService } from '../../services/furniture-model-control.service';
import { AccountCookieService } from '../../services/account-cookie.service';
import { FurnitureCardControlService } from '../../services/furniture-card-control.service';
import { ActivatedRoute } from '@angular/router';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { Location, NgIf } from '@angular/common';

export interface modelInterface {
  width: number;
  height: number;
  length: number;
}
export interface objectSceneInterface {
  objectId: string;
  xMetersDistance: number;
  zMetersDistance: number;
  yRotate: number
}
interface objectLoadInterface {
  xDistance: number;
  zDistance: number;
  yRotate: number
}
interface roomData extends modelInterface {
  objects: objectSceneInterface[]
}
@Component({
  selector: 'app-scene',
  standalone: true,
  imports: [NgxSpinnerModule, NgIf],
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent implements AfterViewInit, OnChanges {
  constructor(
    private elementRef: ElementRef,
    private spinner: NgxSpinnerService,
    private furnitureModelService: FurnitureModelControlService,
    private furnitureCardService: FurnitureCardControlService,
    private accountCookieService: AccountCookieService,
    private projectService: ProjectService,
    private route: ActivatedRoute,
    private errorHandler: ErrorHandlerService,
    private location: Location
  ) { }

  @Input()
  roomData!: roomDataPlan | undefined
  @Output()
  saveObjectsEmitter = new EventEmitter<objectSceneInterface[]>()

  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private controls!: OrbitControls;
  private animationFrameId: number | null = null;
  private canvasRatioOfWindow = 1.5;
  private roomProportions!: modelInterface;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private rectangleMesh!: THREE.Mesh;
  protected targetobject: THREE.Object3D | undefined = undefined;


  ngAfterViewInit(): void {
    this.initThreeJs();
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.roomData = changes['roomData'].currentValue as roomDataPlan
    if (!this.roomData || this.scene === undefined || this.roomData === changes['roomData'].previousValue) return
    if (changes['roomData'].previousValue !== undefined) { this.clearRoom() }
    this.camera.position.set(0, 5, 0)
    this.camera.rotation.set(THREE.MathUtils.degToRad(-90), 0, 0)
    this.roomProportions = this.roomData.roomProportions
    this.createRoom();
    this.rectangleMesh.rotation.x = THREE.MathUtils.degToRad(-90)
    const LOAD_OBJECT: roomData = {
      objects: this.roomData.objects,
      ...this.roomData.roomProportions
    }
    if (this.getObjectSize(this.rectangleMesh).width === 0) return
    this.loadRoom(LOAD_OBJECT)
    const FURNITURE_ID = this.route.snapshot.params['furnitureId']
    if (!FURNITURE_ID || changes['roomData'].previousValue) return
    this.fixPath()
    this.addModel(FURNITURE_ID, true)
  }

  private async loadFurnitureModel(fileModel: Blob, furnitureSize: modelInterface, furnitureId: string, saveRoom: boolean, moveData?: objectLoadInterface) {
    try {
      const LOAD_OBJECT = await loadModel(fileModel)
      if (moveData) { this.addObjectToScene(LOAD_OBJECT, furnitureSize, furnitureId, moveData) } else { this.addObjectToScene(LOAD_OBJECT, furnitureSize, furnitureId) }
      if (saveRoom) this.saveRoom()
    } catch (error) {
    }
  }
  private async addModel(furnitureId: string, saveRoom: boolean, moveData?: objectLoadInterface) {
    const JWT = this.accountCookieService.getJwt()
    if (!JWT) return
    try {
      if (saveRoom) this.spinner.show()
      const PROPORTIONS = (await this.furnitureCardService.GETfurnitureCard(furnitureId)).furnitureCard.proportions as modelInterface
      const MODEL = await this.furnitureModelService.GETfurnitureModel(JWT, furnitureId)
      await this.loadFurnitureModel(MODEL, PROPORTIONS, furnitureId, saveRoom, moveData)
      this.spinner.hide()
    } catch (error) {
      this.spinner.hide()
      this.errorHandler.setError('Ошибка загрузки модели', 5000)
      console.log(error)
    }
  }

  private fixPath() {
    const NEW_URL = this.location.path().split('/').slice(0, -1).join('/')
    this.location.replaceState(NEW_URL)
  }
  private initThreeJs(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const HEMISPHERE_LIGHT = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 2);
    this.scene.add(HEMISPHERE_LIGHT);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    const CANVAS_CONTAINER = this.elementRef.nativeElement.querySelector('#canvasContainer');
    this.camera.position.z = 5;
    this.renderer.setSize(window.innerWidth / this.canvasRatioOfWindow, window.innerHeight / this.canvasRatioOfWindow);
    CANVAS_CONTAINER.appendChild(this.renderer.domElement);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
  private createRoundedRectangleGeometry(width: number, height: number, radius: number, segments: number): THREE.BufferGeometry {
    const SHAPE = new THREE.Shape();
    SHAPE.moveTo(-width / 2 + radius, -height / 2);
    SHAPE.lineTo(width / 2 - radius, -height / 2);
    SHAPE.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
    SHAPE.lineTo(width / 2, height / 2 - radius);
    SHAPE.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
    SHAPE.lineTo(-width / 2 + radius, height / 2);
    SHAPE.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
    SHAPE.lineTo(-width / 2, -height / 2 + radius);
    SHAPE.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);

    const geometry = new THREE.ShapeGeometry(SHAPE, segments);

    return geometry;
  }
  private createRoom(): void {
    if (!this.roomData) return
    const ROOM_PROPORTIONS = this.roomData.roomProportions
    const RADIUS = 0.1
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.15;
    this.controls.enableZoom = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    const paddingPolarAngle = 5;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90 - paddingPolarAngle);
    this.createRoomShape(ROOM_PROPORTIONS.width, ROOM_PROPORTIONS.length, RADIUS);
    this.rectangleMesh.name = 'roomFloorBase';
    this.rectangleMesh
  }
  private calculateObjectSaveData(object: THREE.Object3D) {
    const FLOOR_SIZE = this.getObjectSize(this.rectangleMesh)
    const OBJECT_POSITION = object.position
    const objectSaveData: objectSceneInterface = {
      objectId: (object.userData as any).id,
      xMetersDistance: OBJECT_POSITION.x / FLOOR_SIZE.width * this.roomProportions.width,
      zMetersDistance: OBJECT_POSITION.z / FLOOR_SIZE.length * this.roomProportions.length,
      yRotate: object.rotation.y
    }
    return objectSaveData
  }
  private calculateMoveObjectData(objectSaveData: objectSceneInterface): objectLoadInterface {
    const FLOOR_SIZE = this.getObjectSize(this.rectangleMesh)
    return {
      xDistance: objectSaveData.xMetersDistance * FLOOR_SIZE.width / this.roomProportions.width,
      zDistance: objectSaveData.zMetersDistance * FLOOR_SIZE.length / this.roomProportions.length,
      yRotate: objectSaveData.yRotate
    }
  }
  private createRoomShape(widthRatio: number, heightRatio: number, radius: number): void {
    const CAMERA_FRUSTUM_BOUNDS = this.calculateFrustumBounds();
    const SHAPE_RATIO = widthRatio / heightRatio;
    let width: number, height: number;

    if (SHAPE_RATIO <= 1) {
      width = CAMERA_FRUSTUM_BOUNDS.height * SHAPE_RATIO;
      height = CAMERA_FRUSTUM_BOUNDS.height;
    } else {
      width = CAMERA_FRUSTUM_BOUNDS.width;
      height = CAMERA_FRUSTUM_BOUNDS.width / SHAPE_RATIO;
    }
    const SEGMENTS = 10;
    const GEOMETRY = this.createRoundedRectangleGeometry(width * 0.9, height * 0.9, radius, SEGMENTS);
    const MATERIAL = new THREE.MeshBasicMaterial({ color: 3427905 });

    this.rectangleMesh = new THREE.Mesh(GEOMETRY, MATERIAL);
    this.scene.add(this.rectangleMesh)
    this.renderer.render(this.scene, this.camera);
    this.rectangleMesh.updateMatrixWorld(true);
  }
  private calculateFrustumBounds(): { width: number; height: number } {
    const CAMERA_Y = this.camera.position.y;
    const FOV_RAD = THREE.MathUtils.degToRad(this.camera.fov);
    const FRUSTUM_HEIGHT = 2 * Math.tan(FOV_RAD / 2) * Math.abs(CAMERA_Y);
    const FRUSTUM_WIDTH = FRUSTUM_HEIGHT * this.camera.aspect;

    return { width: FRUSTUM_WIDTH, height: FRUSTUM_HEIGHT };
  }
  private addObjectToScene(object: THREE.Object3D, objectProportions: modelInterface, furnitureId: string, moveData?: objectLoadInterface) {
    object.userData = { id: furnitureId }
    this.scaleImportModel(object, objectProportions);
    this.scene.add(object)
    this.renderer.render(this.scene, this.camera);
    if (!moveData) return
    object.position.set(moveData.xDistance, 0, moveData.zDistance)
    object.rotation.y = moveData.yRotate

  }
  private getObjectSize(object: THREE.Object3D): { width: number; height: number; length: number } {
    const BOUNDING_BOX = new THREE.Box3().setFromObject(object);
    const SIZE = BOUNDING_BOX.getSize(new THREE.Vector3());
    return {
      width: SIZE.x,
      length: SIZE.z,
      height: SIZE.y
    };
  }
  private scaleImportModel(object: THREE.Object3D, objectProportions: modelInterface) {
    const UPLOAD_OBJECT_SIZE = this.getObjectSize(object);
    const RECTANGLE_SIZE = this.getObjectSize(this.rectangleMesh);
    const SCENE_PROPORTIONS_COEFFICIENT = UPLOAD_OBJECT_SIZE.width > UPLOAD_OBJECT_SIZE.length ? RECTANGLE_SIZE.width / UPLOAD_OBJECT_SIZE.width : RECTANGLE_SIZE.length / UPLOAD_OBJECT_SIZE.length;
    const REAL_PROPORTIONS_COEFFICIENT = UPLOAD_OBJECT_SIZE.width > UPLOAD_OBJECT_SIZE.length ? objectProportions.width / this.roomProportions.width : objectProportions.length / this.roomProportions.length;
    const GENERAL_COEFFICIENT = REAL_PROPORTIONS_COEFFICIENT * SCENE_PROPORTIONS_COEFFICIENT;
    object.scale.set(GENERAL_COEFFICIENT, GENERAL_COEFFICIENT, GENERAL_COEFFICIENT);
  }
  private async loadRoom(roomData: roomData) {
    const JWT = this.accountCookieService.getJwt()
    if (!JWT) return
    this.spinner.show()
    for (const object of roomData.objects) {
      await this.addModel(object.objectId, false, this.calculateMoveObjectData(object));
    }
    this.spinner.hide()
  }
  private clearRoom() {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const OBJECT = this.scene.children[i];
      if (OBJECT.type !== 'Scene' && OBJECT.type !== 'HemisphereLight') {
        this.scene.remove(OBJECT);
      }
    }
  }
  @HostListener('window:resize', ['$event'])
  private onResize(event: Event): void {
    this.renderer.setSize(window.innerWidth / this.canvasRatioOfWindow, window.innerHeight / this.canvasRatioOfWindow);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
  @HostListener('click', ['$event'])
  private onMouseClick(event: MouseEvent): void {
    if (this.targetobject) {
      this.targetobject = undefined;
      return;
    }
    const RECT = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const X = (event.clientX - RECT.left) / RECT.width * 2 - 1;
    const Y = -(event.clientY - RECT.top) / RECT.height * 2 + 1;

    this.mouse.x = X;
    this.mouse.y = Y;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const INTERSECTIONS = this.raycaster.intersectObjects(this.scene.children);

    const FOUND_INTERSECTION = INTERSECTIONS.find(intersect => {
      return intersect.object.name !== 'roomFloorBase' && intersect.object.type !== 'Scene' && intersect.object.type !== 'HemisphereLight'
    })?.object
    if (!FOUND_INTERSECTION) return
    this.targetobject = FOUND_INTERSECTION.parent ? FOUND_INTERSECTION.parent : FOUND_INTERSECTION
  }
  @HostListener('window:keydown', ['$event'])
  private rotateTargetObject(event: KeyboardEvent) {
    if (!this.targetobject) return
    let rotateAngle = -0.05

    switch (event.key) {
      case 'q':
      case 'й':
        this.targetobject.rotation.y -= rotateAngle
        break
      case 'e':
      case 'у':
        this.targetobject.rotation.y += rotateAngle
    }
  }
  @HostListener('mousemove', ['$event'])
  private onMousemove(event: MouseEvent): void {
    if (!this.targetobject) return;

    const RECT = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const X = (event.clientX - RECT.left) / RECT.width * 2 - 1;
    const Y = -(event.clientY - RECT.top) / RECT.height * 2 + 1;

    this.mouse.x = X;
    this.mouse.y = Y;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const INTERSECTIONS = this.raycaster.intersectObject(this.rectangleMesh);
    if (INTERSECTIONS.length === 0) return;

    const INTERSECTIONS_X = INTERSECTIONS[0].point.x;
    const INTERSECTION_Z = INTERSECTIONS[0].point.z;
    const RECTANGLE_MESH_SIZE = this.getObjectSize(this.rectangleMesh);
    const objectSize = this.getObjectSize(this.targetobject);

    const minX = -RECTANGLE_MESH_SIZE.width / 2 + objectSize.width / 2;
    const maxX = RECTANGLE_MESH_SIZE.width / 2 - objectSize.width / 2;

    let newXObjectPosition = INTERSECTIONS_X;
    if (newXObjectPosition < minX) {
      newXObjectPosition = minX;
    } else if (newXObjectPosition > maxX) {
      newXObjectPosition = maxX;
    }

    const MIN_Z = -RECTANGLE_MESH_SIZE.length / 2 + objectSize.length / 2;
    const MAX_Z = RECTANGLE_MESH_SIZE.length / 2 - objectSize.length / 2;

    let newZObjectPosition = INTERSECTION_Z;
    if (newZObjectPosition < MIN_Z) {
      newZObjectPosition = MIN_Z;
    } else if (newZObjectPosition > MAX_Z) {
      newZObjectPosition = MAX_Z;
    }

    this.targetobject.position.set(newXObjectPosition, 0, newZObjectPosition);
  }
  protected async getReport() {
    const JWT = this.accountCookieService.getJwt()
    if (!JWT || !this.roomData?._id) return

    const oldCameraPosition = this.camera.position.clone();
    const oldCameraRotation = this.camera.rotation.clone();

    this.camera.position.set(0, 7, 0)
    this.camera.rotation.set(THREE.MathUtils.degToRad(-90), 0, 0)
    this.renderer.render(this.scene, this.camera);
    const imageDataURL = this.renderer.domElement.toDataURL('image/png')
    const imageDataResponse = await fetch(imageDataURL)

    this.camera.position.copy(oldCameraPosition);
    this.camera.rotation.copy(oldCameraRotation);

    if (!imageDataResponse.ok) {
      this.errorHandler.setError('Ошибка при рендере', 5000)
    }
    const imageDataBlob = await imageDataResponse.blob()

    this.projectService.GETgetReportOfRoom(JWT, this.roomData?._id, imageDataBlob)
  }
  protected deleteModel() {
    if (this.targetobject) this.scene.remove(this.targetobject)
  }
  public saveRoom() {
    if (!this.roomData) return
    const OBJECTS_SCENE_ARRAY = this.scene.children.filter(object => {
      if (
        object.name !== 'roomFloorBase' &&
        object.type !== 'Scene' &&
        object.type !== 'HemisphereLight'
      ) {
        return true;
      }
      return false;
    })
      .map(object => {
        return this.calculateObjectSaveData(object)
      })
    const ROOM_OBJECTS_DATA = OBJECTS_SCENE_ARRAY
    this.roomData.objects = OBJECTS_SCENE_ARRAY
    this.saveObjectsEmitter.emit(ROOM_OBJECTS_DATA)
  }
}