const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FURNITURE_MODEL = require('../models/furnitureModel');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.use(async (req, res, next) => {
    try {
        console.log('model')
        const JWT = req.query.jwt || req.body.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' })
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findOne({ authorId: ACCOUNT_ID })
        if (!FURNITURE_CARD_ITEM || FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return res.status(409).json({ message: "User hasn't access" })
        req.query.accountId = ACCOUNT_ID;
        console.log('model continue')
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating account access: ' + error.message });
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
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'models');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        removeOldModelIfExists(req.query.furnitureId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase();
        if (!extension || !['.obj', '.fbx', '.stl'].includes(extension)) return

        const fileName = req.query.furnitureId + extension;
        saveModel(fileName, req.query.furnitureId);
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

ROUTER.post('/', upload.single('model'), async (req, res) => {
    console.log(req.query.fileName)
    try {
        let FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: req.query.furnitureId })
        if (!FURNITURE_MODEL_ITEM) {
            FURNITURE_MODEL_ITEM = new FURNITURE_MODEL({
                filename: req.file.filename,
                furnitureId: req.query.furnitureId,
                originalName: req.query.fileName
            });
            FURNITURE_MODEL_ITEM.originalName = req.query.fileName
        } else {
            FURNITURE_MODEL_ITEM.filename = req.file.filename;
            FURNITURE_MODEL_ITEM.originalName = req.query.fileName
        }
        await FURNITURE_MODEL_ITEM.save();
        res.status(200).json({ message: 'Model uploaded successfully!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

ROUTER.delete('/', async (req, res) => {
    try {
        const JWT = request.query.jwt;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return res.status(404).json({ message: 'Furniture card not found' });
        if (FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return res.status(409).json({ message: "User hasn't access" });
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: FURNITURE_CARD_ID });
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }


        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'models');
        const FILE_PATH = path.join(DIRECTORY, FURNITURE_MODEL_ITEM.filename);

        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
        }


        await FURNITURE_MODEL_ITEM.deleteOne();
        res.status(200).json({ message: 'Model deleted successfully!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

ROUTER.get('/', async (req, res) => {
    try {
        const FURNITURE_MODEL_ITEM = await FURNITURE_MODEL.findOne({ furnitureId: req.query.furnitureId });
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'models');
        const FILE_PATH = path.join(DIRECTORY, FURNITURE_MODEL_ITEM.filename);

        if (!fs.existsSync(FILE_PATH)) {
            return res.status(404).json({ message: 'File not found' });
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

        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${FURNITURE_MODEL_ITEM.filename}"`);


        res.sendFile(FILE_PATH);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
