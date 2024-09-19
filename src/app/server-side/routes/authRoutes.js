const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const USER = require('../models/user');
// const PUBLICATION = require('../models/publication');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require("crypto-js");
const cryptoKey = 'HouseQuality'
const sendCheckCode = require('../sendcode');
const AUTH_USER = require('../models/authUser');
const jwtService = require('jsonwebtoken');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers')
ROUTER.post('/jwt/long/create', async (request, result) => {
    try {
        let AUTH_USER_ITEM = await AUTH_USER.findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });
        if (!AUTH_USER_ITEM) return result.status(404).json({ message: 'User not found' });

        if (request.body.type === 'email' && AUTH_USER_ITEM.password !== request.body.password) {
            return result.status(403).json({ message: 'No access' });
        }

        if (request.body.type === 'google' && AUTH_USER_ITEM.googleId !== request.body.googleId) {
            return result.status(403).json({ message: 'No access' });
        }
        const USER_ITEM = await USER.findById(AUTH_USER_ITEM.userId);
        if (!USER_ITEM) return result.status(404).json({ message: 'User not found' });
        USER_ITEM.jwtTokens.filter(jwt => isTokenNoneExpired(jwt));
    
        const payload = { userId: AUTH_USER_ITEM.userId };
        const options = { expiresIn: '1w' };
        const JWT = jwtService.sign(payload, cryptoKey, options);

        USER_ITEM.jwtTokens.push(JWT);
        await USER_ITEM.save();
        result.status(201).json({ jwt: JWT });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.post('/jwt/temporary/create', async (request, result) => {
    try {
        const AUTH_USER_SERVER_DATA = await AUTH_USER.findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });
        if (!AUTH_USER_SERVER_DATA) return result.status(404).json({ message: 'User not found' });
        const payload = { userId: AUTH_USER_SERVER_DATA.userId }
        const options = {
            expiresIn: '10min'
        };
        const JWT = jwtService.sign(payload, cryptoKey, options)
        const USER_ITEM = await USER.findById(AUTH_USER_ITEM.userId);
        if (!USER_ITEM) return result.status(404).json({ message: 'User not found' });
        USER_ITEM.jwtTokens.push(JWT);
        await USER_ITEM.save();
        result.status(201).json({ jwtToken: JWT });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});
ROUTER.put('/user/update', async (request, result) => {
    try {
        const JWT_TOKEN = request.params.jwtToken
        const DECODED_USER_TOKEN = jwtService.verify(JWT_TOKEN, cryptoKey)
        if (!DECODED_USER_TOKEN) return result.status(404).json({ message: 'User not found' });
        AUTH_USER_ITEM = await AUTH_USER.findOne({ userId: DECODED_USER_TOKEN.userId })
        if (!AUTH_USER_ITEM) return result.status(404).json({ message: 'User not found' });
        if (request.params.type_jwt === 'temporary') {
            if (request.params.userType === 'email') {
                AUTH_USER_ITEM.password = request.params.password
            }
        }
        if (request.params.type_jwt === 'long') {
            if (request.params.userType === 'email') {
                AUTH_USER_ITEM.emailData.email = request.params.email
                AUTH_USER_ITEM.emailData.password = request.params.password
            }
        }
        await AUTH_USER_ITEM.save();
        result.status(201).json({ message: 'user successful updated' });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});
ROUTER.get('/user/get', async (request, result) => {
    try {
      const JWT_TOKEN = request.query.jwtToken
      const USER_ID = await checkUserAccess(JWT_TOKEN)
      if (!USER_ID) return result.status(404).json({ message: 'User not found' });
      const USER_ITEM = await USER.findById(USER_ID);
      const AUTH_USER_ITEM = await AUTH_USER.findOne({ userId: USER_ID });
      if (!USER_ITEM || !AUTH_USER_ITEM) {
        return result.status(404).json({ message: 'User not found' });
      }
      let RESULT_DATA_ITEM = {
        email: AUTH_USER_ITEM.email,
        nickname: USER_ITEM.nickname
      }
      if (AUTH_USER_ITEM.emailData.password !== undefined) {
        RESULT_DATA_ITEM.password = AUTH_USER_ITEM.emailData.password
      }
      result.status(201).json({ userData: RESULT_DATA_ITEM });
    } catch (err) {
      result.status(400).json({ message: err.message });
    }
  })


module.exports = ROUTER;
