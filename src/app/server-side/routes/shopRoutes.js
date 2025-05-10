const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const FURNITURE_CARD = require('../models/furnitureCard')
const IMAGES_FURNITURE = require('../models/imagesFurniture')

ROUTER.get('/all', async (request, result) => {
    try {
        const START_RANGE = +request.query.startRange
        if (typeof (START_RANGE) !== 'number') throw new Error("Диапазон должен быть числом");

        const FURNITURE_CARDS_ARRAY = await FURNITURE_CARD.find()
            .skip(START_RANGE)
            .limit(10);
        const RESULTS_ARRAY = await Promise.all(
            FURNITURE_CARDS_ARRAY.map(async (furnitureData) => {
                const MIN_COST = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;

                const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({
                    furnitureId: furnitureData._id
                });
                if (!IMAGES_FURNITURE_ITEM) return undefined;

                return {
                    name: furnitureData.name,
                    cost: MIN_COST,
                    furnitureId: furnitureData._id.toString(),
                    previewUrl: `furniture/images/simple?furnitureCardId=${furnitureData._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${IMAGES_FURNITURE_ITEM.idMainImage}`

                };
            }).filter(x => x != undefined)
        );

        result.status(200).json({ resultsArray: RESULTS_ARRAY })
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
})

ROUTER.get('/category', async (request, result) => {
    try {
        const START_RANGE = +request.query.startRange
        const CATEGORY_NAME = request.query.category
        if (typeof (START_RANGE) !== 'number') throw new Error("Диапазон должен быть числом");

        const FURNITURE_CARDS_ARRAY = await FURNITURE_CARD.find({
            'additionalData.category': CATEGORY_NAME
        })
            .skip(START_RANGE)
            .limit(10);
            
        const RESULTS_ARRAY = await Promise.all(
            FURNITURE_CARDS_ARRAY.map(async (furnitureData) => {
                const minCost = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;

                const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({
                    furnitureId: furnitureData._id
                });
                if (!IMAGES_FURNITURE_ITEM) return undefined;

                return {
                    name: furnitureData.name,
                    cost: minCost,
                    furnitureId: furnitureData._id,
                    previewUrl: `furniture/images/simple?furnitureCardId=${furnitureData._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${IMAGES_FURNITURE_ITEM.idMainImage}`
                };
            }).filter(x => x != undefined)
        );

        result.status(200).json({ resultsArray: RESULTS_ARRAY })
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
})

module.exports = ROUTER;