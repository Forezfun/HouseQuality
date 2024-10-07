declare module 'three/examples/jsm/postprocessing/OutlinePass' {
    import { Pass } from 'three/examples/jsm/postprocessing/Pass';
    import { Vector2, Scene, Camera, Mesh, WebGLRenderer, Color, WebGLRenderTarget } from 'three';
  
    export class OutlinePass extends Pass {
      constructor(size: Vector2, scene: Scene, camera: Camera, selectedObjects?: Mesh[]);
      selectedObjects: Mesh[];
      renderScene: Scene;
      renderCamera: Camera;
      visibleEdgeColor: Color;
      hiddenEdgeColor: Color;
      edgeGlow: number;
      usePatternTexture: boolean;
      edgeThickness: number;
      edgeStrength: number;
      downSampleRatio: number;
      pulsePeriod: number;
      resolution: Vector2;
      patternTexture: any; // Add appropriate type if needed
  
      render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime?: number): void;
      setSize(width: number, height: number): void;
      changeVisibilityOfSelectedObjects(bVisible: boolean): void;
      updateEdgeDetectionMaterial(): void;
      dispose(): void;
    }
  }
  