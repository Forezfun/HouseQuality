import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
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
            (error: Error) => {
                reject(error);
            }
        );
    });
}
