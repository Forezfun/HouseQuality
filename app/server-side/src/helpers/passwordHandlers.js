require('dotenv').config();
const CryptoJS = require("crypto-js");
const cryptoKey = process.env.CRYPTO_KEY
module.exports.encryptPassword = function encryptPassword(password) {
    return CryptoJS.AES.encrypt(password, cryptoKey);
}
module.exports.decryptPassword = function decryptPassword(password) {
      try {
    const bytes = CryptoJS.AES.decrypt(password, cryptoKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) throw new Error('Invalid UTF-8 or wrong key');
    return decrypted;
  } catch (error) {
    return "";
  }
}