const MONGOOSE = require('mongoose');

/**
 * @typedef {Object} AuthAccount
 * @description Регистрационные данные пользователя
 * @memberof module:account
 * @property {string} accountId - ID связанного пользователя.
 * @property {module:account.EmailData} emailData - Регистрационные данные входа по почте.
 * @property {module:account.GoogleData} googleData - Регистрационные данные входа через Google.
 */

/**
 * @typedef {Object} EmailData
 * @description Регистрационные данные email-пользователя
 * @memberof module:account
 * @property {string} email - Email пользователя.
 * @property {string} password - Пароль.
 */

/**
 * @typedef {Object} GoogleData
 * @description Регистрационные данные google-пользователя
 * @memberof module:account
 * @property {string} email - Email, связанный с Google аккаунтом.
 * @property {string} googleId - Уникальный идентификатор Google пользователя.
 */

const AUTH_ACCOUNT_SCHEM = new MONGOOSE.Schema({
  accountId: String,
  emailData: { email: String, password: String },
  googleData: { email: String, googleId: String }
});

const AUTH_ACCOUNT = MONGOOSE.model('AuthAccount', AUTH_ACCOUNT_SCHEM);

module.exports = AUTH_ACCOUNT;
