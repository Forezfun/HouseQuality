import { Component, AfterViewInit, ElementRef, HostListener, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { roomData as roomDataPlan } from '../plan-house/plan-house.component';
import { loadModel } from './loaders';
import { FurnitureModelControlService } from '../../services/furniture-model-control.service';
import { UserCookieService } from '../../services/user-cookie.service';
import { FurnitureCardControlService } from '../../services/furniture-card-control.service';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderServiceControlService } from '../../services/loader-service-control.service';

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
  imports: [NgxSpinnerModule],
  templateUrl: './scene.component.html',
  styleUrls: ['./scene.component.scss']
})
export class SceneComponent implements AfterViewInit,OnInit {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private controls!: OrbitControls;
  private animationFrameId: number | null = null;
  private canvasRatioOfWindow = 1.5;
  private roomProportions!: modelInterface;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targetobject: THREE.Object3D | undefined = undefined;
  private rectangleMesh!: THREE.Mesh;
  @Input()
  roomData!: roomDataPlan | undefined
  @Input()
  furnitureId?: string
  @Output()
  saveObjectsEmitter = new EventEmitter<objectSceneInterface[]>()
  constructor(
    private elementRef: ElementRef,
    private spinner: NgxSpinnerService,
    private furnitureModelService: FurnitureModelControlService,
    private furnitureCardService: FurnitureCardControlService,
    private userCookieService: UserCookieService,
    private route: ActivatedRoute,
    private router: Router,
    private objLoaderService:LoaderServiceControlService
  ) { }
  ngAfterViewInit(): void {
    this.initThreeJs();
  }
  ngOnInit() {
    // this.objLoaderService.objectLoaded$.subscribe((data) => {
    //     if (data.success) {
    //         console.log('Model loaded:', data.object);
    //         // Здесь можно добавить модель в сцену three.js
    //     } else {
    //         console.error('Error loading model:', data.error);
    //     }
    // });
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.roomData = changes['roomData'].currentValue as roomDataPlan
    console.log(this.roomData, changes)
    console.log(this.roomData === changes['roomData'].previousValue)
    if (!this.roomData || this.scene === undefined || this.roomData === changes['roomData'].previousValue) return
    if(changes['roomData'].previousValue!==undefined){this.clearRoom()}
    this.camera.position.set(0, 5, 0)
    this.camera.rotation.set(THREE.MathUtils.degToRad(-90), 0, 0)
    this.roomProportions = this.roomData.roomProportions
    console.log(this.camera.position.y)
    this.createRoom();
    this.rectangleMesh.rotation.x = THREE.MathUtils.degToRad(-90)
    const LOAD_OBJECT: roomData = {
      objects: this.roomData.objects,
      ...this.roomData.roomProportions
    }
    console.log('hi')
    if (this.getObjectSize(this.rectangleMesh).width === 0) return
    this.loadRoom(LOAD_OBJECT)
    const furnitureId = this.route.snapshot.params['furnitureId']
    if (!furnitureId||changes['roomData'].previousValue) return
    this.spinner.show()
    this.addModel(furnitureId,true)
  }
  addModel(furnitureId: string, saveRoom:boolean,moveData?: objectLoadInterface) {
    const jwt = this.userCookieService.getJwt()
    if (!jwt) return
    this.furnitureCardService.GETfurnitureCard(furnitureId)
    .subscribe({
    next: async (response) => {
      console.log(response)
      const proportions = (response as any).furnitureCard.proportions
      const modelBlobUrl = this.furnitureModelService.GETfurnitureModel(jwt, furnitureId)
      const blob: Blob = await firstValueFrom(modelBlobUrl);
      
          this.loadFurnitureModel(blob, proportions, furnitureId,saveRoom,moveData)
        },
        error: (error) => {
          console.log(error)
        }
      })

  }
  private initThreeJs(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 2);
    this.scene.add(hemisphereLight);
    this.renderer = new THREE.WebGLRenderer({ alpha: true });
    const canvasContainer = this.elementRef.nativeElement.querySelector('#canvasContainer');
    this.camera.position.z = 5;
    this.renderer.setSize(window.innerWidth / this.canvasRatioOfWindow, window.innerHeight / this.canvasRatioOfWindow);
    canvasContainer.appendChild(this.renderer.domElement);
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  private createRoundedRectangleGeometry(width: number, height: number, radius: number, segments: number): THREE.BufferGeometry {
    // Создаем форму с закругленными углами
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2 + radius, -height / 2); // Начало с нижнего левого угла
    shape.lineTo(width / 2 - radius, -height / 2); // Нижняя линия
    shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius); // Нижний правый угол
    shape.lineTo(width / 2, height / 2 - radius); // Правая линия
    shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2); // Верхний правый угол
    shape.lineTo(-width / 2 + radius, height / 2); // Верхняя линия
    shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius); // Верхний левый угол
    shape.lineTo(-width / 2, -height / 2 + radius); // Левая линия
    shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2); // Нижний левый угол

    // Создаем геометрию на основе формы
    const geometry = new THREE.ShapeGeometry(shape, segments);

    return geometry;
  }


  createRoom(): void {
    if (!this.roomData) return
    const roomProportions = this.roomData.roomProportions
    const radius = 0.1
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.15;
    this.controls.enableZoom = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    const paddingPolarAngle = 5;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90 - paddingPolarAngle);
    this.createRoomShape(roomProportions.width, roomProportions.length, radius);
    this.rectangleMesh.name = 'roomFloorBase';
    this.rectangleMesh
  }

  calculateObjectSaveData(object: THREE.Object3D) {
    const floorSize = this.getObjectSize(this.rectangleMesh)
    const objectPosition = object.position
    const objectSaveData: objectSceneInterface = {
      objectId: (object.userData as any).id,
      xMetersDistance: objectPosition.x / floorSize.width * this.roomProportions.width,
      zMetersDistance: objectPosition.z / floorSize.length * this.roomProportions.length,
      yRotate: object.rotation.y
    }
    console.log(objectPosition.y, floorSize.length, this.roomProportions.length)
    return objectSaveData
  }
  calculateMoveObjectData(objectSaveData: objectSceneInterface): objectLoadInterface {
    console.log(objectSaveData)
    const floorSize = this.getObjectSize(this.rectangleMesh)
    return {
      xDistance: objectSaveData.xMetersDistance * floorSize.width / this.roomProportions.width,
      zDistance: objectSaveData.zMetersDistance * floorSize.length / this.roomProportions.length,
      yRotate: objectSaveData.yRotate
    }
  }
  @HostListener('click', ['$event'])
  onMouseClick(event: MouseEvent): void {
    if (this.targetobject) { this.targetobject = undefined; return; }
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = -(event.clientY - rect.top) / rect.height * 2 + 1;

    this.mouse.x = x;
    this.mouse.y = y;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(this.scene.children);

    const foundIntersetc = intersects.find(intersect => {
      return intersect.object.name !== 'roomFloorBase' && intersect.object.type !== 'Scene' && intersect.object.type !== 'HemisphereLight'
    })?.object
    if (!foundIntersetc) return
    this.targetobject = foundIntersetc.parent ? foundIntersetc.parent : foundIntersetc
    console.log(this.targetobject)
  }
  @HostListener('window:keydown', ['$event'])
  rotateTargetObject(event: KeyboardEvent) {
    if (!this.targetobject) return
    let rotateAngle = -0.05

    console.log(this.camera.rotation.z)
    console.log(rotateAngle)

    switch (event.key) {
      case 'q':
      case 'й':
        this.targetobject.rotation.y -= rotateAngle
        break
      case 'e':
      case 'у':
        this.targetobject.rotation.y += rotateAngle
    }
    console.log(event)
  }
  @HostListener('mousemove', ['$event'])
  onMousemove(event: MouseEvent): void {
    if (!this.targetobject) return;

    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = -(event.clientY - rect.top) / rect.height * 2 + 1;

    this.mouse.x = x;
    this.mouse.y = y;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObject(this.rectangleMesh);
    if (intersects.length === 0) return;

    const intersectX = intersects[0].point.x;
    const intersectZ = intersects[0].point.z;
    const rectangleMeshSize = this.getObjectSize(this.rectangleMesh);
    const objectSize = this.getObjectSize(this.targetobject);

    const minX = -rectangleMeshSize.width / 2 + objectSize.width / 2;
    const maxX = rectangleMeshSize.width / 2 - objectSize.width / 2;

    let newXObjectPosition = intersectX;
    if (newXObjectPosition < minX) {
      newXObjectPosition = minX;
    } else if (newXObjectPosition > maxX) {
      newXObjectPosition = maxX;
    }

    const minZ = -rectangleMeshSize.length / 2 + objectSize.length / 2;
    const maxZ = rectangleMeshSize.length / 2 - objectSize.length / 2;

    let newZObjectPosition = intersectZ;
    if (newZObjectPosition < minZ) {
      newZObjectPosition = minZ;
    } else if (newZObjectPosition > maxZ) {
      newZObjectPosition = maxZ;
    }

    this.targetobject.position.set(newXObjectPosition, 0, newZObjectPosition);
  }



  private createRoomShape(widthRatio: number, heightRatio: number, radius: number): void {
    const cameraFrustumBounds = this.calculateFrustumBounds();
    const shapeRatio = widthRatio / heightRatio;
    let width: number, height: number;

    if (shapeRatio <= 1) {
      width = cameraFrustumBounds.height * shapeRatio;
      height = cameraFrustumBounds.height;
    } else {
      width = cameraFrustumBounds.width;
      height = cameraFrustumBounds.width / shapeRatio;
    }
    console.log(cameraFrustumBounds, width, height)
    const segments = 10;
    const geometry = this.createRoundedRectangleGeometry(width * 0.9, height * 0.9, radius, segments);
    const material = new THREE.MeshBasicMaterial({ color: 3427905 });

    this.rectangleMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.rectangleMesh)
    this.renderer.render(this.scene, this.camera);
    this.rectangleMesh.updateMatrixWorld(true);
  }

  private calculateFrustumBounds(): { width: number; height: number } {
    const cameraY = this.camera.position.y;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    console.log(cameraY, fovRad)
    const frustumHeight = 2 * Math.tan(fovRad / 2) * Math.abs(cameraY);
    const frustumWidth = frustumHeight * this.camera.aspect;

    return { width: frustumWidth, height: frustumHeight };
  }


  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.renderer.setSize(window.innerWidth / this.canvasRatioOfWindow, window.innerHeight / this.canvasRatioOfWindow);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  }
  addObjectToScene(object: THREE.Object3D, objectProportions: modelInterface, furnitureId: string, moveData?: objectLoadInterface) {
    object.userData = { id: furnitureId }
    this.scaleImportModel(object, objectProportions);
    this.scene.add(object)
    this.renderer.render(this.scene, this.camera);
    if (!moveData) return
    object.position.set(moveData.xDistance, 0, moveData.zDistance)
    object.rotation.y = moveData.yRotate

  }
  async loadFurnitureModel(fileModel: Blob, furnitureSize: modelInterface, furnitureId: string,saveRoom:boolean,moveData?: objectLoadInterface) {
    console.log('loadModel')
    this.spinner.show()
    try{
      const LOAD_OBJECT = await loadModel(fileModel)
      
    if (moveData) { this.addObjectToScene(LOAD_OBJECT, furnitureSize, furnitureId, moveData) } else { this.addObjectToScene(LOAD_OBJECT, furnitureSize, furnitureId) }
    this.spinner.hide()
    if(saveRoom)this.saveRoom()
    }catch(error){
      this.spinner.hide()
    }
    // this.objLoaderService.loadModel(fileModel)
  }

  private getObjectSize(object: THREE.Object3D): { width: number; height: number; length: number } {
    const boundingBox = new THREE.Box3().setFromObject(object);
    const size = boundingBox.getSize(new THREE.Vector3());
    return {
      width: size.x,
      length: size.z,
      height: size.y
    };
  }

  private scaleImportModel(object: THREE.Object3D, objectProportions: modelInterface) {
    const uploadObjectSize = this.getObjectSize(object);
    console.log(this.rectangleMesh)
    const rectangleSize = this.getObjectSize(this.rectangleMesh);
    console.log(uploadObjectSize, rectangleSize);
    console.log(objectProportions, this.roomProportions)
    const sceneProportionsСoefficient = uploadObjectSize.width > uploadObjectSize.length ? rectangleSize.width / uploadObjectSize.width : rectangleSize.length / uploadObjectSize.length;
    const realProportionsСoefficient = uploadObjectSize.width > uploadObjectSize.length ? objectProportions.width / this.roomProportions.width : objectProportions.length / this.roomProportions.length;
    const generalСoefficient = realProportionsСoefficient * sceneProportionsСoefficient;
    console.log(sceneProportionsСoefficient, realProportionsСoefficient, generalСoefficient);
    object.scale.set(generalСoefficient, generalСoefficient, generalСoefficient);
  }
  saveRoom() {
    if (!this.roomData) return
    const objectsSceneArray = this.scene.children.filter(object => {
      if (
        object.name !== 'roomFloorBase' &&
        object.type !== 'Scene' &&
        object.type !== 'HemisphereLight'
      ) {
        return true;
      }
      console.log(object);
      return false;
    })
      .map(object => {
        return this.calculateObjectSaveData(object)
      })
    const roomDataObjects = objectsSceneArray
    console.log(roomDataObjects)
    this.roomData.objects = objectsSceneArray
    this.saveObjectsEmitter.emit(roomDataObjects)
  }
  loadRoom(roomData: roomData) {
    console.log('load')
    const jwt = this.userCookieService.getJwt()
    if (!jwt) return
    roomData.objects.forEach(object => {
      this.addModel(object.objectId,false, this.calculateMoveObjectData(object))
    })
  }
  clearRoom() {
    console.log(this.scene.children)
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      const object = this.scene.children[i];
      if (object.type !== 'Scene' && object.type !== 'HemisphereLight') {
        console.log(object);
        this.scene.remove(object);
      }
    }
  }
}