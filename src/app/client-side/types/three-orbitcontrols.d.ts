declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, Object3D, TOUCH, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
      constructor(object: Camera, domElement?: HTMLElement);

      object: Camera;
      domElement: HTMLElement | Document;

      // API
      enabled: boolean;
      target: Vector3;

      // установите элемент управления, чтобы он «гасил» (автоматическое прекращение вращения)
      enableDamping: boolean;
      dampingFactor: number;

      // вращение камеры вокруг цели
      enableRotate: boolean;
      rotateSpeed: number;
      // ключи для вращения
      keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number };

      // ограничения углов
      maxPolarAngle?: number; // максимальный угол по вертикали (в радианах)
      minPolarAngle?: number; // минимальный угол по вертикали (в радианах)
      maxAzimuthAngle?: number; // максимальный угол по горизонтали (в радианах)
      minAzimuthAngle?: number; // минимальный угол по горизонтали (в радианах)

      // дополнительные свойства
      enableZoom?: boolean; // возможность зума
      minDistance?: number; // минимальное расстояние до объекта
      maxDistance?: number; // максимальное расстояние до объекта

      // методы
      saveState(): void;
      update(): void;
      reset(): void;
      dispose(): void;
      rotateLeft(number): void;
      rotateRight(number): void;
  }
}
