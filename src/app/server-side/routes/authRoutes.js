const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const dbModule = require('../server');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require("crypto-js");
const cryptoKey = 'HouseQuality';
const jwtService = require('jsonwebtoken');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');

const ACCOUNT_TYPES = ['google', 'email'];

ROUTER.post('/jwt/long/create', async (request, result) => {
    try {
        const db = await dbModule.getDb();

        if (!ACCOUNT_TYPES.includes(request.body.userType)) {
            return result.status(400).json({ message: 'userType has the wrong type' });
        }

        let AUTH_USER_ITEM = await db.collection('authusers').findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });

        if (!AUTH_USER_ITEM) return result.status(404).json({ message: 'User not found' });

        if (request.body.userType === 'email' && AUTH_USER_ITEM.emailData.password !== request.body.password) {
            return result.status(409).json({ message: 'No access' });
        }

        if (request.body.userType === 'google' && AUTH_USER_ITEM.googleData.googleId !== request.body.googleId) {
            return result.status(409).json({ message: 'No access' });
        }

        const USER_ITEM = await db.collection('users').findOne({ _id: AUTH_USER_ITEM.userId });
        if (!USER_ITEM) return result.status(404).json({ message: 'User not found' });

        USER_ITEM.jwtTokens = USER_ITEM.jwtTokens.filter(jwt => { 
            const expired = isTokenNoneExpired(jwt);
            return expired;
        });

        const payload = { userId: AUTH_USER_ITEM.userId };
        const options = { expiresIn: '1w' };
        const JWT = jwtService.sign(payload, cryptoKey, options);
        
        USER_ITEM.jwtTokens.push(JWT);
        await db.collection('users').updateOne({ _id: USER_ITEM._id }, { $set: { jwtTokens: USER_ITEM.jwtTokens } });

        result.status(201).json({ jwt: JWT });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.post('/jwt/temporary/create', async (request, result) => {
    try {
        const db = await dbModule.getDb();

        const AUTH_USER_SERVER_DATA = await db.collection('authusers').findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });

        if (!AUTH_USER_SERVER_DATA) return result.status(404).json({ message: 'User not found' });

        const payload = { userId: AUTH_USER_SERVER_DATA.userId };
        const options = {
            expiresIn: '10min'
        };

        const JWT = jwtService.sign(payload, cryptoKey, options);
        
        const USER_ITEM = await db.collection('users').findOne({ _id: AUTH_USER_SERVER_DATA.userId });
        if (!USER_ITEM) return result.status(404).json({ message: 'User not found' });

        USER_ITEM.jwtTokens.push(JWT);
        await db.collection('users').updateOne({ _id: USER_ITEM._id }, { $set: { jwtTokens: USER_ITEM.jwtTokens } });

        result.status(201).json({ jwtToken: JWT });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.put('/user/update', async (request, result) => {
    try {
        const db = await dbModule.getDb();

        const JWT_TOKEN = request.body.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);

        if (!USER_ID) return result.status(404).json({ message: 'User not found' });

        const AUTH_USER_ITEM = await db.collection('authusers').findOne({ userId: USER_ID });
        if (!AUTH_USER_ITEM) return result.status(404).json({ message: 'User not found' });

        if (request.body.userType === 'email') {
            AUTH_USER_ITEM.emailData.password = request.body.password;
        }

        if (request.body.typeJwt === 'long') {

        }

        await db.collection('authusers').updateOne({ userId: USER_ID }, { $set: AUTH_USER_ITEM });
        result.status(201).json({ message: 'User successfully updated' });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.get('/user/get', async (request, result) => {
    try {
        const db = await dbModule.getDb();

        const JWT_TOKEN = request.query.jwtToken;
        const USER_ID = await checkUserAccess(JWT_TOKEN);

        if (!USER_ID) return result.status(404).json({ message: 'User not found' });

        const USER_ITEM = await db.collection('users').findOne({ _id: USER_ID });
        const AUTH_USER_ITEM = await db.collection('authusers').findOne({ userId: USER_ID });

        if (!USER_ITEM || !AUTH_USER_ITEM) {
            return result.status(404).json({ message: 'User not found' });
        }

        let RESULT_DATA_ITEM = {
            email: AUTH_USER_ITEM.email,
            nickname: USER_ITEM.nickname
        };

        if (AUTH_USER_ITEM.emailData.password !== undefined) {
            RESULT_DATA_ITEM.password = AUTH_USER_ITEM.emailData.password;
        }

        result.status(201).json({ userData: RESULT_DATA_ITEM });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

module.exports = ROUTER;
