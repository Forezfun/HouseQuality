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

const ACCOUNT_TYPES = ['google','email']

ROUTER.post('/jwt/long/create', async (request, result) => {
    try {

        if (!ACCOUNT_TYPES.includes(request.body.userType)) {
            return result.status(400).json({ message: 'userType has the wrong type' });
        }
        let AUTH_USER_ITEM = await AUTH_USER.findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });

        if (!AUTH_USER_ITEM) return result.status(404).json({ message: 'User not found' });
        if (request.body.userType === 'email' && AUTH_USER_ITEM.emailData.password !== request.body.password) {
            console.log(AUTH_USER_ITEM.password == request.body.password)
            return result.status(409).json({ message: 'No access' });
        }

        if (request.body.userType === 'google' && AUTH_USER_ITEM.googleData.googleId !== request.body.googleId) {
            return result.status(409).json({ message: 'No access' });
        }
        const USER_ITEM = await USER.findById(AUTH_USER_ITEM.userId);
        if (!USER_ITEM) return result.status(404).json({ message: 'User not found' });
        USER_ITEM.jwtTokens.filter(jwt => isTokenNoneExpired(jwt));
        console.log(USER_ITEM)
        const payload = { userId: AUTH_USER_ITEM.userId };
        const options = { expiresIn: '1w' };
        const JWT = jwtService.sign(payload, cryptoKey, options);
        console.log(JWT)
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
        const JWT_TOKEN = request.body.jwtToken
        const USER_ID = await checkUserAccess(JWT_TOKEN)

        if (!USER_ID) return result.status(404).json({ message: 'User not found' });

        AUTH_USER_ITEM = await AUTH_USER.findOne({ userId: USER_ID })
        if (!AUTH_USER_ITEM) return result.status(404).json({ message: 'User not found' });

        if (request.body.userType === 'email') {
            AUTH_USER_ITEM.emailData.password = request.body.password
        }
        if (request.body.typeJwt === 'long') {
            
        }
        await AUTH_USER_ITEM.save();
        result.status(201).json({ message: 'User successfully updated' });
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
