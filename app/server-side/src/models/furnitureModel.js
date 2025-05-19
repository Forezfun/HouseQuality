const MONGOOSE = require('mongoose');

/**
 * @typedef {Object} FurnitureModel
 * @memberof module:furnitureCard
 * @description Данные модели мебели.
 * @property {string} filename - Имя файла модели, сохранённое на сервере.
 * @property {string} furnitureCardId - ID карточки мебели, к которой относится модель.
 * @property {string} originalName - Оригинальное имя файла, загруженного пользователем.
 */

const FURNITURE_MODEL_SCHEM = new MONGOOSE.Schema({
  filename: String,
  furnitureCardId: String,
  originalName: String
});

const FURNITURE_MODEL = MONGOOSE.model('FurnitureModel', FURNITURE_MODEL_SCHEM);

module.exports = FURNITURE_MODEL;
