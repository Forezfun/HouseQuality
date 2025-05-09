import { LoadingManager,Object3D } from 'three';
import { loadGLTFModel } from './loaders/gltf-glb.loader';
import { loadFBXModel } from './loaders/fbx.loader';
import { loadOBJModel } from './loaders/obj.loader';

export async function loadModel(blob: Blob, manager?: LoadingManager): Promise<Object3D> {
    // Определяем MIME-тип файла из Blob
    const mimeType = blob.type;
    let extension: string | undefined;
    console.log(blob)
    // Определяем расширение на основе MIME-типа
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

    // Создаём временный URL из Blob
    const url = URL.createObjectURL(blob);
    let loaderPromise: Promise<Object3D>;

    try {
        // Используем соответствующий загрузчик на основе расширения
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
        // Освобождаем URL после завершения загрузки
        URL.revokeObjectURL(url);
    }
}

