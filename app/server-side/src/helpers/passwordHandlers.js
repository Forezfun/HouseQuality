require('dotenv').config();
const CryptoJS = require("crypto-js");
const cryptoKey = process.env.CRYPTO_KEY
module.exports.encryptPassword = function encryptPassword(password) {
    return CryptoJS.AES.encrypt(password, cryptoKey);
}
module.exports.decryptPassword = function decryptPassword(password) {
    return CryptoJS.AES.decrypt(password, cryptoKey).toString(CryptoJS.enc.Utf8)
}