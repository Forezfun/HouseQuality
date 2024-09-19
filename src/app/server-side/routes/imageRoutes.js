const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const IMAGE_AVATAR = require('../models/imageAvatar');
const USER = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');

// Middleware для проверки JWT и добавления USER_ID в req.body
ROUTER.use(async (req, res, next) => {
    try {
        const JWT_TOKEN = req.query.jwtToken || req.body.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        req.query.userId = USER_ID;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        
        let extension = path.extname(file.originalname);
        if (!extension) {
            extension = '.jpg';
        }
        const fileName = req.query.userId + extension;        
        cb(null, fileName);
    }
});


const upload = multer({ storage: storage });

ROUTER.post('/upload/avatar', upload.single('image'), async (req, res) => {
    try {
        const IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
            filename: req.file.filename,
            filepath: req.file.path,
            userId: req.query.userId
        });

        await IMAGE_AVATAR_ITEM.save((err, image) => {
            if (err) {
                return res.status(500).json({ error: err });
            }
            res.status(200).json({ message: 'Image uploaded successfully!', image });
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Маршрут для загрузки нескольких изображений мебели
ROUTER.post('/upload/furniture', upload.array('images', 10), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded.' });
        }

        const images = files.map(file => ({
            filename: file.filename,
            filepath: file.path,
            idFurniture: req.body.idProject,
            userId: req.query.userId
        }));

        await ImageModel.insertMany(images, (error, docs) => {
            if (error) {
                return res.status(500).json({ error: error });
            }
            res.status(200).json({ message: 'Images uploaded successfully!', files: docs });
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Статическая раздача файлов из папки 'uploads'
ROUTER.use('/uploads', EXPRESS.static(path.join(__dirname, '..', 'uploads')));

// Маршрут для получения аватара по userId
function findFileWithoutExtension(directory, fileName, extensions) {
    for (const ext of extensions) {
        const filePath = path.join(directory, fileName + ext);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    return null;
}

ROUTER.get('/avatar', async (req, res) => {
    try {
        const avatar = await IMAGE_AVATAR.findOne({ userId: req.body.userId });

        let fileName;
        if (!avatar) {
            fileName = 'default';
        } else {
            fileName = avatar.filename;
        }

        const directory = path.join(__dirname, '..', 'uploads');
        const extensions = ['.png', '.jpg', '.jpeg'];

        const filePath = findFileWithoutExtension(directory, fileName, extensions);

        if (!filePath) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Отправляем файл пользователю
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
