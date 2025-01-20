import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LoadingManager, Object3D } from 'three';

export function loadGLTFModel(url: string, manager?: LoadingManager): Promise<Object3D> {
    const loader = new GLTFLoader(manager);
    return new Promise((resolve, reject) => {
        loader.load(
            url,
            (gltf: GLTF) => {
                resolve(gltf.scene);
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
