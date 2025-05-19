const MONGOOSE = require('mongoose');
/**
 * @typedef {Object} FurnitureCard
 * @memberof module:furnitureCard
 * @description Данные для создания/обновления/получения полной информации карточки мебели.
 * @property {string} name - Название предмета мебели.
 * @property {string} description - Описание товара.
 * @property {module:furnitureCard.ColorInfo[]} colors - Варианты цветов.
 * @property {module:furnitureCard.ShopInfo[]} shops - Список магазинов с ценами и ссылками.
 * @property {string} authorId - ID автора (пользователя).
 * @property {module:furnitureCard.Proportions} proportions - Габариты мебели.
 * @property {module:furnitureCard.additionalData} additionalData - Дополнительные данные.
 */
/**
 * @typedef {Object} additionalData
 * @memberof module:furnitureCard
 * @description Дополнительные данные карточки мебели(для лучшего поиска).
 * @property {string} [category] - Поле name выбранной категории.
 * @property {number|string} [key:string] - Любая дополнительная информация.
 */
/**
 * @typedef {Object} ToClientFurnitureCardShortData
 * @description Данные карточки мебели для получения на страницах магазина/поиска/аккаунта.
 * @memberof module:furnitureCard
 * @property {string} name - Название предмета мебелия.
 * @property {number} cost - Минимальная стоимость мебели.
 * @property {string} furnitureCardId - ID карточки мебели.
 * @property {string} previewUrl - неполный url основного изображения первого цвета карточки мебели.
 * Нужно вначало добавить базовый url сервера.
 */
/**
 * @typedef {Object} Proportions
 * @memberof module:furnitureCard
 * @description Параметры мебели.
 * @property {number} width - Ширина предмета мебели.
 * @property {number} length - Длина предмета мебели.
 * @property {number} height - Высота предмета мебели.
 */

/**
 * @typedef {Object} ColorInfo
 * @memberof module:furnitureCard
 * @description Данные для цвета мебели.
 * @property {module:furnitureCard.ImagesData[]} imagesData - Объект с данными изображений.
 * @property {string} color - Цвет.
 */

/**
 * @typedef {Object} ImagesData
 * @memberof module:furnitureCard
 * @description Данные изображений для цвета мебели.
 * @property {number} idMainImage - Индекс основного изображения карточки мебели.
 * @property {string[]} images - неполные url изображений, связанных с цветом.
 * Нужно вначало добавить базовый url сервера.
 */

/**
 * @typedef {Object} ShopInfo
 * @memberof module:furnitureCard
 * @description Данные магазина.
 * @property {number} cost - Стоимость в магазине.
 * @property {string} url - URL магазина или страницы товара.
 */


const PROPORTIONS_DATA_SCHEM = new MONGOOSE.Schema({
  width: Number,
  length: Number,
  height: Number
});

const FURNITURE_CARD_SCHEM = new MONGOOSE.Schema({
  name: String,
  description: String,
  colors: [{ color: String, idImages: String }],
  shops: [{ cost: Number, url: String }],
  authorId: String,
  proportions: PROPORTIONS_DATA_SCHEM,
  additionalData: { type: MONGOOSE.Schema.Types.Mixed }
});

const FURNITURE_CARD = MONGOOSE.model('FurnitureCard', FURNITURE_CARD_SCHEM);

module.exports = FURNITURE_CARD;
