const jwt = require('jsonwebtoken');
require('dotenv').config();
const cryptoKey = process.env.CRYPTO_KEY
const ACCOUNT = require('../models/account')
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
    let DECODED_ACCOUNT_TOKEN;
    console.log(JWT_TOKEN,DECODED_ACCOUNT_TOKEN)
    try {
        DECODED_ACCOUNT_TOKEN = jwt.verify(JWT_TOKEN, cryptoKey);
    } catch (err) {
        return false;
    }
    if (!DECODED_ACCOUNT_TOKEN) return false;
    const ACCOUNT_ITEM = await ACCOUNT.findById(DECODED_ACCOUNT_TOKEN.accountId);
    if (!ACCOUNT_ITEM) return false;
    return DECODED_ACCOUNT_TOKEN.accountId;
}
