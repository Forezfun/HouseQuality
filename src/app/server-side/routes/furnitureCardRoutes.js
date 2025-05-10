const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const { checkUserAccess } = require('../helpers/jwtHandlers')
const FURNITURE_CARD = require('../models/furnitureCard');
const IMAGES_FURNITURE = require('../models/imagesFurniture');

ROUTER.post('/', async (request, result) => {
    try {
        console.log(request.query, request.body, request.params)
        const JWT = request.query.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = new FURNITURE_CARD({
            name: request.body.name,
            description: request.body.description,
            shops: request.body.shops,
            authorId: ACCOUNT_ID,
            proportions: request.body.proportions,
            additionalData: {}
        })
        request.body.colors.forEach(color => { FURNITURE_CARD_ITEM.colors.push({ color: color.color, idImages: '' }) })
        console.log(request.body.additionalData)
        if (request.body.additionalData !== undefined) {
            const ADDITIONAL_DATA = request.body.additionalData;
            console.log(ADDITIONAL_DATA)

            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                console.log(propertyKey, FURNITURE_CARD.schema.paths.additionalData.schema.paths)
                if (propertyKey in FURNITURE_CARD.schema.paths.additionalData.schema.paths) {
                    FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey];
                }
            });
        }
        console.log(FURNITURE_CARD_ITEM)
        await FURNITURE_CARD_ITEM.save()
        result.status(201).json({ furnitureData: FURNITURE_CARD_ITEM })
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.put('/', async (request, result) => {
    try {
        console.log('query: ', request.query)
        const JWT = request.query.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findOne({ authorId: ACCOUNT_ID })
        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Furniture card not found' });

        FURNITURE_CARD_ITEM.name = request.body.name;
        FURNITURE_CARD_ITEM.description = request.body.description;
        FURNITURE_CARD_ITEM.proportions = request.body.proportions,
        FURNITURE_CARD_ITEM.colors = request.body.colors.map(color => { return ({ color: color.color, idImages: '' }) })
        FURNITURE_CARD_ITEM.shops = request.body.shops;
        FURNITURE_CARD_ITEM.additionalData={}

        if (request.query.additionalData !== undefined) {
            const ADDITIONAL_DATA = JSON.parse(request.query.additionalData);

            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                if (propertyKey in FURNITURE_CARD.schema.paths.additionalData.schema.paths) {
                    FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey] || FURNITURE_CARD_ITEM.additionalData[propertyKey]
                }
            });
        }
        await FURNITURE_CARD_ITEM.save()
        result.status(201).json({ message: 'Furniture card successfully updated' })
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.delete('/', async (request, result) => {
    try {
        const JWT = request.query.jwt;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return res.status(404).json({ message: 'Furniture card not found' });
        if (FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return res.status(409).json({ message: "User hasn't access" });
        await FURNITURE_CARD.deleteOne({ _id: FURNITURE_CARD_ID });
        result.status(201).json({ message: 'Furniture card successfully deleted' })
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.get('/', async (request, result) => {
    try {
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(request.query.furnitureCardId)
        if (!FURNITURE_CARD_ITEM) return res.status(404).json({ message: 'Furniture card not found' });
        const JWT = request.query.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        const AUTHOR_MATCHED = ACCOUNT_ID === FURNITURE_CARD_ITEM.authorId ? true : false
        const colorsFromServerData = await proccessColorsData(FURNITURE_CARD_ITEM)
        const PROCESSED_FURNITURE_ITEM = {
            name: FURNITURE_CARD_ITEM.name,
            description: FURNITURE_CARD_ITEM.description,
            colors: colorsFromServerData,
            shops: FURNITURE_CARD_ITEM.shops,
            authorId: FURNITURE_CARD_ITEM.authorId,
            proportions: FURNITURE_CARD_ITEM.proportions,
            additionalData: FURNITURE_CARD_ITEM.additionalData
        }
        result.status(201).json({ furnitureCard: PROCESSED_FURNITURE_ITEM, authorMatched: AUTHOR_MATCHED });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
})

async function proccessColorsData(FURNITURE_CARD_ITEM) {
    let colorsFromServerData = [];

    for (const COLOR_DATA of FURNITURE_CARD_ITEM.colors) {
        try {
            const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({
                furnitureId: FURNITURE_CARD_ITEM._id
            });

            if (!IMAGES_FURNITURE_ITEM) continue;

            const IMAGES_URLS = IMAGES_FURNITURE_ITEM.images.map((imageData, index) => {
                return `furniture/images/simple?furnitureCardId=${FURNITURE_CARD_ITEM._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${index}`;
            });

            colorsFromServerData.push({
                color: COLOR_DATA.color,
                imagesData: {
                    images: IMAGES_URLS,
                    idMainImage: IMAGES_FURNITURE_ITEM.idMainImage
                }
            });
        } catch (error) {
            console.error('Error processing color:', colorData.color, error);
        }
    }
    return colorsFromServerData;
}
module.exports = ROUTER;
