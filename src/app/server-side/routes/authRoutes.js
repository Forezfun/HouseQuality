require('dotenv').config();
const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const ACCOUNT = require('../models/account');
const cryptoKey = process.env.CRYPTO_KEY
const sendCheckCode = require('../sendcode');
const AUTH_ACCOUNT = require('../models/authAccount');
const jwtService = require('jsonwebtoken');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers')

const ACCOUNT_TYPES = ['google', 'email']

ROUTER.post('/jwt/long', async (request, result) => {
    try {

        if (!ACCOUNT_TYPES.includes(request.body.accountType)) {
            return result.status(400).json({ message: 'accountType has the wrong type' });
        }
        let AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });

        if (!AUTH_ACCOUNT_ITEM) return result.status(404).json({ message: 'User not found' });
        if (request.body.accountType === 'email' && AUTH_ACCOUNT_ITEM.emailData.password !== request.body.password) {
            console.log(AUTH_ACCOUNT_ITEM.password == request.body.password)
            return result.status(409).json({ message: 'No access' });
        }

        if (request.body.accountType === 'google' && AUTH_ACCOUNT_ITEM.googleData.googleId !== request.body.googleId) {
            return result.status(409).json({ message: 'No access' });
        }
        const ACCOUNT_ITEM = await ACCOUNT.findById(AUTH_ACCOUNT_ITEM.accountId);
        if (!ACCOUNT_ITEM) return result.status(404).json({ message: 'User not found' });
        ACCOUNT_ITEM.jwtTokens = ACCOUNT_ITEM.jwtTokens.filter(jwt => { const expired = isTokenNoneExpired(jwt); console.log(expired); return expired });
        console.log(ACCOUNT_ITEM)
        const payload = { accountId: AUTH_ACCOUNT_ITEM.accountId };
        const options = { expiresIn: '1w' };
        const JWT = jwtService.sign(payload, cryptoKey, options);
        console.log(JWT)
        ACCOUNT_ITEM.jwtTokens.push(JWT);
        await ACCOUNT_ITEM.save();
        result.status(201).json({ jwtToken: JWT });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.post('/jwt/temporary', async (request, result) => {
    try {
        const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({
            $or: [
                { 'emailData.email': request.body.email },
                { 'googleData.email': request.body.email }
            ]
        });
        if (!AUTH_ACCOUNT_ITEM) return result.status(404).json({ message: 'User not found' });
        const payload = { accountId: AUTH_ACCOUNT_ITEM.accountId }
        const options = {
            expiresIn: '10min'
        };
        const JWT = jwtService.sign(payload, cryptoKey, options)
        const ACCOUNT_ITEM = await ACCOUNT.findById(AUTH_ACCOUNT_ITEM.accountId);
        if (!ACCOUNT_ITEM) return result.status(404).json({ message: 'User not found' });
        ACCOUNT_ITEM.jwtTokens.push(JWT);
        await ACCOUNT_ITEM.save();
        result.status(201).json({ jwtToken: JWT });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});
ROUTER.put('/account', async (request, result) => {
    try {
        console.log(request.query, request.body, request.params)
        const JWT_TOKEN = request.body.jwtToken
        const ACCOUNT_ID = await checkUserAccess(JWT_TOKEN)

        if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
        console.log(ACCOUNT_ID)
        AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID })
        if (!AUTH_ACCOUNT_ITEM) return result.status(404).json({ message: 'User not found' });

        if (request.body.accountType === 'email') {
            AUTH_ACCOUNT_ITEM.emailData.password = request.body.password
        }
        await AUTH_ACCOUNT_ITEM.save();
        result.status(201).json({ message: 'User successfully updated' });
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
});

ROUTER.get('/account/code', async (request, result) => {
    try {
        const ACCOUNT_EMAIL = request.query.email
        const FOUND_ACCOUNT = await AUTH_ACCOUNT.findOne({
            'emailData.email': ACCOUNT_EMAIL
        });
        if (!FOUND_ACCOUNT) return result.status(404).json({ message: 'User not found' });
        const SENT_CODE_OBJECT = sendCheckCode(ACCOUNT_EMAIL)
        console.log(SENT_CODE_OBJECT)
        result.status(201).json(SENT_CODE_OBJECT);
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
})



module.exports = ROUTER;
