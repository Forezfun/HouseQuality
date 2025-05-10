const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const IMAGE_AVATAR = require('../models/imageAvatar');
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.use(async (req, res, next) => {
    try {
        const JWT = req.query.jwt || req.body.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' });
        req.query = {};
        req.query.accountId = ACCOUNT_ID;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error validating account access: ' + error.message });
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
    destination: (req, file, cb) => {
        const UPLOAD_DIR = path.join(__dirname, '..', 'uploads','avatars');
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR);
        }
        
        removeOldAvatarIfExists(req.query.accountId, UPLOAD_DIR);
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase(); 
        if (!extension || !['.png', '.jpg', '.jpeg'].includes(extension)) {
            extension = '.jpg'; 
        }

        const FILE_NAME = req.query.accountId + extension;
        saveAvatar(FILE_NAME, req.query.accountId); 
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

ROUTER.get('', async (req, res) => {
    try {
        let filePath
        const DIRECTORY = path.join(__dirname, '..', 'uploads','avatars');
        const IMAGE_AVATAR_ITEM = await IMAGE_AVATAR.findOne({ accountId: req.query.accountId });
        if (!IMAGE_AVATAR_ITEM) {
            filePath=path.join(DIRECTORY,'default.png')
        }

        if(IMAGE_AVATAR_ITEM){
            filePath = path.join(DIRECTORY, IMAGE_AVATAR_ITEM.filename);

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
