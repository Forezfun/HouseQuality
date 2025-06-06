const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const IMAGE_AVATAR = require('../models/imageAvatar');
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.use(async (request, result, next) => {
    try {
        const JWT = request.query.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
        request.query = {};
        request.query.accountId = ACCOUNT_ID;
        next();
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
});


function removeOldAvatarIfExists(accountId, uploadDir) {
    const EXTENSIONS = ['.png', '.jpg', '.jpeg'];
    for (const EXTENSION of EXTENSIONS) {
        const FILE_PATH = path.join(uploadDir, `${accountId}${EXTENSION}`);
        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
        }
    }
}

const storage = multer.diskStorage({
    destination: (request, file, cb) => {
        const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }

        removeOldAvatarIfExists(request.query.accountId, UPLOAD_DIR);
        cb(null, UPLOAD_DIR);
    },
    filename: (request, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase();
        if (!extension || !['.png', '.jpg', '.jpeg'].includes(extension)) {
            extension = '.jpg';
        }

        const FILE_NAME = request.query.accountId + extension;
        saveAvatar(FILE_NAME, request.query.accountId);
        cb(null, FILE_NAME);
    }
});

async function saveAvatar(fileName, accountId) {
    let IMAGE_AVATAR_FIND_ITEM = await IMAGE_AVATAR.findOne({ accountId: accountId });
    if (IMAGE_AVATAR_FIND_ITEM) {

        IMAGE_AVATAR_FIND_ITEM.filename = fileName;
        await IMAGE_AVATAR_FIND_ITEM.save();
    } else {

        const IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
            filename: fileName,
            accountId: accountId
        });
        await IMAGE_AVATAR_ITEM.save();
    }
}

const upload = multer({ storage: storage });
/**
 * @function POST /account/avatar
 * @instance
 * @memberof module:account
 * @summary Обновление или загрузка аватара пользователя
 * @param {string} jwt - JWT токен
 * @param {File} File - Файл автара
 * @example
 * {
 *   "message": "Изображение обновлено"
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.post('/', upload.single('image'), async (request, result) => {
    try {
        let IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ accountId: request.query.accountId })
        if (!IMAGE_AVATAR_ITEM) {
            IMAGE_AVATAR_ITEM = new IMAGE_AVATAR({
                filename: request.file.filename,
                accountId: request.query.accountId
            });
        }
        await IMAGE_AVATAR_ITEM.save();
        result.status(200).json({ message: 'Изображение обновлено' });
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
});
/**
 * @function GET /account/avatar
 * @instance
 * @memberof module:account
 * @summary Получение аватара пользователя
 * @param {string} jwt - JWT токен
 * @returns {File} Файл аватара MIME-типом или JSON с ошибкой
 * @example
 * response - 200 - Успешная отправка файла модели
 * Content-Type: image/jpeg (или другой в зависимости от расширения)
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
*/
ROUTER.get('/', async (request, result) => {
    try {
        let filePath
        const DIRECTORY = path.join(__dirname, '..', 'uploads', 'avatars');
        const IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ accountId: request.query.accountId });
        if (!IMAGE_AVATAR_ITEM) {
            filePath = path.join(DIRECTORY, 'default.png')
        }
        
        if (IMAGE_AVATAR_ITEM) {
            filePath = path.join(DIRECTORY, IMAGE_AVATAR_ITEM.filename);
            
            if (!fs.existsSync(filePath)) {
                filePath = path.join(DIRECTORY, 'default.png')
            }
        }
        
        const MIME_TYPE = mime.lookup(filePath) || 'application/octet-stream'
        
        result.setHeader('Content-Type', MIME_TYPE);
        
        result.sendFile(filePath);
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
