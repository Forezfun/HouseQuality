import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Group, LoadingManager, Object3D } from 'three';

export async function loadOBJModel(url: string, manager?: LoadingManager): Promise<Object3D> {
    const loader = new OBJLoader(manager);
    try {
        const object = await new Promise<Group>((resolve, reject) => {
            loader.load(
                url,
                (object: Group) => {
                    resolve(object);
                },
                undefined,
                (event: ErrorEvent) => {  // Обработка ошибки
                    reject(new Error(event.message));
                }
            );
        });
        return object;
    } catch (error) {
        console.error('Error loading OBJ model:', error);
        throw error;
    }
}
