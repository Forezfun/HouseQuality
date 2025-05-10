const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');


ROUTER.use(async (req, res, next) => {
    try {
        if (req.method !== 'GET') {
            const jwt = req.query.jwt || req.body.jwt;
            const accountId = await checkUserAccess(jwt);
            if (!accountId) return res.status(404).json({ message: 'User not found' });
            req.query.accountId = accountId;
            const furnitureCard = await FURNITURE_CARD.findById(req.query.furnitureCardId);
            if (!furnitureCard) return res.status(404).json({ message: 'Furniture card not found' });
        }
        if (req.method == 'POST') {
            const { furnitureCardId, color, idMainImage } = req.query;
            if (!furnitureCardId || !color || idMainImage === undefined) return res.status(400).json({ message: 'Images data is missing' });
            const projectDir = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
            const colorDir = path.join(projectDir, color);
            if (fs.existsSync(colorDir)) {
                fs.rmdirSync(colorDir, { recursive: true });
                fs.mkdirSync(colorDir);
            }
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating account access: ' + error.message });
    }
});


function ensureProjectAndColorDirectories(furnitureCardId, color) {
    if (!furnitureCardId || !color) {
        throw new Error('furnitureCardId or color is missing');
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
    destination: (req, file, cb) => {
        const { furnitureCardId, color } = req.query;

        if (!furnitureCardId || !color) {
            return cb(new Error('furnitureCardId or color is missing'));
        }

        const COLOR_DIR = ensureProjectAndColorDirectories(furnitureCardId, color);
        cb(null, COLOR_DIR);
    },
    filename: (req, file, cb) => {
        const EXTENSION = path.extname(file.originalname).toLowerCase() || '.jpg';
        const FILE_NAME = Date.now() + EXTENSION;
        cb(null, FILE_NAME);
    }
});


const upload = multer({ storage: storage }).array('images', 10);
ROUTER.get('/main', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.query;
        
        if (!furnitureCardId || !color) {
            return res.status(400).json({ message: 'furnitureCardId or color is missing' });
        }
        
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)

        if (!FURNITURE_CARD_ITEM) {
            return res.status(404).json({ message: 'Furniture card not found' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color)
        console.log(INDEX_COLOR)
        if (INDEX_COLOR === undefined) {
            return res.status(404).json({ message: 'Color not found' });
        }
        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findById(ID_IMAGES)
        if (!IMAGES_FURNITURE_ITEM) {
            return res.status(404).json({ message: 'Images furniture item not found' });
        }
        const MAIN_IMAGE_NAME = IMAGES_FURNITURE_ITEM.images[IMAGES_FURNITURE_ITEM.idMainImage].filename
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        const FILE_PATH = path.join(DIRECTORY, MAIN_IMAGE_NAME);

        console.log(`Looking for file: ${FILE_PATH}`);

        if (!fs.existsSync(FILE_PATH)) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.sendFile(FILE_PATH);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});
ROUTER.get('/simple', async (req, res) => {
    try {
        const { furnitureCardId, color, idImage } = req.query;
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({ furnitureId: furnitureCardId })
        if (!IMAGES_FURNITURE_ITEM) return res.status(404).json({ message: 'Изображения не найдены' })

        const IMAGE_NAME = IMAGES_FURNITURE_ITEM.images[idImage].filename
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        const FILE_PATH = path.join(DIRECTORY, IMAGE_NAME);
        if (fs.existsSync(FILE_PATH)) {
            res.sendFile(FILE_PATH);
        } else {
            res.status(404).json({ message: 'Файл не найден на сервере' });
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});
ROUTER.get('/all', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.query;

        
        if (!furnitureCardId || !color) {
            return res.status(400).json({ message: 'furnitureCardId or color is missing' });
        }

        
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)

        if (!FURNITURE_CARD_ITEM) {
            return res.status(404).json({ message: 'Furniture card not found' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color)
        if (INDEX_COLOR === undefined) {
            return res.status(404).json({ message: 'Color not found' });
        }
        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findById(ID_IMAGES)
        if (!IMAGES_FURNITURE_ITEM) {
            return res.status(404).json({ message: 'Images furniture item not found' });
        }
        let furnitureImagesPathArray = []
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId, color);
        IMAGES_FURNITURE_ITEM.images.forEach(imageData => furnitureImagesPathArray.push(path.join(DIRECTORY, imageData.filename)))

        res.status(200).json({ imagesURLS: furnitureImagesPathArray, idMainImage: IMAGES_FURNITURE_ITEM.idMainImage });
    } catch (err) {
        console.log(err)
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

            const UPLOADED_FILES = req.files.map(file => ({ filename: file.filename }));

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
            res.status(200).json({ message: 'Images uploaded successfully!' });
        } catch (err) {
            res.status(500).json({ message: 'Error processing request: ' + err.message });
        }
    });
});


ROUTER.delete('/delete/color', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.body;

        const PROJECT_DIR = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);
        const COLOR_DIR = path.join(PROJECT_DIR, color);

        if (fs.existsSync(COLOR_DIR)) {
            fs.rmdirSync(COLOR_DIR, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteOne({ furnitureCardId, color });
        res.status(200).json({ message: `Color '${color}' and related images deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting color: ' + err.message });
    }
});


ROUTER.delete('/delete/project', async (req, res) => {
    try {
        const { furnitureCardId, jwt } = req.query;
        const FURNITURE_CARD_ID = req.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(jwt);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return res.status(409).json({ message: "User hasn't access" });

        const PROJECT_DIR = path.join(__dirname, '..', 'uploads', 'cards', furnitureCardId);

        if (fs.existsSync(PROJECT_DIR)) {
            fs.rmdirSync(PROJECT_DIR, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteMany({ furnitureId: furnitureCardId });
        res.status(200).json({ message: `Project '${furnitureCardId}' and all related images deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting project: ' + err.message });
    }
});

module.exports = ROUTER;
