const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dbModule = require('../server'); 
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');


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


function removeOldAvatarIfExists(userId, uploadDir) {
    const extensions = ['.png', '.jpg', '.jpeg'];
    for (const ext of extensions) {
        const filePath = path.join(uploadDir, `${userId}${ext}`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); 
        }
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads','avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        
        removeOldAvatarIfExists(req.query.userId, uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        let extension = path.extname(file.originalname).toLowerCase(); 
        if (!extension || !['.png', '.jpg', '.jpeg'].includes(extension)) {
            extension = '.jpg'; 
        }

        const fileName = req.query.userId + extension;
        saveAvatar(fileName, req.query.userId); 
        cb(null, fileName);
    }
});

async function saveAvatar(fileName, userId) {
    const db = await dbModule.getDb(); 
    const IMAGE_AVATAR_COLLECTION = db.collection('imageavatars');
    
    let IMAGE_AVATAR_FIND_ITEM = await IMAGE_AVATAR_COLLECTION.findOne({ userId: userId });
    if (IMAGE_AVATAR_FIND_ITEM) {
        
        IMAGE_AVATAR_FIND_ITEM.filename = fileName;
        await IMAGE_AVATAR_COLLECTION.updateOne(
            { _id: IMAGE_AVATAR_FIND_ITEM._id },
            { $set: { filename: fileName } }
        );
    } else {
        
        const IMAGE_AVATAR_ITEM = {
            filename: fileName,
            userId: userId
        };
        await IMAGE_AVATAR_COLLECTION.insertOne(IMAGE_AVATAR_ITEM);
    }
}

const upload = multer({ storage: storage });

ROUTER.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const db = await dbModule.getDb();
        const IMAGE_AVATAR_COLLECTION = db.collection('imageavatars');
        
        let IMAGE_AVATAR_ITEM = await IMAGE_AVATAR_COLLECTION.findOne({ userId: req.query.userId });
        if (!IMAGE_AVATAR_ITEM) {
            IMAGE_AVATAR_ITEM = {
                filename: req.file.filename,
                userId: req.query.userId
            };
            await IMAGE_AVATAR_COLLECTION.insertOne(IMAGE_AVATAR_ITEM);
        }
        res.status(200).json({ message: 'Image uploaded successfully!', image: IMAGE_AVATAR_ITEM });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


ROUTER.get('', async (req, res) => {
    try {
        const db = await dbModule.getDb();
        const IMAGE_AVATAR_COLLECTION = db.collection('imageavatars');
        let filePath;
        const directory = path.join(__dirname, '..', 'uploads','avatars');
        const IMAGE_AVATAR_ITEM = await IMAGE_AVATAR_COLLECTION.findOne({ userId: req.query.userId });
        if (!IMAGE_AVATAR_ITEM) {
            filePath = path.join(directory, 'default.png');
        }

        if (IMAGE_AVATAR_ITEM) {
            filePath = path.join(directory, IMAGE_AVATAR_ITEM.filename);

            

            if (!fs.existsSync(filePath)) {
                filePath = path.join(directory, 'default.png');
            }
        }
        
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;
