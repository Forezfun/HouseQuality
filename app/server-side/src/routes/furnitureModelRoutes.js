const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const mime = require('mime-types');
const fs = require('fs');
const FURNITURE_MODEL = require('../models/furnitureModel');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.use(async (request, result, next) => {
    try {
        if (request.url.includes('version')) {
            next();
            return;
        }
        const JWT = request.query.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' })
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findOne({ authorId: ACCOUNT_ID })
        if (!FURNITURE_CARD_ITEM || FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return result.status(409).json({ message: "Нет доступа" })
        request.query.accountId = ACCOUNT_ID;
        next();
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при валидации: ' + error.message });
    }
});

function removeOldModelIfExists(furnitureCardId, uploadDir) {
    const EXTENSIONS = ['.obj', '.fbx', '.stl'];
    for (const EXTENSION of EXTENSIONS) {
        const FILE_PATH = path.join(uploadDir, `${furnitureCardId}${EXTENSION}`);
        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
        }
    }
}

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'models');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        removeOldModelIfExists(request.query.furnitureCardId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (request, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase();
        if (!extension || !['.obj', '.fbx', '.stl'].includes(extension)) return cb(new Error('Недопустимый формат файла'), null);

        const fileName = request.query.furnitureCardId + extension;
        saveModel(fileName, request.query.furnitureCardId);
        cb(null, fileName);
    }
});

async function saveModel(fileName, furnitureCardId) {
    let FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureCardId: furnitureCardId });
    if (FURNITURE_MODEL_ITEM) {

        FURNITURE_MODEL_ITEM.filename = fileName;
        await FURNITURE_MODEL_ITEM.save();
    } else {

        const FURNITURE_MODEL_NEW_ITEM = new FURNITURE_MODEL({
            filename: fileName,
            furnitureCardId: furnitureCardId
        });
        await FURNITURE_MODEL_NEW_ITEM.save();
    }
}

const upload = multer({ storage });
/**
 * @function POST /furniture/model
 * @instance
 * @memberof module:furnitureCard
 * @summary Загрузка или обновление модели
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели 
 * @param {file} model - Файл модели (multipart/form-data)
 * @returns {object} JSON с сообщением об успехе или ошибке
 * @example
 * response - 200 - Модель добавлена
 * {
 *   "message": "Модель добавлена"
 * }
 * @example
 * response - 400 - Ошибка при загрузке файла
 * {
 *   "message": error
 * }
 */
ROUTER.post('/', upload.single('file'), async (req, res) => {
    try {
        const { furnitureCardId, fileName } = req.body;
        let item = await FURNITURE_MODEL.findOne({ furnitureCardId });

        if (!item) {
            item = new FURNITURE_MODEL({
                filename: req.file.filename,
                furnitureCardId,
                originalName: fileName
            });
        } else {
            item.__v += 1;
            item.filename = req.file.filename;
            item.originalName = fileName;
        }

        await item.save();
        res.status(200).json({ message: 'Модель добавлена' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
/**
 * @function DELETE /furniture/model
 * @instance
 * @memberof module:furnitureCard
 * @summary Удаление модели
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели 
 * @returns {object} JSON с сообщением об успехе или ошибке
 * @example
 * response - 200 - Модель удалена
 * {
 *   "message": "Модель удалена"
 * }
 * @example
 * response - 404 - Модель не найдена
 * {
 *   "message": "Модель не найдена"
 * }
 * @example
 * response - 400 - Ошибка при удалении модели
 * {
 *   "message": "Ошибка при удалении модели"
 * }
 */
ROUTER.delete('/', async (request, result) => {
    try {
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureCardId: FURNITURE_CARD_ID });
        if (!FURNITURE_MODEL_ITEM) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }

        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'models');
        const FILE_PATH = path.join(DIRECTORY, FURNITURE_MODEL_ITEM.filename);

        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
        }


        await FURNITURE_MODEL_ITEM.deleteOne();
        result.status(200).json({ message: 'Модель удалена' });
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});
/**
 * @function GET /furniture/model/version
 * @instance
 * @memberof module:furnitureCard
 * @summary Получение версии модели
 * @param {string} furnitureCardId - ID карточки мебели 
 * @returns {object} JSON с номером версии модели или ошибкой
 * @example
 * response - 201 - Версия модели найдена
 * {
 *   "versionModel": 3
 * }
 * @example
 * response - 404 - Модель не найдена
 * {
 *   "message": "Модель не найдена"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": "Ошибка сервера"
 * }
 */
ROUTER.get('/version', async (request, result) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureCardId: request.query.furnitureCardId });
        if (!FURNITURE_MODEL_ITEM) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }
        result.status(201).json({ versionModel: FURNITURE_MODEL_ITEM.__v })
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
})
/**
 * @function GET /furniture/model
 * @instance
 * @memberof module:furnitureCard
 * @summary Получение модели
 * @param {string} furnitureCardId - ID карточки мебели 
 * @returns {File} Файл модели с корректным MIME-типом или JSON с ошибкой
 * @example
 * response - 200 - Успешная отправка файла модели
 * Content-Type: model/obj (или другой в зависимости от расширения)
 * @example
 * response - 404 - Модель не найдена в базе
 * {
 *   "message": "Модель не найдена"
 * }
 * @example
 * response - 404 - Файл модели отсутствует на сервере
 * {
 *   "message": "Модель не найдена"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.get('/', async (request, result) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureCardId: request.query.furnitureCardId });
        if (!FURNITURE_MODEL_ITEM) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }

        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'models');
        const FILE_PATH = path.join(DIRECTORY, FURNITURE_MODEL_ITEM.filename);

        if (!fs.existsSync(FILE_PATH)) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }


        const MIME_TYPE = mime.lookup(FILE_PATH)||'application/octet-stream'

        result.setHeader('Content-Type', MIME_TYPE);
        result.setHeader('Content-Disposition', `attachment; filename="${FURNITURE_MODEL_ITEM.filename}"`);

        result.sendFile(FILE_PATH);
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
