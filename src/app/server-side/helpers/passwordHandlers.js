const cryptoKey = 'HouseQuality'
module.exports.encryptPassword = function encryptPassword(password) {
    return CryptoJS.AES.encrypt(password, cryptoKey);
}
module.exports.decryptPassword = function decryptPassword(password) {
    return CryptoJS.AES.decrypt(password, cryptoKey).toString(CryptoJS.enc.Utf8)
}