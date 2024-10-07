declare module 'three/examples/jsm/loaders/OBJLoader' {
  import * as THREE from 'three';
  import { MaterialCreator } from 'three/examples/jsm/loaders/MTLLoader';

  export class OBJLoader extends THREE.Loader {
    constructor(manager?: THREE.LoadingManager);
    
    // Метод для загрузки OBJ файла
    load(
      url: string,
      onLoad: (object: THREE.Group) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    
    // Метод для парсинга данных OBJ
    parse(data: string): THREE.Group;
    
    // Метод для установки материалов на объект
    setMaterials(materials: MaterialCreator): this;
  }
}
