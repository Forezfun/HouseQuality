declare module 'three/examples/jsm/postprocessing/RenderPass' {
    import { Pass } from 'three/examples/jsm/postprocessing/Pass';
    import { Scene, Camera } from 'three';
  
    export class RenderPass extends Pass {
      constructor(scene: Scene, camera: Camera, overrideMaterial?: any, clearColor?: any, clearAlpha?: number);
      scene: Scene;
      camera: Camera;
      overrideMaterial: any;
      clearColor: any;
      clearAlpha: number;
      clearDepth: boolean;
  
      render(): void;
    }
  }
  