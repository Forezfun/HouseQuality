const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { checkUserAccess } = require('../helpers/jwtHandlers');
const dbModule = require('../server');
const { ObjectId } = require('mongodb');


ROUTER.use(async (req, res, next) => {
    try {
        
        const JWT_TOKEN = req.query.jwtToken || req.body.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' })
        
        const db = await dbModule.getDb();
        const FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ authorId: new ObjectId(USER_ID),_id:new ObjectId(req.query.furnitureId) });
        
        if (!FURNITURE_CARD_ITEM) {
            return res.status(409).json({ message: "User hasn't access" });
        }

        req.query.userId = USER_ID;
        
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});


function removeOldModelIfExists(furnitureId, uploadDir) {
    const extensions = ['.obj', '.fbx', '.stl']; 
    for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${furnitureId}${ext}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..','uploads', 'models');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        
        removeOldModelIfExists(req.query.furnitureId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase(); 
        if (!extension || !['.obj', '.fbx', '.stl'].includes(extension)) return;

        const fileName = req.query.furnitureId + extension;
        saveModel(fileName, req.query.furnitureId); 
        cb(null, fileName);
    }
});

async function saveModel(fileName, furnitureId) {
    const db = await dbModule.getDb();
    let FURNITURE_MODEL_ITEM = await db.collection('furnituremodels').findOne({ furnitureId: furnitureId });
    
    if (FURNITURE_MODEL_ITEM) {
        
        FURNITURE_MODEL_ITEM.filename = fileName;
        await db.collection('furnituremodels').updateOne({ furnitureId: furnitureId }, { $set: FURNITURE_MODEL_ITEM });
    } else {
        
        const FURNITURE_MODEL_NEW_ITEM = {
            filename: fileName,
            furnitureId: furnitureId
        };
        await db.collection('furnituremodels').insertOne(FURNITURE_MODEL_NEW_ITEM);
    }
}

const upload = multer({ storage: storage });


ROUTER.post('/upload', upload.single('model'), async (req, res) => {
    
    try {
        const db = await dbModule.getDb();

        const FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(req.query.furnitureId) });
        if(!FURNITURE_CARD_ITEM)return res.status(404).json({ message: 'Furniture card not found' });

        let FURNITURE_MODEL_ITEM = await db.collection('furnituremodels').findOne({ furnitureId: req.query.furnitureId });

        if (!FURNITURE_MODEL_ITEM) {
            FURNITURE_MODEL_ITEM = {
                filename: req.file.filename,
                furnitureId: req.query.furnitureId,
                originalName: req.query.fileName
            };
            await db.collection('furnituremodels').insertOne(FURNITURE_MODEL_ITEM);
        }

        await db.collection('furniturecards').updateOne({ _id: new ObjectId(req.query.furnitureId) }, { $set: { idFurnitureModel: FURNITURE_MODEL_ITEM._id } });
        res.status(200).json({ message: 'Model uploaded successfully!', model: FURNITURE_MODEL_ITEM });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


ROUTER.put('/update/:id', upload.single('model'), async (req, res) => {
    try {
        const db = await dbModule.getDb();
        
        const FURNITURE_MODEL_ITEM = await db.collection('furnituremodels').findOne({ furnitureId: req.query.furnitureId });

        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        
        if (req.file) {
            FURNITURE_MODEL_ITEM.filename = req.file.filename;
            FURNITURE_MODEL_ITEM.originalName = req.query.fileName;
        }

        
        const { _id, ...updateData } = FURNITURE_MODEL_ITEM;
        
        
        await db.collection('furnituremodels').updateOne(
            { _id: new ObjectId(req.query.furnitureId) },
            { $set: FURNITURE_MODEL_ITEM }
        );

        res.status(200).json({ message: 'Model updated successfully!', model: updateData });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



ROUTER.delete('/delete/', async (req, res) => {
    try {
        const db = await dbModule.getDb();
        const JWT_TOKEN = req.query.jwtToken;
        const FURNITURE_CARD_ID = req.query.furnitureCardId;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        
        let FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(FURNITURE_CARD_ID) });
        if (!FURNITURE_CARD_ITEM) return res.status(404).json({ message: 'Furniture card not found' });

        if (FURNITURE_CARD_ITEM.authorId !== USER_ID) return res.status(409).json({ message: "User hasn't access" });

        const FURNITURE_MODEL_ITEM = await db.collection('furnituremodels').findOne({ furnitureId: FURNITURE_CARD_ID });
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        
        const directory = path.join(__dirname, '..','uploads', 'models');
        const filePath = path.join(directory, FURNITURE_MODEL_ITEM.filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        
        await db.collection('furnituremodels').deleteOne({ furnitureId: FURNITURE_CARD_ID });
        res.status(200).json({ message: 'Model deleted successfully!' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


ROUTER.get('/', async (req, res) => {
    try {
        const db = await dbModule.getDb();
        const FURNITURE_MODEL_ITEM = await db.collection('furnituremodels').findOne({ furnitureId: req.query.furnitureId });
        
        if (!FURNITURE_MODEL_ITEM) {
            return res.status(404).json({ message: 'Model not found' });
        }

        const directory = path.join(__dirname, '..', 'uploads', 'models');
        const filePath = path.join(directory, FURNITURE_MODEL_ITEM.filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        
        const extension = path.extname(FURNITURE_MODEL_ITEM.filename).toLowerCase();

        let mimeType = 'application/octet-stream'; 
        switch (extension) {
            case '.obj':
                mimeType = 'text/plain';  // Альтернатива: 'model/obj'
                break;
            case '.fbx':
                mimeType = 'application/octet-stream';  // FBX нет в стандартных MIME-типаx
                break;
            case '.stl':
                mimeType = 'model/stl';  
                break;
            default:
                mimeType = 'application/octet-stream';
        }
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${FURNITURE_MODEL_ITEM.filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
