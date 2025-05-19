const MONGOOSE = require('mongoose');

/**
 * @typedef {Object} Account
 * @description Данные пользователя
 * @memberof module:account
 * @property {string} nickname - Никнейм пользователя.
 * @property {string[]} jwts - Массив активных JWT токенов пользователя.
 */

/**
 * @typedef {Object} ToClientAccountData
 * @description Данные пользователя для обработки на клиенте
 * @memberof module:account
 * @property {string} nickname - Никнейм пользователя.
 * @property {string} password - Пароль пользователя(googleId не возвращается)
 * @property {string} nickname - Никнейм пользователя.
 * @property {module:project.Project[]} projects - Массив проектов пользователя.
 * @property {module:account.ToClientFurnitureCardShortData[]} furnitures - Массив карточек мебели пользователя.
 */



const USER_SCHEM = new MONGOOSE.Schema({
  nickname: String,
  jwts: [String]
});

const USER = MONGOOSE.model('Account', USER_SCHEM);

module.exports = USER;
