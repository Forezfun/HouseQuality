declare module 'three/examples/jsm/postprocessing/EffectComposer' {
    import { WebGLRenderer, WebGLRenderTarget } from 'three';
    import { Pass } from 'three/examples/jsm/postprocessing/Pass';
  
    export class EffectComposer {
      constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
      renderer: WebGLRenderer;
      renderTarget1: WebGLRenderTarget;
      renderTarget2: WebGLRenderTarget;
      writeBuffer: WebGLRenderTarget;
      readBuffer: WebGLRenderTarget;
      passes: Pass[];
      copyPass: Pass;
      isActive: boolean;
  
      swapBuffers(): void;
      addPass(pass: Pass): void;
      insertPass(pass: Pass, index: number): void;
      removePass(pass: Pass): void;
      render(deltaTime?: number): void;
      reset(renderTarget?: WebGLRenderTarget): void;
      setSize(width: number, height: number): void;
      setPixelRatio(pixelRatio: number): void;
      dispose(): void;
    }
  }
  