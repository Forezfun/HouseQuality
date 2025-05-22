const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const FURNITURE_CARD = require('../models/furnitureCard')
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const { searchPublications, transliterateQuery } = require('../helpers/findPublicationsHelpers');

/**
 * @module find
 * @description Маршруты для работы с карточками мебели.
 * 
 * <h3>Операции, выполняемые при работе</h3>
 * <h4>/find</h4>
 * <p>Поиск z-функцией по сложенным в один текст описанию и названию мебели с параметрами:</p>
 * <p>-Переданный запрос</p>
 * <p>-Переведенный транслитом переданный запрос</p>
 * <h4>/shop</h4>
 * <p>Игнорирование уже полученных данных</p>
 * <p>Поиск по параметрам(query)</p>
 * <p>Поиск z-функцией по сложенным в один текст описанию и названию мебели с параметрами:</p>
 * <p>-Переданный запрос</p>
 * <p>-Переведенный транслитом переданный запрос</p>
 * <h3>Для чего что подходит</h3>
 * <h4>/find</h4>
 * <p>Быстрое получение малоточных данных</p>
 * <h4>/shop</h4>
 * <p>Средней скорости получение точных фильтрованных данных</p>
 */

/**
 * @typedef {Object} OptionSelectQuery
 * @memberof module:find
 * @description Данные параметра фильтрации по нескольким вариантам.
 * @property {'select'} type - Тип параметра.
 * @property {string[]} value - Массив выбранных значений (options[i].queryValue).
 */

/**
 * @typedef {Object} OptionRangeQuery
 * @memberof module:find
 * @description Данные параметра фильтрации по диапазону.
 * @property {'range'} type - Тип параметра.
 * @property {number} min - Минимальное значение диапазона.
 * @property {number} max - Максимальное значение диапазона.
 */

/**
 * @typedef {Object<string, module:find.OptionRangeQuery|module:find.OptionSelectQuery>} FilterQueryObject
 * @memberof module:find
 * @description 
 * <table>
 *   <thead>
 *     <tr>
 *       <th>Ключ</th>
 *       <th>Тип фильтра</th>
 *       <th>Тип значения</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>{@link module:category.Filter | Filter} ключ field</td>
 *       <td>select</td>
 *       <td>{@link module:find.OptionSelectQuery | OptionSelectQuery}</td>
 *     </tr>
 *     <tr>
 *       <td>{@link module:category.Filter | Filter} ключ field</td>
 *       <td>range</td>
 *       <td>{@link module:find.OptionRangeQuery | OptionRangeQuery}</td>
 *     </tr>
 *     <tr>
 *       <td>'name'</td>
 *       <td>-</td>
 *       <td>string</td>
 *     </tr>
 *   </tbody>
 * </table>
 * @example 
 * Пример объекта фильтрации
 * const filters = {
 *   material: {
 *     type: 'select',
 *     value: ['ткань', 'велюр']
 *   },
 *   height: {
 *     type: 'range',
 *     min: 50,
 *     max: 120
 *   }
 * };
 *
 * @example 
 * Что передаётся в запрос — JSON.stringify(query)
 * "{\"material\":{\"type\":\"select\",\"value\":[\"ткань\",\"велюр\"]},\"height\":{\"type\":\"range\",\"min\":50,\"max\":120}}"
 */

/**
 * @function GET /shop
 * @instance
 * @memberof module:find
 * @summary Получение списка карточек мебели до 10 штук с фильтрами поиска.
 *
 * @param {string} categoryName - Название категории (поле name).
 * @param {number} startRange - Количество элементов, пропускаемых в начале (для пагинации).
 * @param {module:find.FilterQueryObject} query - Взятый в JSON.stringify(Объект фильтров).
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
        let START_RANGE = Number(request.query.startRange);
        const CATEGORY_NAME = request.query.category;

        if (isNaN(START_RANGE)) throw new Error("Диапазон должен быть числом");

        let filtersObject = {};
        if (request.query.filters) {
            filtersObject = JSON.parse(request.query.filters);
        }

        const FIND_PARAMS = getFindParams(CATEGORY_NAME, filtersObject);
        const TOTAL_COUNT = await FURNITURE_CARD.countDocuments(FIND_PARAMS);
        let furnitureCardsArray = await FURNITURE_CARD.find(FIND_PARAMS)
            .skip(START_RANGE)
            .limit(10);

        START_RANGE += 10;

        if (furnitureCardsArray.length < 10) {
            while (START_RANGE < TOTAL_COUNT && furnitureCardsArray.length < 10) {
                const nextBatch = await FURNITURE_CARD.find(FIND_PARAMS)
                    .skip(START_RANGE)
                    .limit(10)
                    .exec();

                furnitureCardsArray.push(...nextBatch);
                START_RANGE += 10;
            }
        }

        const ADD_FIND_PARAMS = {
            threshold: 0.5,
            getTenItems: false
        }

        if (filtersObject?.name) {
            let searchResults = searchPublications(furnitureCardsArray, filtersObject.name, ADD_FIND_PARAMS);

            if (searchResults.length < 10 && TOTAL_COUNT > 10) {
                ADD_FIND_PARAMS.threshold = 0.7;
                const additionalResults = searchPublications(
                    furnitureCardsArray,
                    transliterateQuery(filtersObject.name),
                    ADD_FIND_PARAMS
                );

                const existingIds = new Set(searchResults.map(doc => doc._id.toString()));
                for (const doc of additionalResults) {
                    if (!existingIds.has(doc._id.toString())) {
                        searchResults.push(doc);
                        if (searchResults.length >= 10) break;
                    }
                }
            }

            furnitureCardsArray = searchResults;
        }

        const RESULTS_ARRAY = await Promise.all(
            furnitureCardsArray.map(async (furnitureData) => {
                if (!furnitureData.shops || furnitureData.shops.length === 0) return undefined;
                const minCost = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;

                const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({
                    furnitureCardId: furnitureData._id
                });

                if (!IMAGES_FURNITURE_ITEM) return undefined;

                return {
                    name: furnitureData.name,
                    cost: minCost,
                    furnitureCardId: furnitureData._id,
                    previewUrl: `furniture/images/simple?furnitureCardId=${furnitureData._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${IMAGES_FURNITURE_ITEM.idMainImage}`,
                    colors: furnitureData.colors?.map(colorData => colorData.color) || [],
                    proportions: furnitureData.proportions || null
                };
            })
        );

        const filteredResults = RESULTS_ARRAY.filter(item => item !== undefined);

        result.status(200).json({ resultsArray: filteredResults });

    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});

function getFindParams(categoryName, filtersObject) {
    const baseFilter = (categoryName === 'all') ? {} : { 'additionalData.category': categoryName };

    const additionalFilters = [];

    if (filtersObject) {
        for (const key in filtersObject) {
            if (!filtersObject.hasOwnProperty(key)) continue;

            const filterValue = filtersObject[key];

            if (Array.isArray(filterValue)) {
                const condition = {};
                condition[`additionalData.${key}`] = { $in: filterValue };
                additionalFilters.push(condition);

            } else if (typeof filterValue === 'object' && filterValue !== null) {
                const condition = {};
                const rangeFilter = {};
                if (filterValue.min !== undefined) rangeFilter.$gte = filterValue.min;
                if (filterValue.max !== undefined) rangeFilter.$lte = filterValue.max;
                condition[`additionalData.${key}`] = rangeFilter;
                additionalFilters.push(condition);
            }
        }
    }

    return additionalFilters.length > 0
        ? { $and: [baseFilter, ...additionalFilters] }
        : baseFilter;
}
module.exports = ROUTER;