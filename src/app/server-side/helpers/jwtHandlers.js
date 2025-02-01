const jwt = require('jsonwebtoken'); // Предполагаем, что используете библиотеку jsonwebtoken
const cryptoKey = 'HouseQuality'; // Ваш секретный ключ
const dbModule = require('../server'); // Импортируем dbModule для доступа к базе данных
const { ObjectId } = require('mongodb');


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
    console.log(DECODED_USER_TOKEN.userId)
    if (!DECODED_USER_TOKEN) return false;

    const db = await dbModule.getDb();
    const USER_ITEM = await db.collection('users').findOne({ _id: new ObjectId(DECODED_USER_TOKEN.userId) });
    if (!USER_ITEM) return false;
    
    return USER_ITEM._id;
}
