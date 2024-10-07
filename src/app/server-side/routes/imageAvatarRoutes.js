const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const USER = require('../models/user');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const IMAGE_AVATAR = require('../models/imageAvatar');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');

// Middleware для проверки JWT и добавления USER_ID в req.body
ROUTER.use(async (req, res, next) => {
    try {
        const JWT_TOKEN = req.query.jwtToken || req.body.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        req.query = {};
        req.query.userId = USER_ID;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});

// Логика для удаления старого файла с другим расширением
function removeOldAvatarIfExists(userId, uploadDir) {
    const extensions = ['.png', '.jpg', '.jpeg'];
    for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${userId}${ext}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Удаляем файл
        }
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        // Удаляем старый аватар, если он существует
        removeOldAvatarIfExists(req.query.userId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase(); // Получаем расширение
        if (!extension || !['.png', '.jpg', '.jpeg'].includes(extension)) {
            extension = '.jpg'; // Если расширение неподдерживаемое или отсутствует, используем .jpg
        }

        const fileName = req.query.userId + extension;
        saveAvatar(fileName, req.query.userId); // Сохраняем информацию об аватаре в БД
        cb(null, fileName);
    }
});

async function saveAvatar(fileName, userId) {
    let IMAGE_AVATAR_FIND_ITEM = await IMAGE_AVATAR.findOne({ userId: userId });
    if (IMAGE_AVATAR_FIND_ITEM) {
        // Обновляем запись с новым именем файла
        IMAGE_AVATAR_FIND_ITEM.filename = fileName;
        await IMAGE_AVATAR_FIND_ITEM.save();
    } else {
        // Создаём новую запись
        const IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
            filename: fileName,
            userId: userId
        });
        await IMAGE_AVATAR_ITEM.save();
    }
}

const upload = multer({ storage: storage });

ROUTER.post('/upload', upload.single('image'), async (req, res) => {
    try {
        let IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ userId: req.query.userId })
        if (!IMAGE_AVATAR_ITEM) {
            IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
                filename: req.file.filename,
                userId: req.query.userId
            });
        }
        const savedImage = await IMAGE_AVATAR_ITEM.save();  // Используем await для сохранения без колбэка
        res.status(200).json({ message: 'Image uploaded successfully!', image: savedImage });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Маршрут для получения аватара по userId
ROUTER.get('', async (req, res) => {
    try {
        const IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ userId: req.query.userId });
        if (!IMAGE_AVATAR_ITEM) {
            return res.status(404).json({ message: 'Avatar not found' });
        }

        const directory = path.join(__dirname, '..', 'uploads');
        const filePath = path.join(directory, IMAGE_AVATAR_ITEM.filename);

        console.log(`Looking for file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
