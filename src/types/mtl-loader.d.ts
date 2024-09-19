declare module 'three/examples/jsm/loaders/MTLLoader' {
    import { MaterialCreator } from 'three';
    import { Loader, LoadingManager } from 'three';
    
    export class MTLLoader extends Loader {
      constructor(manager?: LoadingManager);
  
      // API
      texturePath: string;
      materials: MaterialCreator;
  
      // метод для загрузки MTL файла
      load(
        url: string,
        onLoad?: (materials: MaterialCreator) => void,
        onProgress?: (event: ProgressEvent) => void,
        onError?: (error: Error) => void
      ): void;
  
      // методы для обработки текстур
      setPath(path: string): this;
      setResourcePath(path: string): this;
      setBaseUrl(url: string): this;
      setMaterialOptions(options: object): this;
    }
  }
  