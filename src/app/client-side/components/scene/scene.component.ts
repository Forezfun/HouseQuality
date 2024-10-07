import { Component, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

export interface modelInterface {
  width: number;
  height: number;
  length: number;
}
interface objectSceneInterface {
  objectId: number;
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
export class SceneComponent implements AfterViewInit {
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private controls!: OrbitControls;
  private animationFrameId: number | null = null;
  private canvasRatioOfWindow = 2;
  private roomProportions!: modelInterface;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private targetobject: THREE.Object3D | undefined = undefined;
  private rectangleMesh!: THREE.Mesh;
  private objectroom = 0
  constructor(
    private elementRef: ElementRef,
    private spinner: NgxSpinnerService
  ) { }

  ngAfterViewInit(): void {
    this.initThreeJs();
    this.createRoom();
    this.rectangleMesh.rotation.x = THREE.MathUtils.degToRad(-90)
    this.camera.rotation.set(THREE.MathUtils.degToRad(-90), 0, 0)
    this.camera.position.set(0, 5, 0)
  }
  showInputInf(){
    const input = this.elementRef.nativeElement.querySelector('.input') as HTMLInputElement
      
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

  private pixelsToWorldUnits(pixels: number, isWidth: boolean): number {
    const canvas = this.renderer.domElement;
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const aspectRatio = canvasWidth / canvasHeight;

    const frustumHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    const frustumWidth = frustumHeight * aspectRatio;

    return isWidth ? (pixels / canvasWidth) * frustumWidth : (pixels / canvasHeight) * frustumHeight;
  }

  private createRoundedRectangleGeometry(width: number, height: number, radius: number, segments: number): THREE.BufferGeometry {
    const pi2 = Math.PI * 2;
    const n = (segments + 1) * 4;
    const indices: number[] = [];
    const positions: number[] = [];
    const uvs: number[] = [];
    let qu: number, sgx: number, sgy: number, x: number, y: number;

    for (let j = 1; j < n + 1; j++) indices.push(0, j, j + 1);
    indices.push(0, n, 1);
    positions.push(0, 0, 0);
    uvs.push(0.5, 0.5);

    for (let j = 0; j < n; j++) {
      qu = Math.trunc(4 * j / n) + 1;
      sgx = (qu === 1 || qu === 4 ? 1 : -1);
      sgy = qu < 3 ? 1 : -1;
      x = sgx * (width / 2 - radius) + radius * Math.cos(pi2 * (j - qu + 1) / (n - 4));
      y = sgy * (height / 2 - radius) + radius * Math.sin(pi2 * (j - qu + 1) / (n - 4));
      positions.push(x, y, 0);
      uvs.push(0.5 + x / width, 0.5 + y / height);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));

    geometry.computeBoundingSphere();

    return geometry;
  }

  createRoom(): void {
    const radiusPixels = 10;
    this.roomProportions = {
      width: 2,
      height: 2,
      length: 4
    }
    const radiusWorldUnits = this.pixelsToWorldUnits(radiusPixels, true);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.15;
    this.controls.enableZoom = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
    const paddingPolarAngle = 5;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(90 - paddingPolarAngle);
    this.createRoomShape(this.roomProportions.width, this.roomProportions.length, radiusWorldUnits);
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

    const segments = 10;
    const geometry = this.createRoundedRectangleGeometry(width * 0.9, height * 0.9, radius, segments);
    const material = new THREE.MeshBasicMaterial({ color: 3427905 });

    this.rectangleMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.rectangleMesh)
    this.renderer.render(this.scene, this.camera);
    this.rectangleMesh.updateMatrixWorld(true);
  }

  private calculateFrustumBounds(): { width: number; height: number } {
    const cameraZ = this.camera.position.z;
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const frustumHeight = 2 * Math.tan(fovRad / 2) * Math.abs(cameraZ);
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
  addObjectToScene(object: THREE.Object3D, moveData?: objectLoadInterface) {
    this.objectroom++
    object.userData = { id: this.objectroom }
    this.scaleImportModel(object, { width: 1, height: 1, length: 2 });
    this.scene.add(object)
    this.renderer.render(this.scene, this.camera);
    this.spinner.hide()
    if (!moveData) return
    object.position.set(moveData.xDistance, 0, moveData.zDistance)
    object.rotation.y = moveData.yRotate

  }
  load3Model(moveData?: objectLoadInterface): void {
    this.spinner.show()
    const objLoader = new OBJLoader();
        objLoader.load(
          '/assets/models/sofa/sofa.obj',
          (object: THREE.Object3D) => {
            if (moveData) { this.addObjectToScene(object, moveData); return }
            this.addObjectToScene(object)
          },
          (xhr) => { },
          (error) => {
            console.log(error)
            this.spinner.hide()
          }
        );
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

  private scaleImportModel(object: THREE.Object3D, objecProportions: modelInterface) {
    const uploadObjectSize = this.getObjectSize(object);
    const rectangleSize = this.getObjectSize(this.rectangleMesh);
    console.log(uploadObjectSize, rectangleSize);
    const sceneProportionsСoefficient = uploadObjectSize.width > uploadObjectSize.length ? rectangleSize.width / uploadObjectSize.width : rectangleSize.length / uploadObjectSize.length;
    const realProportionsСoefficient = uploadObjectSize.width > uploadObjectSize.length ? objecProportions.width / this.roomProportions.width : objecProportions.length / this.roomProportions.length;
    const generalСoefficient = realProportionsСoefficient * sceneProportionsСoefficient;
    console.log(generalСoefficient);
    object.scale.set(generalСoefficient, generalСoefficient, generalСoefficient);
  }
  saveRoom() {
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
    const roomDataObject: roomData = {
      ...this.roomProportions,
      objects: objectsSceneArray
    }
    console.log(roomDataObject)
  }
  loadRoom(roomData?: roomData) {
    this.scene.children.forEach(object => {
      if (
        object.name !== 'roomFloorBase' &&
        object.type !== 'Scene' &&
        object.type !== 'HemisphereLight'
      ) {
        object.visible = false;
      }
    });
  
    const testObject = {
      width: 2,
      height: 2,
      length: 4,
      objects: [
        {
          objectId: 1,
          xMetersDistance: 0.030890646771192316,
          zMetersDistance: 1.6543475673001313,
          yRotate: 3.149999999999997
        },
        {
          objectId: 2,
          xMetersDistance: -0.6910647964163139,
          zMetersDistance: 1.0515935019098934,
          yRotate: 1.6500000000000008
        }
      ]
    };
  
    let objectsLoaded = 0;
  
    const onObjectLoaded = () => {
      objectsLoaded++;
      if (objectsLoaded === testObject.objects.length) {
        this.clearRoom(); 
      }
    };
  
    testObject.objects.forEach(savedObject => {
      const moveData = this.calculateMoveObjectData(savedObject);
      this.load3Model(moveData);
      onObjectLoaded();
    });
  }
  
  private clearRoom() {
    this.scene.children.forEach(object => {
      if (
        object.name !== 'roomFloorBase' &&
        object.type !== 'Scene' &&
        object.type !== 'HemisphereLight'
      ) {
        this.scene.remove(object);
      }
    });
    this.renderer.render(this.scene, this.camera);
  }
}