// utils.js (имя файла, где находятся функции)
const jwt = require('jsonwebtoken'); // Предполагаем, что используете библиотеку jsonwebtoken
const cryptoKey = 'HouseQuality'; // Ваш секретный ключ
const USER = require('../models/user')
// Экспортируем функции
module.exports.isTokenNoneExpired = function isTokenNoneExpired(jwtToken) {
    try {
        jwt.verify(jwtToken, cryptoKey);
        return true;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return false;
        }
        return true;
    }
}

module.exports.checkUserAccess = async function checkUserAccess(jwtToken) {
    const JWT_TOKEN = jwtToken;
    let DECODED_USER_TOKEN;
    try {
        DECODED_USER_TOKEN = jwt.verify(JWT_TOKEN, cryptoKey);
    } catch (err) {
        return false;
    }

    if (!DECODED_USER_TOKEN) return false;
    const USER_ITEM = await USER.findById(DECODED_USER_TOKEN.userId);
    if (!USER_ITEM) return false;
    return DECODED_USER_TOKEN.userId;
}
