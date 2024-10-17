const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const { checkUserAccess } = require('../helpers/jwtHandlers')
const FURNITURE_CARD = require('../models/furnitureCard')
const path = require('path');
const IMAGES_FURNITURE = require('../models/imagesFurniture')
ROUTER.get('/all', async (request, result) => {
    try {
        const START_RANGE = +request.query.startRange
        console.log(START_RANGE,typeof(START_RANGE))
        if(typeof(START_RANGE)!=='number')throw new Error("startRange must be a number.");

        const FURNITURE_CARDS_ARRAY = await FURNITURE_CARD.find()
        .skip(START_RANGE)
        .limit(10);
        const RESULTS_ARRAY = await Promise.all(
            FURNITURE_CARDS_ARRAY.map(async (furnitureData) => {
                const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({ furnitureId: furnitureData._id });
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
        
        result.status(200).json({resultsArray:RESULTS_ARRAY})
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
})
ROUTER.get('/category', async (request, result) => {
    try {
        const START_RANGE = +request.query.startRange
        const CATEGORY_NAME = request.query.category
        console.log(START_RANGE,typeof(START_RANGE))
        if(typeof(START_RANGE)!=='number')throw new Error("startRange must be a number.");

        const FURNITURE_CARDS_ARRAY = await FURNITURE_CARD.find({
            'additionalData.category': CATEGORY_NAME
        })
        .skip(START_RANGE)
        .limit(10);
        console.log(FURNITURE_CARDS_ARRAY)
        const RESULTS_ARRAY = await Promise.all(
            FURNITURE_CARDS_ARRAY.map(async (furnitureData) => {
                const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({ furnitureId: furnitureData._id });
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
        console.log(RESULTS_ARRAY)
        result.status(200).json({resultsArray:RESULTS_ARRAY})
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
})
ROUTER.get('/image/simple', async (req, res) => {
    try {
        
        const { filePath } = req.query;
        if(filePath===undefined)return
        res.sendFile(filePath);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Error fetching images: ' + err.message });
    }
});
module.exports = ROUTER;