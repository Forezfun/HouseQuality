const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const path = require('path');
const dbModule = require('../server');
const { ObjectId } = require('mongodb');

ROUTER.get('/all', async (request, result) => {
    try {
        const db = await dbModule.getDb();
        const START_RANGE = +request.query.startRange;
        if (isNaN(START_RANGE)) throw new Error("startRange must be a number.");

        const FURNITURE_CARDS_ARRAY = await db.collection('furniturecards')
            .find()
            .skip(START_RANGE)
            .limit(10)
            .toArray();

        const RESULTS_ARRAY = await Promise.all(
            FURNITURE_CARDS_ARRAY.map(async (furnitureData) => {
                const IMAGES_FURNITURE_ITEM = await db.collection('furnitureimages').findOne({ furnitureId: furnitureData._id.toString() });
                const previewPath = path.join(
                    __dirname,
                    '..',
                    'uploads',
                    'cards',
                    furnitureData._id.toString(),
                    IMAGES_FURNITURE_ITEM.color,
                    IMAGES_FURNITURE_ITEM.images[IMAGES_FURNITURE_ITEM.idMainImage].filename
                );
                const maxCost = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;
    
                return {
                    name: furnitureData.name,
                    cost: maxCost,
                    preview: previewPath,
                    id: furnitureData._id.toString()
                };
            })
        );
        
        result.status(200).json({ resultsArray: RESULTS_ARRAY });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.get('/category', async (request, result) => {
    try {
        const db = await dbModule.getDb();
        const START_RANGE = +request.query.startRange;
        const CATEGORY_NAME = request.query.category;
        if (isNaN(START_RANGE)) throw new Error("startRange must be a number.");

        const FURNITURE_CARDS_ARRAY = await db.collection('furniturecards')
            .find({ 'additionalData.category': CATEGORY_NAME })
            .skip(START_RANGE)
            .limit(10)
            .toArray();

        const RESULTS_ARRAY = await Promise.all(
            FURNITURE_CARDS_ARRAY.map(async (furnitureData) => {
                const IMAGES_FURNITURE_ITEM = await db.collection('furnitureimages').findOne({ furnitureId: furnitureData._id.toString() });
                const previewPath = path.join(
                    __dirname,
                    '..',
                    'uploads',
                    'cards',
                    furnitureData._id.toString(),
                    IMAGES_FURNITURE_ITEM.color,
                    IMAGES_FURNITURE_ITEM.images[IMAGES_FURNITURE_ITEM.idMainImage].filename
                );
                const maxCost = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;
    
                return {
                    name: furnitureData.name,
                    cost: maxCost,
                    preview: previewPath,
                    id: furnitureData._id.toString()
                };
            })
        );
        
        result.status(200).json({ resultsArray: RESULTS_ARRAY });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.get('/image/simple', async (req, res) => {
    try {
        const { filePath } = req.query;
        if (!filePath) return;
        res.sendFile(filePath);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});

module.exports = ROUTER;
