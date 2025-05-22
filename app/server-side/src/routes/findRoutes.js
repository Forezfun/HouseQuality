const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const FURNITURE_CARD = require('../models/furnitureCard');
const { searchPublications, transliterateQuery } = require('../helpers/findPublicationsHelpers');
/**
 * @function GET /find
 * @instance
 * @memberof module:find
 * @summary Получение списка карточек мебели до 50 штук по строке поиска.
 *
 * @param {string} q - Название или описание мебели.
 *
 * @returns {module:furnitureCard.ToClientFurnitureCardShortData[]} furnitures - Список подходящих карточек.
 *
 * @example
 * response - 200 - Успешно
 * {
 *   "resultsArray": [
 *     {
 *       "name": "Кресло",
 *       "cost": 5999,
 *       "furnitureCardId": "6641e6b9ce33a302f92f7c11",
 *       "previewUrl": "furniture/images/simple?furnitureCardId=...&color=%23abc&idImage=0",
 *       "colors": ["#abc", "#def"],
 *       "proportions": { "width": 100, "length": 90, "height": 120 }
 *     }
 *   ]
 * }
 *
 * @example 
 * response - 400 - Ошибка типа диапазона
 * {
 *   "message": "Диапазон должен быть числом"
 * }
 *
 * @see Посмотрите {@link module:category | Category} для возможности получения списка категорий.
 */
ROUTER.get('/', async (request, result) => {
    try {
        let query = request.query.q;
        if (!query || query.trim() === '') {
            return result.status(400).json({ message: 'Строка запроса пустая' });
        }
        query = query.toLowerCase()

        const PUBLICATIONS = await FURNITURE_CARD.find()
            .limit(51)
            .exec();


        const ADD_FIND_PARAMS = {
            threshold: 0.3,
            getTenItems: false
        }
        let filteredPublications = searchPublications(PUBLICATIONS, query, ADD_FIND_PARAMS);


        if (filteredPublications.length < 25) {
            const TRANSLITERED_QUERY = transliterateQuery(query);
            const ADDITIONAL_RESULTS = searchPublications(PUBLICATIONS, TRANSLITERED_QUERY, ADD_FIND_PARAMS);
            const UNIQUE_RESULTS = new Map();

            [...filteredPublications, ...ADDITIONAL_RESULTS].forEach(pub => {
                UNIQUE_RESULTS.set(pub._id.toString(), pub);
            });

            filteredPublications = Array.from(UNIQUE_RESULTS.values());
        }

        const PROCCESSED_PUBLICATIONS = filteredPublications.map(furnitureData => {
            const COST = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;
            const COLOR_REQUEST = furnitureData.colors[0].color;
            return {
                name: furnitureData.name,
                cost: COST,
                colorRequest: COLOR_REQUEST,
                id: furnitureData._id,
                category: furnitureData.additionalData.category
            };
        });

        result.json(PROCCESSED_PUBLICATIONS);
    } catch (error) {
        result.status(500).json({ message: error.message });
    }
});

module.exports = ROUTER;

