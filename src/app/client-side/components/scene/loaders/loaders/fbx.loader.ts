import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Group, LoadingManager, Object3D } from 'three';

export function loadFBXModel(url: string, manager?: LoadingManager): Promise<Object3D> {
    const loader = new FBXLoader(manager);
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (object: Group) => {
                resolve(object);
            },
            undefined,
            (error: unknown) => {
                if (error instanceof Error) {
                    reject(error);
                } else {
                    reject(new Error('An unknown error occurred'));
                }
            }
        );
    });
}
