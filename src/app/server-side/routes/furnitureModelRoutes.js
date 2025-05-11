const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FURNITURE_MODEL = require('../models/furnitureModel');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.use(async (request, result, next) => {
    try {
        console.log('model')
        if (request.url.includes('version')) {
            next();
            return;
        }
        const JWT = request.query.jwt || request.body.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' })
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findOne({ authorId: ACCOUNT_ID })
        if (!FURNITURE_CARD_ITEM || FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return result.status(409).json({ message: "User hasn't access" })
        request.query.accountId = ACCOUNT_ID;
        next();
    } catch (error) {
        result.status(500).json({ message: 'Ошибка при валидации: ' + error.message });
    }
});

function removeOldModelIfExists(furnitureId, uploadDir) {
    const EXTENSIONS = ['.obj', '.fbx', '.stl'];
    for (const EXTENSION of EXTENSIONS) {
        const FILE_PATH = path.join(uploadDir, `${furnitureId}${EXTENSION}`);
        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
        }
    }
}

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'models');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        removeOldModelIfExists(request.query.furnitureId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (request, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase();
        if (!extension || !['.obj', '.fbx', '.stl'].includes(extension)) return

        const fileName = request.query.furnitureId + extension;
        saveModel(fileName, request.query.furnitureId);
        cb(null, fileName);
    }
});

async function saveModel(fileName, furnitureId) {
    let FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: furnitureId });
    if (FURNITURE_MODEL_ITEM) {

        FURNITURE_MODEL_ITEM.filename = fileName;
        await FURNITURE_MODEL_ITEM.save();
    } else {

        const FURNITURE_MODEL_NEW_ITEM = new FURNITURE_MODEL({
            filename: fileName,
            furnitureId: furnitureId
        });
        await FURNITURE_MODEL_NEW_ITEM.save();
    }
}

const upload = multer({ storage: storage });

ROUTER.post('/', upload.single('model'), async (request, result) => {
    try {
        let FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: request.query.furnitureId })
        if (!FURNITURE_MODEL_ITEM) {
            FURNITURE_MODEL_ITEM = new FURNITURE_MODEL({
                filename: request.file.filename,
                furnitureId: request.query.furnitureId,
                originalName: request.query.fileName
            });
            FURNITURE_MODEL_ITEM.originalName = request.query.fileName
        } else {
            FURNITURE_MODEL_ITEM.__v += 1
            FURNITURE_MODEL_ITEM.filename = request.file.filename;
            FURNITURE_MODEL_ITEM.originalName = request.query.fileName
        }
        await FURNITURE_MODEL_ITEM.save();
        result.status(200).json({ message: 'Модель добавлена' });
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});

ROUTER.delete('/', async (request, result) => {
    try {
        const JWT = request.query.jwt;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Товар не найден' });
        if (FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return result.status(409).json({ message: 'Нет доступа' });
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: FURNITURE_CARD_ID });
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

ROUTER.get('/version', async (request, result) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: request.query.furnitureId });
        if (!FURNITURE_MODEL_ITEM) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }
        result.status(201).json({ versionModel: FURNITURE_MODEL_ITEM.__v })
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
})

ROUTER.get('/', async (request, result) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: request.query.furnitureId });
        if (!FURNITURE_MODEL_ITEM) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }

        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'models');
        const FILE_PATH = path.join(DIRECTORY, FURNITURE_MODEL_ITEM.filename);

        if (!fs.existsSync(FILE_PATH)) {
            return result.status(404).json({ message: 'Модель не найдена' });
        }


        const EXTENSION = path.extname(FURNITURE_MODEL_ITEM.filename).toLowerCase();
        let mimeType = 'application/octet-stream';

        switch (EXTENSION) {
            case '.obj':
                mimeType = 'model/obj';
                break;
            case '.fbx':
                mimeType = 'model/fbx';
                break;
            case '.stl':
                mimeType = 'model/stl';
                break;
            default:
                mimeType = 'application/octet-stream';
        }

        result.setHeader('Content-Type', mimeType);
        result.setHeader('Content-Disposition', `attachment; filename="${FURNITURE_MODEL_ITEM.filename}"`);


        result.sendFile(FILE_PATH);
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
