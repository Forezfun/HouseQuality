const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const { checkUserAccess } = require('../helpers/jwtHandlers')
const FURNITURE_CARD = require('../models/furnitureCard');
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const PROJECT = require('../models/project');
const AUTH_ACCOUNT = require('../models/authAccount');
const sendEmail = require('../helpers/sendcode');

/**
 * @module furnitureCard
 * @description Маршруты для работы с поиском мебели.
 */

/**
 * @function POST /furniture/card
 * @instance
 * @summary Создание новой карточки мебели
 * @param {string} jwt - JWT токен
 * @param {module:furnitureCard.FurnitureCard} body - Данные карточки мебели
 * @see При успешном запросе возвращает { furnitureData: {@link module:furnitureCard.FurnitureCard} }
 * @see При неуспешном запросе возвращает { message: string }
 * 
 * @example response - 201 - Успех
 * {
 *   "furnitureData": {
 *     "_id": "6634f1129f6f7cba29cd12f9",
 *     "name": "Диван",
 *     "description": "Угловой диван",
 *     "colors": [{ "color": "#fff", "idImages": "" }],
 *     "shops": [{ "cost": 12999, "url": "https://example.com" }],
 *     "authorId": "6641e6b9ce33a302f92f7c11",
 *     "proportions": { "width": 200, "length": 300, "height": 90 },
 *     "additionalData": {}
 *   }
 * }
 * @example response - 400 - Ошибка валидации или сервера
 * {
 *   "message": error
 * }
 */
ROUTER.post('/', async (request, result) => {
    try {
        const JWT = request.query.jwt;
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
        let FURNITURE_CARD_ITEM = new FURNITURE_CARD({
            name: request.body.name,
            description: request.body.description,
            shops: request.body.shops,
            authorId: ACCOUNT_ID,
            proportions: request.body.proportions,
            additionalData: {}
        })
        request.body.colors.forEach(color => { FURNITURE_CARD_ITEM.colors.push({ color: color.color, idImages: '' }) })
        if (request.body.additionalData !== undefined) {
            const ADDITIONAL_DATA = request.body.additionalData;

            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey];
            });
        }
        await FURNITURE_CARD_ITEM.save()
        result.status(201).json({ furnitureData: FURNITURE_CARD_ITEM })
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});
/**
 * @function PUT /furniture/card
 * @instance
 * @summary Обновление карточки мебели пользователя
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели товара
 * @param {module:furnitureCard.FurnitureCard} body - Новые данные карточки
 * 
 * @example response - 201 - Успех
 * {
 *   "message": "Товар успешно обновлен"
 * }
 * @example response - 404 - Товар не найден
 * {
 *   "message": "Товар не найден"
 * }
 * @example response - 400 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.put('/', async (request, result) => {
    try {
        const JWT = request.query.jwt;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID || !FURNITURE_CARD_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Товар не найден' });

        FURNITURE_CARD_ITEM.name = request.body.name;
        FURNITURE_CARD_ITEM.description = request.body.description;
        FURNITURE_CARD_ITEM.proportions = request.body.proportions,
        FURNITURE_CARD_ITEM.colors = request.body.colors.map(color => { return ({ color: color.color, idImages: '' }) })
        FURNITURE_CARD_ITEM.shops = request.body.shops;
        FURNITURE_CARD_ITEM.additionalData = {}

        if (request.body.additionalData !== undefined) {
            const ADDITIONAL_DATA = request.body.additionalData;

            Object.keys(ADDITIONAL_DATA).forEach(propertyKey => {
                FURNITURE_CARD_ITEM.additionalData[propertyKey] = ADDITIONAL_DATA[propertyKey]
            });

            await FURNITURE_CARD_ITEM.save()

        }

        await FURNITURE_CARD_ITEM.save()

        result.status(201).json({ message: 'Товар успешно обновлен' })
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});
/**
 * @function DELETE /furniture/card
 * @instance
 * @summary Удаление карточки мебели и связанных данных
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели
 * 
 * @example response - 201 - Успех
 * {
 *   "message": "Товар успешно удален"
 * }
 * @example response - 404 - Аккаунт или товар не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example response - 409 - Нет доступа
 * {
 *   "message": "Нет доступа"
 * }
 * @example response - 400 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.delete('/', async (request, result) => {
    try {
        const JWT = request.query.jwt;
        const FURNITURE_CARD_ID = request.query.furnitureCardId
        const ACCOUNT_ID = await checkUserAccess(JWT);
        if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(FURNITURE_CARD_ID)
        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Товар не найден' });
        if (FURNITURE_CARD_ITEM.authorId !== ACCOUNT_ID) return result.status(409).json({ message: 'Нет доступа' });
        deleteUsedObject(FURNITURE_CARD_ID, FURNITURE_CARD_ITEM.name)
        await FURNITURE_CARD.deleteOne({ _id: FURNITURE_CARD_ID });
        result.status(201).json({ message: 'Товар успешно удален' })
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});
/**
 * @function GET /furniture/card
 * @instance
 * @summary Получение карточки мебели с изображениями
 * @param {string} jwt - JWT токен
 * @param {string} furnitureCardId - ID карточки мебели
 * @see При успешном запросе возвращает { furnitureCard: {@link module:furnitureCard.FurnitureCard | FunritureCard},authorMacthed:true|false }
 * @see При неуспешном запросе возвращает { message:string }
 * 
 * @example response - 201 - Успех
 * {
 *   "furnitureCard": {
 *     "name": "Кресло",
 *     "description": "Мягкое кресло",
 *     "colors": [{
 *       "color": "#abc",
 *       "imagesData": {
 *         "images": [
 *           "furniture/images/simple?furnitureCardId=123&color=%23abc&idImage=0"
 *         ],
 *         "idMainImage": 0
 *       }
 *     }],
 *     "shops": [{ "cost": 5999, "url": "https://example.com" }],
 *     "authorId": "6641e6b9ce33a302f92f7c11",
 *     "proportions": { "width": 100, "length": 90, "height": 120 },
 *     "additionalData": { "material": "ткань" }
 *   },
 *   "authorMatched": true
 * }
 * @example response - 404 - Товар не найден
 * {
 *   message:"Товар не найден"
 * }
 * 
 */
ROUTER.get('/', async (request, result) => {
    try {
        let FURNITURE_CARD_ITEM = await FURNITURE_CARD.findById(request.query.furnitureCardId)
        if (!FURNITURE_CARD_ITEM) return result.status(404).json({ message: 'Товар не найден' });
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
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
})
async function deleteUsedObject(furnitureCardId, furnitureName) {
    try {
        const PROJECTS = await PROJECT.find(
            { "rooms.objects.objectId": furnitureCardId }
        );
        for (const projectData of PROJECTS) {
            try {
                const AUTH_DATA = await AUTH_ACCOUNT.findOne({ accountId: projectData.authorId });
                if (!AUTH_DATA) continue;

                let roomsNamesArray = [];

                projectData.rooms = projectData.rooms.map(roomData => {

                    const updatedObjects = roomData.objects
                        .filter(objectData => {
                            if (objectData.objectId === furnitureCardId) {
                                roomsNamesArray.push(roomData.name);
                                return false;
                            }
                            return true;
                        });

                    return { ...roomData, objects: updatedObjects };
                });

                await projectData.save();

                const email = AUTH_DATA.emailData?.email || AUTH_DATA.googleData?.email;
                if (!email) continue;

                const ADDITIONAL_DATA = {
                    furnitureName: furnitureName,
                    roomsNamesArray: roomsNamesArray
                };

                sendEmail(email, 'furnitureDelete', ADDITIONAL_DATA);
            } catch (error) {
                console.error(`Error processing project ${projectData._id}:`, error);
            }
        }
    } catch (error) {
        console.error('Error in deleteUsedObject:', error);
        throw error;
    }
}
async function proccessColorsData(FURNITURE_CARD_ITEM) {
    let colorsFromServerData = [];

    for (const COLOR_DATA of FURNITURE_CARD_ITEM.colors) {
        try {
            const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({
                furnitureCardId: FURNITURE_CARD_ITEM._id
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
            console.error('Error processing color:', COLOR_DATA.color, error);
        }
    }
    return colorsFromServerData;
}
module.exports = ROUTER;
