const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const { checkUserAccess } = require('../helpers/jwtHandlers')
const FURNITURE_CARD = require('../models/furnitureCard')


ROUTER.post('/', async (request, result) => {
    try {
        console.log(request.query)
        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = new FURNITURE_CARD({
            name: request.body.name,
            description: request.body.description,
            imagesFolderName: request.body.imagesFolderName,
            shops: request.body.shops,
            authorId: USER_ID,
            idFurnitureModel: request.body.idFurnitureModel,
            additionalData:{}
        })
        request.body.colors.forEach(color=>{FURNITURE_CARD_ITEM.colors.push({color:color,idImages:''})})
        console.log(FURNITURE_CARD_ITEM)
        if (request.query.additionalData !== undefined) {
            const ADDITIONAL_DATA = JSON.parse(request.query.additionalData);
            
            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                // Проверка на существование ключа в additionalData
                if (propertyKey in FURNITURE_CARD.schema.paths.additionalData.schema.paths) {
                    FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey];
                }
            });
        }
        await FURNITURE_CARD_ITEM.save()
        result.status(201).json({ furnitureData: FURNITURE_CARD_ITEM })
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.put('/', async (request, result) => {
    try {
        console.log(request.query)
        console.log(request.body.colors)
        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return result.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findOne({ authorId: USER_ID })
        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Furniture card not found' });
        FURNITURE_CARD_ITEM.name = request.body.name;
        FURNITURE_CARD_ITEM.description = request.body.description;
        FURNITURE_CARD_ITEM.colors = request.body.colors.map(color=>{return({color:color,idImages:''})})
        FURNITURE_CARD_ITEM.shops = request.body.shops;
        if (request.query.additionalData !== undefined) {
            const ADDITIONAL_DATA = JSON.parse(request.query.additionalData);
            
            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                // Проверка на существование ключа в additionalData
                if (propertyKey in FURNITURE_CARD.schema.paths.additionalData.schema.paths) {
                    FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey];
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
        const JWT_TOKEN = request.query.jwtToken;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return res.status(404).json({ message: 'User not found' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return res.status(404).json({ message: 'Furniture card not found' });
        if(FURNITURE_CARD_ITEM.authorId!==USER_ID)return res.status(409).json({ message: "User hasn't access" });
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
        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        const AUTHOR_MATCHED = USER_ID===FURNITURE_CARD_ITEM.authorId?true:false
        result.status(201).json({furnitureCard:FURNITURE_CARD_ITEM,authorMatched:AUTHOR_MATCHED});
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
})


module.exports = ROUTER;
