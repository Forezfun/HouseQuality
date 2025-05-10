declare module 'three/examples/jsm/loaders/GLTFLoader' {
    import { AnimationClip, Loader, LoadingManager, Material, Mesh, Scene, Texture } from 'three';

    export interface GLTF {
        animations: AnimationClip[];
        scene: Scene;
        scenes: Scene[];
        cameras: Camera[];
        asset: object;
        parser: object;
        accountData: object;
    }

    export class GLTFLoader extends Loader {
        constructor(manager?: LoadingManager);

        // Метод для загрузки GLTF/GLB файла
        load(
            url: string,
            onLoad?: (gltf: GLTF) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (error: Error) => void
        ): void;

        // Метод для синхронной загрузки
        parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: GLTF) => void, onError?: (error: Error) => void): void;

        // Дополнительные методы
        setDRACOLoader(dracoLoader: object): this;
        setMeshoptDecoder(meshoptDecoder: object): this;
    }
}
