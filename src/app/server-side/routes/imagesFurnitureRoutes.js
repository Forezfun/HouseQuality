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
            const jwt = request.query.jwt || request.body.jwt;
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
                fs.rmdirSync(colorDir, { recursive: true });
                fs.mkdirSync(colorDir);
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
        fs.mkdirSync(COLOR_DIR);
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
        const FILE_NAME = Date.now() + EXTENSION;
        cb(null, FILE_NAME);
    }
});


const upload = multer({ storage: storage }).array('images', 10);
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
ROUTER.get('/simple', async (request, result) => {
    try {
        const { furnitureCardId, color, idImage } = request.query;
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({ furnitureId: furnitureCardId })
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


ROUTER.post('/upload/images', (request, result) => {
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

            let FIND_FURNITURE_IMAGES = await IMAGES_FURNITURE.findOne({ furnitureId:furnitureCardId, color:color });
            if (FIND_FURNITURE_IMAGES) {
                FIND_FURNITURE_IMAGES.images=UPLOADED_FILES;
                FIND_FURNITURE_IMAGES.idMainImage=idMainImage
            } else {
                FIND_FURNITURE_IMAGES = new IMAGES_FURNITURE({
                    furnitureId: furnitureCardId,
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
            result.status(500).json({ message: 'Ошибка при загрузке: ' + error.message });
        }
    });
});


ROUTER.delete('/delete/color', async (request, result) => {
    try {
        const { furnitureCardId, color } = request.body;

        const PROJECT_DIR = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
        const COLOR_DIR = path.join(PROJECT_DIR, color);

        if (fs.existsSync(COLOR_DIR)) {
            fs.rmdirSync(COLOR_DIR, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteOne({ furnitureCardId, color });
        result.status(200).json({ message: `Цвет удален` });
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при удалении: ' + error.message });
    }
});


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
            fs.rmdirSync(PROJECT_DIR, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteMany({ furnitureId: furnitureCardId });
        result.status(200).json({ message: `Изображения удалены` });
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при удалении: ' + error.message });
    }
});

module.exports = ROUTER;
