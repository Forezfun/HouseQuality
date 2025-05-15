const JWT_SERVICE = require('jsonwebtoken');
require('dotenv').config();
const cryptoKey = process.env.CRYPTO_KEY
const ACCOUNT = require('../models/account')

module.exports.isTokenNoneExpired = function isTokenNoneExpired(jwt) {
    try {
        jwt.verify(jwt, cryptoKey);
        return true;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return false;
        }
        return true;
    }
}

module.exports.checkUserAccess = async function checkUserAccess(jwt) {
    const JWT = jwt;
    let DECODED_ACCOUNT_TOKEN;
    try {
        DECODED_ACCOUNT_TOKEN = JWT_SERVICE.verify(JWT, cryptoKey);
    } catch (error) {
        return false;
    }
    if (!DECODED_ACCOUNT_TOKEN) return false;
    const ACCOUNT_ITEM = await ACCOUNT.findById(DECODED_ACCOUNT_TOKEN.accountId);
    if (!ACCOUNT_ITEM) return false;
    return DECODED_ACCOUNT_TOKEN.accountId;
}
