const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbModule = require('../server'); 
const {checkUserAccess} = require('../helpers/jwtHandlers')
const { ObjectId } = require('mongodb');

ROUTER.use(async (req, res, next) => {
    try {
        if (req.method !== 'GET') {
            const jwtToken = req.query.jwtToken || req.body.jwtToken;
            const userId = await checkUserAccess(jwtToken);
            if (!userId) return res.status(404).json({ message: 'User not found' });
            req.query.userId = userId;
            const db = await dbModule.getDb();
            const furnitureCard = await db.collection('furniturecards').findOne({ _id: new ObjectId(req.query.furnitureCardId) });
            if (!furnitureCard) return res.status(404).json({ message: 'Furniture card not found' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});


function ensureProjectAndColorDirectories(furnitureCardId, color) {
    if (!furnitureCardId || !color) {
        throw new Error('furnitureCardId or color is missing');
    }

    const projectDir = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
    const colorDir = path.join(projectDir, color);

    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
    }

    if (!fs.existsSync(colorDir)) {
        fs.mkdirSync(colorDir);
    }

    return colorDir;
}


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { furnitureCardId, color } = req.query;

        if (!furnitureCardId || !color) {
            return cb(new Error('furnitureCardId or color is missing'));
        }

        const colorDir = ensureProjectAndColorDirectories(furnitureCardId, color);
        cb(null, colorDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase() || '.jpg';
        const fileName = Date.now() + extension;
        cb(null, fileName);
    }
});


const upload = multer({ storage: storage }).array('images', 10);

ROUTER.get('/main', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.query;
        if (!furnitureCardId || !color) {
            return res.status(400).json({ message: 'furnitureCardId or color is missing' });
        }

        const db = await dbModule.getDb();
        const FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(furnitureCardId) });

        if (!FURNITURE_CARD_ITEM) {
            return res.status(404).json({ message: 'Furniture card not found' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color);
        if (INDEX_COLOR === undefined) {
            return res.status(404).json({ message: 'Color not found' });
        }

        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages;
        const IMAGES_FURNITURE_ITEM = await db.collection('furnitureimages').findOne({ _id: new ObjectId(ID_IMAGES) });
        if (!IMAGES_FURNITURE_ITEM) {
            return res.status(404).json({ message: 'Images furniture item not found' });
        }
        
        const MAIN_IMAGE_NAME = IMAGES_FURNITURE_ITEM.images[IMAGES_FURNITURE_ITEM.idMainImage].filename;
        const directory = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        const filePath = path.join(directory, MAIN_IMAGE_NAME);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.sendFile(filePath);
    } catch (err) {
        
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});

ROUTER.get('/simple', async (req, res) => {
    try {
        const { filePath } = req.query;
        if (filePath === undefined) return;
        res.sendFile(filePath);
    } catch (err) {
        
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});

ROUTER.get('/all', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.query;

        if (!furnitureCardId || !color) {
            return res.status(400).json({ message: 'furnitureCardId or color is missing' });
        }

        const db = await dbModule.getDb();
        const FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(furnitureCardId) });

        if (!FURNITURE_CARD_ITEM) {
            return res.status(404).json({ message: 'Furniture card not found' });
        }

        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color);
        if (INDEX_COLOR === undefined) {
            return res.status(404).json({ message: 'Color not found' });
        }

        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages;
        const IMAGES_FURNITURE_ITEM = await db.collection('furnitureimages').findOne({ _id: new ObjectId(ID_IMAGES) });
        if (!IMAGES_FURNITURE_ITEM) {
            return res.status(404).json({ message: 'Images furniture item not found' });
        }

        let FURNITURE_IMAGES_PATH_ARRAY = [];
        const directory = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        IMAGES_FURNITURE_ITEM.images.forEach(imageData => FURNITURE_IMAGES_PATH_ARRAY.push(path.join(directory, imageData.filename)));

        res.status(200).json({ imagesURLS: FURNITURE_IMAGES_PATH_ARRAY, idMainImage: IMAGES_FURNITURE_ITEM.idMainImage });
    } catch (err) {
        
        res.status(500).json({ message: 'Error fetching main image: ' + err.message });
    }
});


ROUTER.post('/upload/images', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error uploading images: ' + err.message });
        }

        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'No images uploaded' });
            }

            const { furnitureCardId, color, idMainImage } = req.query;

            if (!furnitureCardId || !color || idMainImage === undefined) {
                return res.status(400).json({ message: 'Images data is missing' });
            }

            const uploadedFiles = req.files.map(file => ({ filename: file.filename }));

            const db = await dbModule.getDb();
            let FURNITURE_IMAGES_ITEM = await db.collection('furnitureimages').findOne({ furnitureCardId, color });

            FURNITURE_IMAGES_ITEM = {
                    furnitureId: furnitureCardId,
                    color: color,
                    images: uploadedFiles,
                    idMainImage: idMainImage
            };

            const INSERT_RESULT = await db.collection('furnitureimages').insertOne(FURNITURE_IMAGES_ITEM)

            let FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(furnitureCardId) });
            const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color);
            const idFurnitureImages = INSERT_RESULT.insertedId;
            FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages = idFurnitureImages;

            await db.collection('furniturecards').updateOne({ _id: new ObjectId(furnitureCardId) }, { $set: { colors: FURNITURE_CARD_ITEM.colors } });
            res.status(200).json({ message: 'Images uploaded successfully!' });
        } catch (err) {
            res.status(500).json({ message: 'Error processing request: ' + err.message });
        }
    });
});


ROUTER.delete('/delete/color', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.body;

        const db = await dbModule.getDb();
        const projectDir = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
        const colorDir = path.join(projectDir, color);

        if (fs.existsSync(colorDir)) {
            fs.rmdirSync(colorDir, { recursive: true });
        }

        await db.collection('furnitureimages').deleteOne({ furnitureCardId, color });
        res.status(200).json({ message: `Color '${color}' and related images deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting color: ' + err.message });
    }
});


ROUTER.delete('/delete/project', async (req, res) => {
    try {
        const { furnitureCardId, jwtToken } = req.query;

        const USER_ID = await checkUserAccess(jwtToken);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        
        const db = await dbModule.getDb();
        let FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(furnitureCardId) });
        if (FURNITURE_CARD_ITEM.authorId.toString() !== USER_ID.toString()) return res.status(409).json({ message: "User hasn't access" });

        const projectDir = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
        if (fs.existsSync(projectDir)) {
            fs.rmdirSync(projectDir, { recursive: true });
        }

        await db.collection('furniturecards').deleteOne({ _id: furnitureCardId });
        res.status(200).json({ message: 'Furniture card and related files deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting project: ' + err.message });
    }
});

module.exports = ROUTER;
