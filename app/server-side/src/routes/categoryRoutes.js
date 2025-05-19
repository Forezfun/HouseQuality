const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const CATEGORY = require('../models/category');

/**
 * @description Маршруты для работы с категориями
 * @module category
 */

/**
 * @function GET /category
 * @instance
 * @returns {Object<categoryArray,module:category.Category[]>} Объект, содержащий массив категорий.
 * @description
 * <p>Получает список всех категорий из базы данных</p>
 * <p>Возвращает массив объектов {@link module:category.Category Category}</p>
 *
 * @example
 * {
 *   "categoryArray": [
 * {
 *   "name": "Телевизоры",
 *   "translateOne": "телевизор",
 *   "translateMany": "телевизоры",
 *   "filters": [
 *     {
 *       "name": "Диагональ экрана",
 *       "field": "screenSize",
 *       "type": "range",
 *       "min": 32,
 *       "max": 75
 *     },
 *     {
 *       "name": "Тип подсветки",
 *       "field": "backlightType",
 *       "type": "select",
 *       "options": [
 *         { "name": "LED", "queryValue": "led" },
 *         { "name": "OLED", "queryValue": "oled" },
 *         { "name": "QLED", "queryValue": "qled" }
 *       ]
 *     }
 *   ]
 * }
 */
ROUTER.get('/', async (request, result) => {
    try {
        const CATEGORY_ARRAY = await CATEGORY.find();
        result.status(201).json({ categoryArray: CATEGORY_ARRAY });
    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});
module.exports = ROUTER;
