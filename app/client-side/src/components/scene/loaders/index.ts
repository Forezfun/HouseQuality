import { LoadingManager, Object3D } from 'three';
import { loadGLTFModel } from './loaders/gltf-glb.loader';
import { loadFBXModel } from './loaders/fbx.loader';
import { loadOBJModel } from './loaders/obj.loader';
/**
 * Загружает 3D-модель из Blob-объекта, определяя её формат по MIME-типу.
 * 
 * Поддерживаются форматы: glTF/glb, FBX, OBJ.
 * 
 * @param {Blob} blob - Файл модели в виде Blob.
 * @param {LoadingManager} [manager] - Необязательный менеджер загрузки для отслеживания прогресса.
 * 
 * @returns {Promise<Object3D>} Загруженная 3D-модель как объект Three.js.
 * 
 * @throws {Error} Если тип файла не удалось определить или формат не поддерживается.
 */
export async function loadModel(blob: Blob, manager?: LoadingManager): Promise<Object3D> {
    const mimeType = blob.type;
    let extension: string | undefined;

    if (mimeType.includes('gltf') || mimeType.includes('glb')) {
        extension = 'gltf';
    } else if (mimeType.includes('fbx')) {
        extension = 'fbx';
    } else if (mimeType.includes('obj')) {
        extension = 'obj';
    }

    if (!extension) {
        throw new Error('Не удалось определить тип модели по MIME-типу.');
    }

    const url = URL.createObjectURL(blob);
    let loaderPromise: Promise<Object3D>;

    try {

        switch (extension) {
            case 'gltf':
            case 'glb':
                loaderPromise = loadGLTFModel(url, manager);
                break;
            case 'fbx':
                loaderPromise = loadFBXModel(url, manager);
                break;
            case 'obj':
                loaderPromise = loadOBJModel(url, manager);
                break;
            default:
                throw new Error('Не поддерживаемый формат модели: ' + extension);
        }

        const model = await loaderPromise;
        return model;
    } finally {

        URL.revokeObjectURL(url);
    }
}

