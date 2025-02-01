const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const { checkUserAccess } = require('../helpers/jwtHandlers');
const dbModule = require('../server');
const { ObjectId } = require('mongodb');
ROUTER.post('/', async (request, result) => {
    try {
        
        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return result.status(404).json({ message: 'User not found' });
        
        const db = await dbModule.getDb();
        let FURNITURE_CARD_ITEM = {
            name: request.body.name,
            description: request.body.description,
            shops: request.body.shops,
            authorId: USER_ID,
            proportions: request.body.proportions,
            idFurnitureModel: request.body.idFurnitureModel,
            additionalData: {
                category:'' 
            },
            colors:[]
        };

        request.body.colors.forEach(color => { FURNITURE_CARD_ITEM.colors.push({ color: color, idImages: '' }) });
        
        
        if (request.query.additionalData !== undefined) {
            const ADDITIONAL_DATA = JSON.parse(request.query.additionalData);
            
            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                if (FURNITURE_CARD_ITEM.additionalData.hasOwnProperty(propertyKey)) {
                    FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey];
                }
            });
        }
        await db.collection('furniturecards').insertOne(FURNITURE_CARD_ITEM);
        result.status(201).json({ furnitureData: FURNITURE_CARD_ITEM });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.put('/', async (request, result) => {
    try {
        
        
        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return result.status(404).json({ message: 'User not found' });
        
        const db = await dbModule.getDb();
        let FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ authorId: new ObjectId(USER_ID) });

        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Furniture card not found' });

        FURNITURE_CARD_ITEM.name = request.body.name;
        FURNITURE_CARD_ITEM.description = request.body.description;
        FURNITURE_CARD_ITEM.proportions = 
        request.body.proportions && Object.values(request.body.proportions).every(value => value !== null) 
        ? request.body.proportions 
        : FURNITURE_CARD_ITEM.proportions;

        FURNITURE_CARD_ITEM.colors = request.body.colors.map(color => { return ({ color: color, idImages: '' }) });
        FURNITURE_CARD_ITEM.shops = request.body.shops;

        if (request.query.additionalData !== undefined) {
            const ADDITIONAL_DATA = JSON.parse(request.query.additionalData);
            
            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                if (FURNITURE_CARD_ITEM.additionalData.hasOwnProperty(propertyKey)) {
                    FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey];
                }
            });
        }

        await db.collection('furniturecards').updateOne({ _id: FURNITURE_CARD_ITEM._id }, { $set: FURNITURE_CARD_ITEM });
        result.status(201).json({ message: 'Furniture card successfully updated' });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.delete('/', async (request, result) => {
    try {
        const JWT_TOKEN = request.query.jwtToken;
        const FURNITURE_CARD_ID = request.query.furnitureCardId;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        if (!USER_ID) return result.status(404).json({ message: 'User not found' });

        const db = await dbModule.getDb();
        let FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(FURNITURE_CARD_ID) });

        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Furniture card not found' });
        if (FURNITURE_CARD_ITEM.authorId.toString() !== USER_ID.toString()) return result.status(409).json({ message: "User hasn't access" });

        await db.collection('furniturecards').deleteOne({ _id: new ObjectId(FURNITURE_CARD_ID) });
        result.status(201).json({ message: 'Furniture card successfully deleted' });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.get('/', async (request, result) => {
    try {
        const db = await dbModule.getDb();
        let FURNITURE_CARD_ITEM = await db.collection('furniturecards').findOne({ _id: new ObjectId(request.query.furnitureCardId) });

        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Furniture card not found' });

        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);
        const AUTHOR_MATCHED = USER_ID.toString() === FURNITURE_CARD_ITEM.authorId.toString() ? true : false;
        
        result.status(201).json({ furnitureCard: FURNITURE_CARD_ITEM, authorMatched: AUTHOR_MATCHED });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

module.exports = ROUTER;
