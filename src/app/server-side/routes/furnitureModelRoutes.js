const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FURNITURE_MODEL = require('../models/furnitureModel');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');

// Middleware для проверки JWT и добавления FURNITURE_ID в req.body
ROUTER.use(async (req, res, next) => {
    try {
        console.log('model')
        const JWT_TOKEN = req.query.jwtToken || req.body.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' })
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findOne({authorId:USER_ID})
        if(!FURNITURE_CARD_ITEM||FURNITURE_CARD_ITEM.authorId!==USER_ID)return res.status(409).json({message:"User hasn't access"})
        req.query.userId = USER_ID;
        console.log('model continue')
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});

// Логика для удаления старого файла
function removeOldModelIfExists(furnitureId, uploadDir) {
    const extensions = ['.obj', '.fbx', '.stl']; // Расширения файлов для 3D моделей
    for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${furnitureId}${ext}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Удаляем файл
        }
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..','uploads', 'models');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        // Удаляем старую модель, если она существует
        removeOldModelIfExists(req.query.furnitureId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase(); // Получаем расширение
        if (!extension || !['.obj', '.fbx', '.stl'].includes(extension))return

        const fileName = req.query.furnitureId + extension;
        saveModel(fileName, req.query.furnitureId); // Сохраняем информацию о модели в БД
        cb(null, fileName);
    }
});

async function saveModel(fileName, furnitureId) {
    let FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: furnitureId });
    if (FURNITURE_MODEL_ITEM) {
        // Обновляем запись с новым именем файла
        FURNITURE_MODEL_ITEM.filename = fileName;
        await FURNITURE_MODEL_ITEM.save();
    } else {
        // Создаём новую запись
        const FURNITURE_MODEL_NEW_ITEM = new FURNITURE_MODEL({
            filename: fileName,
            furnitureId: furnitureId
        });
        await FURNITURE_MODEL_NEW_ITEM.save();
    }
}

const upload = multer({ storage: storage });

// Маршрут для загрузки 3D модели
ROUTER.post('/upload', upload.single('model'), async (req, res) => {
    console.log(req.query.fileName)
    try {
        let FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: req.query.furnitureId });
        if (!FURNITURE_MODEL_ITEM) {
            FURNITURE_MODEL_ITEM = new FURNITURE_MODEL({
                filename: req.file.filename,
                furnitureId: req.query.furnitureId,
                originalName:req.query.fileName
            });
            FURNITURE_MODEL_ITEM.originalName=req.query.fileName
        }
        const savedModel = await FURNITURE_MODEL_ITEM.save();  // Сохраняем модель
        res.status(200).json({ message: 'Model uploaded successfully!', model: savedModel });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Маршрут для обновления документа и файла модели
ROUTER.put('/update/', upload.single('model'), async (req, res) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: req.query.furnitureId });
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        // Обновляем файл
        if (req.file) {
            FURNITURE_MODEL_ITEM.filename = req.file.filename;
            FURNITURE_MODEL_ITEM.originalName = req.query.fileName
        }

        const updatedModel = await FURNITURE_MODEL_ITEM.save();
        res.status(200).json({ message: 'Model updated successfully!', model: updatedModel });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Маршрут для удаления документа и файла
ROUTER.delete('/delete/', async (req, res) => {
    try {
        const JWT_TOKEN = request.query.jwtToken;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return res.status(404).json({ message: 'Furniture card not found' });
        if(FURNITURE_CARD_ITEM.authorId!==USER_ID)return res.status(409).json({ message: "User hasn't access" });
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: FURNITURE_CARD_ID });
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        // Удаляем файл
        const directory = path.join(__dirname, '..','uploads', 'models');
        const filePath = path.join(directory, FURNITURE_MODEL_ITEM.filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Удаляем запись из БД
        await FURNITURE_MODEL_ITEM.deleteOne();
        res.status(200).json({ message: 'Model deleted successfully!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Маршрут для получения файла модели по furnitureId
ROUTER.get('/', async (req, res) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: req.query.furnitureId });
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        const directory = path.join(__dirname, '..', 'uploads', 'models');
        const filePath = path.join(directory, FURNITURE_MODEL_ITEM.filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Устанавливаем заголовки Content-Type и Content-Disposition
        const extension = path.extname(FURNITURE_MODEL_ITEM.filename).toLowerCase();
        let mimeType = 'application/octet-stream'; // Default MIME type

        switch (extension) {
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
                mimeType = 'application/octet-stream'; // Default MIME type
        }

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${FURNITURE_MODEL_ITEM.filename}"`);

        // Отправляем файл
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = ROUTER;
