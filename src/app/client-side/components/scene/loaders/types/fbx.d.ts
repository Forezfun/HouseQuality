declare module 'three/examples/jsm/loaders/FBXLoader' {
    import { Group, Loader, LoadingManager } from 'three';

    export class FBXLoader extends Loader {
        constructor(manager?: LoadingManager);

        // Метод для загрузки FBX файла
        load(
            url: string,
            onLoad?: (object: Group) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (error: Error) => void
        ): void;

        // Метод для синхронной загрузки
        parse(FBXBuffer: ArrayBuffer, path: string): Group;
    }
}
