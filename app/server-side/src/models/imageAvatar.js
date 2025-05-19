const MONGOOSE = require('mongoose');

/**
 * @typedef {Object} ImageAvatar
 * @memberof module:account
 * @description Данные аватара пользователя.
 * @property {string} filename - Имя изображения, сохранённое на сервере.
 * @property {string} accountId - ID аккаунта пользователя.
 */

const IMAGE_AVATAR_SCHEM = new MONGOOSE.Schema({
    filename: String,
    accountId:String
  })

const IMAGE_AVATAR = MONGOOSE.model('ImageAvatar', IMAGE_AVATAR_SCHEM);

module.exports = IMAGE_AVATAR;
