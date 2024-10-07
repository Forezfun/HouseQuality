const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const IMAGES_FURNITURE = require('../models/imagesFurniure');
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');

// Middleware для проверки JWT и добавления USER_ID в req.body
ROUTER.use(async (req, res, next) => {
    try {
        if (req.method !== 'GET') {
            const jwtToken = req.query.jwtToken || req.body.jwtToken;
            const userId = await checkUserAccess(jwtToken);
            if (!userId) return res.status(404).json({ message: 'User not found' });
            req.query.userId = userId;
            const furnitureCard = await FURNITURE_CARD.findById(req.query.furnitureCardId);
            if (!furnitureCard) return res.status(404).json({ message: 'Furniture card not found' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});

// Функция для создания папок проекта и цвета, если их нет
function ensureProjectAndColorDirectories(furnitureCardId, color) {
    if (!furnitureCardId || !color) {
        throw new Error('furnitureCardId or color is missing');
    }

    const projectDir = path.join(__dirname, '..', 'uploads', furnitureCardId);
    const colorDir = path.join(projectDir, color);

    if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
    }

    if (!fs.existsSync(colorDir)) {
        fs.mkdirSync(colorDir);
    }

    return colorDir;
}

// Конфигурация multer для загрузки файлов
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

// Настройка для приема файлов
const upload = multer({ storage: storage }).array('images', 10);
ROUTER.get('/main', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.query;
        // Validate request parameters
        if (!furnitureCardId || !color) {
            return res.status(400).json({ message: 'furnitureCardId or color is missing' });
        }
        // Find images for the specified furniture card and color
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)

        if (!FURNITURE_CARD_ITEM) {
            return res.status(404).json({ message: 'Furniture card not found' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color)
        console.log(INDEX_COLOR)
        if (INDEX_COLOR===undefined) {
            return res.status(404).json({ message: 'Color not found' });
        }
        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findById(ID_IMAGES)
        if (!IMAGES_FURNITURE_ITEM) {
            return res.status(404).json({ message: 'Images furniture item not found' });
        }
        const MAIN_IMAGE_NAME = IMAGES_FURNITURE_ITEM.images[IMAGES_FURNITURE_ITEM.idMainImage].filename
        const directory = path.join(__dirname, '..', 'uploads',furnitureCardId,color);
        const filePath = path.join(directory, MAIN_IMAGE_NAME);

        console.log(`Looking for file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        res.sendFile(filePath);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});
ROUTER.get('/simple', async (req, res) => {
    try {
        const { filePath } = req.query;
        if(filePath===undefined)return
        res.sendFile(filePath);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});
ROUTER.get('/all', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.query;

        // Validate request parameters
        if (!furnitureCardId || !color) {
            return res.status(400).json({ message: 'furnitureCardId or color is missing' });
        }

        // Find images for the specified furniture card and color
        const FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)

        if (!FURNITURE_CARD_ITEM) {
            return res.status(404).json({ message: 'Furniture card not found' });
        }
        const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData =>colorData.color === color)
        if (INDEX_COLOR===undefined) {
            return res.status(404).json({ message: 'Color not found' });
        }
        const ID_IMAGES = FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages
        const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findById(ID_IMAGES)
        if (!IMAGES_FURNITURE_ITEM) {
            return res.status(404).json({ message: 'Images furniture item not found' });
        }
        let FURNITURE_IMAGES_PATH_ARRAY=[]
        const directory = path.join(__dirname, '..', 'uploads',furnitureCardId,color);
        IMAGES_FURNITURE_ITEM.images.forEach(imageData => FURNITURE_IMAGES_PATH_ARRAY.push(path.join(directory, imageData.filename)))

        res.status(200).json({ imagesURLS: FURNITURE_IMAGES_PATH_ARRAY,idMainImage: IMAGES_FURNITURE_ITEM.idMainImage});
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching main image: ' + err.message });
    }
});

// Маршрут для загрузки изображений
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

            // Проверяем, что данные присутствуют
            if (!furnitureCardId || !color || idMainImage === undefined) {
                return res.status(400).json({ message: 'Images data is missing' });
            }

            // Обработка файлов
            const uploadedFiles = req.files.map(file => ({ filename: file.filename }));

            let furnitureItem = await IMAGES_FURNITURE.findOne({ furnitureCardId, color });
            if (furnitureItem) {
                furnitureItem.images.push(...uploadedFiles);
            } else {
                furnitureItem = new IMAGES_FURNITURE({
                    furnitureId:furnitureCardId,
                    color:color,
                    images: uploadedFiles,
                    idMainImage: idMainImage
                });
            }
            let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(furnitureCardId)
            const INDEX_COLOR = FURNITURE_CARD_ITEM.colors.findIndex(colorData => colorData.color === color)
            const idFurnitureImages = furnitureItem._id
            console.log(FURNITURE_CARD_ITEM.colors[INDEX_COLOR], idFurnitureImages)
            FURNITURE_CARD_ITEM.colors[INDEX_COLOR].idImages = idFurnitureImages
            console.log(FURNITURE_CARD_ITEM.colors[INDEX_COLOR])
            await FURNITURE_CARD_ITEM.save();
            await furnitureItem.save();
            res.status(200).json({ message: 'Images uploaded successfully!' });
        } catch (err) {
            res.status(500).json({ message: 'Error processing request: ' + err.message });
        }
    });
});

// Удаление определенного цвета (папки) и связанных с ним записей в базе данных
ROUTER.delete('/delete/color', async (req, res) => {
    try {
        const { furnitureCardId, color } = req.body;
        
        const projectDir = path.join(__dirname, '..', 'uploads', furnitureCardId);
        const colorDir = path.join(projectDir, color);

        if (fs.existsSync(colorDir)) {
            fs.rmdirSync(colorDir, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteOne({ furnitureCardId, color });
        res.status(200).json({ message: `Color '${color}' and related images deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting color: ' + err.message });
    }
});

// Удаление проекта и всех его папок (цветов)
ROUTER.delete('/delete/project', async (req, res) => {
    try {
        const { furnitureCardId,jwtToken } = req.query;
        const FURNITURE_CARD_ID = req.query.furnitureCardId
        const USER_ID = await checkUserAccess(jwtToken);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if(FURNITURE_CARD_ITEM.authorId!==USER_ID)return res.status(409).json({ message: "User hasn't access" });

        const projectDir = path.join(__dirname, '..', 'uploads', furnitureCardId);

        if (fs.existsSync(projectDir)) {
            fs.rmdirSync(projectDir, { recursive: true });
        }

        await IMAGES_FURNITURE.deleteMany({ furnitureId:furnitureCardId });
        res.status(200).json({ message: `Project '${furnitureCardId}' and all related images deleted successfully.` });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting project: ' + err.message });
    }
});

module.exports = ROUTER;
