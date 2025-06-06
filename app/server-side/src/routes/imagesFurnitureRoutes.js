const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.use(async (request, result, next) => {
    try {
        if (request.method !== 'GET') {
            const jwt = request.query.jwt;
            const accountId = await checkUserAccess(jwt);
            if (!accountId) return result.status(404).json({ message: 'Аккаунт не найден' });
            request.query.accountId = accountId;
            const furnitureCard = await FURNITURE_CARD.findById(request.query.furnitureCardId);
            if (!furnitureCard) return result.status(404).json({ message: 'Товар не найден' });
        }
        if (request.method == 'POST') {
            const { furnitureCardId, color, idMainImage } = request.query;
            if (!furnitureCardId || !color || idMainImage === undefined) return result.status(400).json({ message: 'Отсутствуют требуемые данные' });
            const projectDir = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
            const colorDir = path.join(projectDir, color);
            if (fs.existsSync(colorDir)) {
                fs.rmSync(colorDir, { recursive: true });
                fs.mkdirSync(colorDir, { recursive: true });
            }
        }
        next();
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при валидации: ' + error.message });
    }
});


function ensureProjectAndColorDirectories(furnitureCardId, color) {
    if (!furnitureCardId || !color) {
        throw new Error('Отсутствуют требуемые данные');
    }

    const PROJECT_DIR = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
    const COLOR_DIR = path.join(PROJECT_DIR, color);

    if (!fs.existsSync(PROJECT_DIR)) {
        fs.mkdirSync(PROJECT_DIR, { recursive: true });
    }

    if (!fs.existsSync(COLOR_DIR)) {
        fs.mkdirSync(COLOR_DIR, { recursive: true });
    }

    return COLOR_DIR;
}


const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        const { furnitureCardId, color } = request.query;

        if (!furnitureCardId || !color) {
            return cb(new Error('Отсутствуют требуемые данные'));
        }

        const COLOR_DIR = ensureProjectAndColorDirectories(furnitureCardId, color);
        cb(null, COLOR_DIR);
    },
    filename: (request, file, cb) => {
        const EXTENSION = path.extname(file.originalname).toLowerCase() || '.jpg';
        const UNIQUE_SUFFIX = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const FILE_NAME = UNIQUE_SUFFIX + EXTENSION;
        cb(null, FILE_NAME);
    }
});


const upload = multer({ storage: storage }).array('images', 10);

/**
 * @function GET /furniture/images/main
 * @instance
 * @memberof module:furnitureCard
 * @summary Получение главного изображения по цвету карточки мебели
 * @param {string} furnitureCardId - ID карточки мебели
 * @param {string} color - Цвет мебели
 * @returns {File} Главное изображение
 * @example
 * response - 200 - Главное изображение отправлено
 * response - 400 - Неверные или неполные параметры запроса
 * {
 *   "message": "Отсутствуют требуемые данные"
 * }
 * response - 404 - Изображение не найдено
 * {
 *   "message": "Товар не найден" | "Цвет не найден" | "Изображения не найдены" | "Файл не найден"
 * }
 * response - 500 - Внутренняя ошибка сервера
 * {
 *   "message": "Ошибка при получении"
 * }
 */
ROUTER.get('/main', async (request, result) => {
    try {
        const { furnitureCardId, color } = request.query;

        if (!furnitureCardId || !color) {
            return result.status(400).json({ message: 'Отсутствуют требуемые данные' });
        }
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)
        if (!FURNITURE_CARD_ITEM) {
            return result.status(404).json({ message: 'Товар не найден' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color)
        if (INDEX_COLOR === undefined) {
            return result.status(404).json({ message: 'Цвет не найден' });
        }
        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findById(ID_IMAGES)
        if (!IMAGES_FURNITURE_ITEM) {
            return result.status(404).json({ message: 'Изображения не найдены' });
        }
        const MAIN_IMAGE_NAME = IMAGES_FURNITURE_ITEM.images[IMAGES_FURNITURE_ITEM.idMainImage].filename
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        const FILE_PATH = path.join(DIRECTORY, MAIN_IMAGE_NAME);

        if (!fs.existsSync(FILE_PATH)) {
            return result.status(404).json({ message: 'Файл не найден' });
        }
        result.sendFile(FILE_PATH);
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при получении: ' + error.message });
    }
});
/**
 * @function GET /furniture/images/simple
 * @instance
 * @memberof module:furnitureCard
 * @summary Получение изображения по ID из массива изображений
 * @param {string} furnitureCardId - ID карточки мебели
 * @param {string} color - Цвет мебели
 * @param {string} idImage - Индекс изображения в массиве
 * @returns {File} Изображение
 * @example
 * response - 200 - Изображение отправлено
 * response - 404 - Изображение не найдено
 * {
 *   "message": "Изображения не найдены" | "Файл не найден на сервере"
 * }
 * response - 500 - Внутренняя ошибка сервера
 * {
 *   "message": "Ошибка при получении: <текст ошибки>"
 * }
 */
ROUTER.get('/simple', async (request, result) => {
    try {
        const { furnitureCardId, color, idImage } = request.query;
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({ furnitureCardId: furnitureCardId, color: color })
        if (!IMAGES_FURNITURE_ITEM) return result.status(404).json({ message: 'Изображения не найдены' })

        const IMAGE_NAME = IMAGES_FURNITURE_ITEM.images[idImage].filename
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        const FILE_PATH = path.join(DIRECTORY, IMAGE_NAME);

        if (fs.existsSync(FILE_PATH)) {
            result.sendFile(FILE_PATH);
        } else {
            result.status(404).json({ message: 'Файл не найден на сервере' });
        }
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при получении: ' + error.message });
    }
});
/**
 * @function GET /furniture/images/all
 * @instance
 * @memberof module:furnitureCard
 * @summary Получение всех изображений и главного изображения по карточке и цвету
 * @param {string} furnitureCardId - ID карточки мебели
 * @param {string} color - Цвет мебели
 * @returns {object} Объект с путями к изображениям и ID главного изображения
 * @example
 * response - 200 - Успешное получение изображений
 * {
 *   "imagesURLS": ["uploads/cards/123/red/img1.jpg", ...],
 *   "idMainImage": 0
 * }
 * response - 400 - Неверные или неполные параметры запроса
 * {
 *   "message": "Отсутствуют требуемые данные"
 * }
 * response - 404 - Изображения не найдены
 * {
 *   "message": "Товар не найден" | "Цвет не найден" | "Изображения не найдены"
 * }
 * response - 500 - Внутренняя ошибка сервера
 * {
 *   "message": "Ошибка при получении: <текст ошибки>"
 * }
 */
ROUTER.get('/all', async (request, result) => {
    try {
        const { furnitureCardId, color } = request.query;


        if (!furnitureCardId || !color) {
            return result.status(400).json({ message: 'Отсутствуют требуемые данные' });
        }


        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)

        if (!FURNITURE_CARD_ITEM) {
            return result.status(404).json({ message: 'Товар не найден' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color)
        if (INDEX_COLOR === undefined) {
            return result.status(404).json({ message: 'Товар не найден' });
        }
        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findById(ID_IMAGES)
        if (!IMAGES_FURNITURE_ITEM) {
            return result.status(404).json({ message: 'Товар не найден' });
        }
        let furnitureImagesPathArray = []
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        IMAGES_FURNITURE_ITEM.images.forEach(imageData => furnitureImagesPathArray.push(path.join(DIRECTORY, imageData.filename)))

        result.status(200).json({ imagesURLS: furnitureImagesPathArray, idMainImage: IMAGES_FURNITURE_ITEM.idMainImage });
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при получении: ' + error.message });
    }
});
/**
 * @function POST /furniture/images/upload
 * @instance
 * @memberof module:furnitureCard
 * @summary Загрузка изображений и установка главного изображения
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели
 * @param {string} color - Цвет мебели
 * @param {string} idMainImage - Индекс главного изображения
 * @param {array} images - Массив изображений (multipart/form-data)
 * @returns {object} Сообщение о результате загрузки
 * @example
 * response - 200 - Изображения успешно загружены
 * {
 *   "message": "Изображения обновлены"
 * }
 * response - 400 - Ошибка в параметрах или отсутствуют изображения
 * {
 *   "message": "Изображений не загружено" | "Отсутствуют требуемые данные"
 * }
 * response - 500 - Внутренняя ошибка сервера при загрузке
 * {
 *   "message": error
 * }
 */
ROUTER.post('/upload', (request, result) => {
    upload(request, result, async (error) => {
        if (error) {
            return result.status(500).json({ message: 'Ошибка при загрузке: ' + error.message });
        }

        try {
            if (!request.files || request.files.length === 0) {
                return result.status(400).json({ message: 'Изображений не загружено' });
            }

            const { furnitureCardId, color, idMainImage } = request.query;

            if (!furnitureCardId || !color || idMainImage === undefined) {
                return result.status(400).json({ message: 'Отсутствуют требуемые данные' });
            }

            const UPLOADED_FILES = request.files.map(file => ({ filename: file.filename }));

            let FIND_FURNITURE_IMAGES = await IMAGES_FURNITURE.findOne({ furnitureCardId: furnitureCardId, color: color });
            if (FIND_FURNITURE_IMAGES) {
                FIND_FURNITURE_IMAGES.images = UPLOADED_FILES;
                FIND_FURNITURE_IMAGES.idMainImage = idMainImage
            } else {
                FIND_FURNITURE_IMAGES = new IMAGES_FURNITURE({
                    furnitureCardId: furnitureCardId,
                    color: color,
                    images: UPLOADED_FILES,
                    idMainImage: idMainImage
                });
            }
            let funritureCardItem = await FURNITURE_CARD.findById(furnitureCardId)
            const INDEX_COLOR = funritureCardItem.colors.findIndex(colorData => colorData.color === color)
            const ID_FURNITURE_IMAGES = FIND_FURNITURE_IMAGES._id

            funritureCardItem.colors[INDEX_COLOR].idImages = ID_FURNITURE_IMAGES

            await funritureCardItem.save();
            await FIND_FURNITURE_IMAGES.save();
            result.status(200).json({ message: 'Изображения обновлены' });
        } catch (error) {
            result.status(500).json({ message: error.message });
        }
    });
});
/**
 * @function DELETE /furniture/images/delete/color
 * @instance
 * @memberof module:furnitureCard
 * @summary Удаление изображений, привязанных к цвету мебели
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели 
 * @param {string} color - Цвет удаляемой версии мебели
 * @returns {object} Объект с соообщением о результате удаления
 * @example
 * response - 200 - Цвет удален
 * {
 *   "message": "Цвет удален"
 * }
 * @example
 * response - 404 - Товар или аккаунт не найден
 * {
 *   "message": "Товар не найден" | "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка при удалении
 * {
 *   "message": "Ошибка при удалении"
 * }
 */
ROUTER.delete('/delete/color', async (request, result) => {
    try {
        const { furnitureCardId, color } = request.query;

        const PROJECT_DIR = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
        const COLOR_DIR = path.join(PROJECT_DIR, color);

        if (fs.existsSync(COLOR_DIR)) {
            fs.rmSync(COLOR_DIR, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteOne({ furnitureCardId, color });
        result.status(200).json({ message: `Цвет удален` });
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при удалении: ' + error.message });
    }
});
/**
 * @function DELETE /furniture/images/delete/project
 * @instance
 * @memberof module:furnitureCard
 * @summary Удаление всех изображений, связанных с карточкой мебели
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели
 * @returns {object} Сообщение о результате удаления
 * @example
 * response - 200 - Изображения успешно удалены
 * {
 *   "message": "Изображения удалены"
 * }
 * response - 404 - Пользователь не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * response - 409 - Недостаточно прав для выполнения операции
 * {
 *   "message": "Нет доступа"
 * }
 */

ROUTER.delete('/delete/project', async (request, result) => {
    try {
        const { furnitureCardId, jwt } = request.query;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(jwt);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return result.status(409).json({ message: 'Нет доступа' });

        const PROJECT_DIR = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);

        if (fs.existsSync(PROJECT_DIR)) {
            fs.rmSync(PROJECT_DIR, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteMany({ furnitureCardId: furnitureCardId });
        result.status(200).json({ message: `Изображения удалены` });
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при удалении: ' + error.message });
    }
});

module.exports = ROUTER;
