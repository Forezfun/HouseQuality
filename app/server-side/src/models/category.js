

const MONGOOSE = require('mongoose');

/**
 * @typedef {Object} FilterOption
 * @memberof module:category
 * @property {string} name - Название опции.
 * @property {string} queryValue - Значение для запроса.
 */

/**
* @typedef {module:category.FilterRange|module:category.FilterSelect} Filter
 * @memberof module:category
 */

/**
 * @typedef {Object} FilterRange
 * @memberof module:category
 * @property {string} name - Название фильтра.
 * @property {string} field - Название поля, к которому относится фильтр.
 * @property {'range'} type - Тип фильтра.
 * @property {number} min - Минимальное значение.
 * @property {number} max - Максимальное значение.
 */

/**
 * @typedef {Object} FilterSelect
 * @memberof module:category
 * @property {string} name - Название фильтра.
 * @property {string} field - Название поля, к которому относится фильтр.
 * @property {'range'} type - Тип фильтра.
 * @property {module:category.FilterOption[]} options - Опции выбора для тега select.
 */

/**
 * @typedef {Object} Category
 * @memberof module:category
 * @property {string} name - Название категории.
 * @property {string} translateOne - Перевод в единственном числе.
 * @property {string} translateMany - Перевод во множественном числе.
 * @property {module:category.Filter[]} filters - Список фильтров категории.
 */

const FILTER_SCHEM = new MONGOOSE.Schema({
    name: String,
    field: String,
    type: {
        type: String,
        required: true,
        enum: ['select', 'range']
    },
    minValue: Number,
    maxValue: Number,
    options: [
        {
            name: String,
            queryValue: String
        }
    ]
});

const CATEGORY_SCHEM = new MONGOOSE.Schema({
    name: String,
    translateOne: String,
    translateMany: String,
    filters: [FILTER_SCHEM]
});

const CATEGORY = MONGOOSE.model('Category', CATEGORY_SCHEM);

module.exports = CATEGORY;
