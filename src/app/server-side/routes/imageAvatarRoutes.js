const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const IMAGE_AVATAR = require('../models/imageAvatar');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');

// Middleware для проверки JWT и добавления ACCOUNT_ID в req.body
ROUTER.use(async (req, res, next) => {
    try {
        const JWT_TOKEN = req.query.jwtToken || req.body.jwtToken;
        const ACCOUNT_ID = await checkUserAccess(JWT_TOKEN);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' });
        req.query = {};
        req.query.accountId = ACCOUNT_ID;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating user access: ' + error.message });
    }
});

// Логика для удаления старого файла с другим расширением
function removeOldAvatarIfExists(accountId, uploadDir) {
    const extensions = ['.png', '.jpg', '.jpeg'];
    for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${accountId}${ext}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Удаляем файл
        }
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads','avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        // Удаляем старый аватар, если он существует
        removeOldAvatarIfExists(req.query.accountId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase(); // Получаем расширение
        if (!extension || !['.png', '.jpg', '.jpeg'].includes(extension)) {
            extension = '.jpg'; // Если расширение неподдерживаемое или отсутствует, используем .jpg
        }

        const fileName = req.query.accountId + extension;
        saveAvatar(fileName, req.query.accountId); // Сохраняем информацию об аватаре в БД
        cb(null, fileName);
    }
});

async function saveAvatar(fileName, accountId) {
    let IMAGE_AVATAR_FIND_ITEM = await IMAGE_AVATAR.findOne({ accountId: accountId });
    if (IMAGE_AVATAR_FIND_ITEM) {
        // Обновляем запись с новым именем файла
        IMAGE_AVATAR_FIND_ITEM.filename = fileName;
        await IMAGE_AVATAR_FIND_ITEM.save();
    } else {
        // Создаём новую запись
        const IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
            filename: fileName,
            accountId: accountId
        });
        await IMAGE_AVATAR_ITEM.save();
    }
}

const upload = multer({ storage: storage });

ROUTER.post('/upload', upload.single('image'), async (req, res) => {
    try {
        let IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ accountId: req.query.accountId })
        if (!IMAGE_AVATAR_ITEM) {
            IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
                filename: req.file.filename,
                accountId: req.query.accountId
            });
        }
        await IMAGE_AVATAR_ITEM.save();
        res.status(200).json({ message: 'Image uploaded successfully!'});
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Маршрут для получения аватара по accountId
ROUTER.get('', async (req, res) => {
    try {
        let filePath
        const directory = path.join(__dirname, '..', 'uploads','avatars');
        const IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ accountId: req.query.accountId });
        if (!IMAGE_AVATAR_ITEM) {
            filePath=path.join(directory,'default.png')
        }

        if(IMAGE_AVATAR_ITEM){
            filePath = path.join(directory, IMAGE_AVATAR_ITEM.filename);

            console.log(`Looking for file: ${filePath}`);

            if (!fs.existsSync(filePath)) {
            filePath=path.join(directory,'default.png')
            }
        }
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
