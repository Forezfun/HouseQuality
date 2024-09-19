const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const USER = require('../models/user');
// const PUBLICATION = require('../models/publication');
const AUTH_USER = require('../models/authUser');
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require("crypto-js");
const cryptoKey = 'HouseQuality'
const sendCheckCode = require('../sendcode');
const FURNITURE_CARD = require('../models/furnitureCard')
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers')
ROUTER.delete('/jwt/delete', async (request, result) => {
  try {
    const JWT_TOKEN = request.params.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const AUTH_USER_ITEM = await AUTH_USER.findOne({ userId: USER_ID });
    if (!AUTH_USER_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    console.log(AUTH_USER_ITEM.jwtTokens)
    AUTH_USER_ITEM.jwtTokens.filter(jwtToken => { return jwtToken !== JWT_TOKEN ? true : false })
    console.log(AUTH_USER_ITEM.jwtTokens)
    await AUTH_USER_ITEM.save()
    result.status(201).json({ message: 'JWT deleted' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});
ROUTER.post('/user/create', async (request, result) => {
  try {
    console.log(request.body)
    let USER_ITEM = await AUTH_USER.findOne({
      $or: [
        { 'emailData.email': request.body.email },
        { 'googleData.email': request.body.email }
      ]
    });
    if (USER_ITEM) return result.status(409).json({ message: 'User already exists' });
    USER_ITEM = new USER({
      nickname: request.body.nickname,
      jwtTokens: []
    })
    let AUTH_USER_ITEM = new AUTH_USER({
      userId: USER_ITEM._id,
      emailData: {},
      googleData: {}
    })
    if (request.body.userType === 'email') {
      AUTH_USER_ITEM.emailData = {
        email: request.body.email,
        password: request.body.password
      }
    }
    if (request.body.userType === 'google') {
      AUTH_USER_ITEM.googleData = {
        email: request.body.email,
        googleId: request.body.googleId
      }
    }
    await USER_ITEM.save()
    await AUTH_USER_ITEM.save()
    result.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});
ROUTER.get('/user/get', async (request, result) => {
  try {
    const JWT_TOKEN = request.query.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    console.log(USER_ID)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const USER_ITEM = await USER.findById(USER_ID);
    const AUTH_USER_ITEM = await AUTH_USER.findOne({ userId: USER_ID });
    if (!USER_ITEM || !AUTH_USER_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    let RESULT_DATA_ITEM = {
      email: AUTH_USER_ITEM.emailData.email,
      nickname: USER_ITEM.nickname
    }
    if (AUTH_USER_ITEM.emailData.password !== undefined) {
      RESULT_DATA_ITEM.password = AUTH_USER_ITEM.emailData.password
    }
    const USER_PROJECTS = await FURNITURE_CARD.find({authorId:USER_ID})
    RESULT_DATA_ITEM.projects=USER_PROJECTS
    result.status(201).json({ userData: RESULT_DATA_ITEM });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
ROUTER.delete('/user/delete', async (request, result) => {
  try {
    const JWT_TOKEN = request.params.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const USER_ITEM = await USER.findById(USER_ID);
    const AUTH_USER_ITEM = await AUTH_USER.findOne({ userId: USER_ID });
    if (!USER_ITEM || !AUTH_USER_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    await AUTH_USER_ITEM.remove()
    await USER_ITEM.remove()
    result.status(201).json({ message: 'User deleted successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
ROUTER.put('/user/put', async (request, result) => {
  try {
    const JWT_TOKEN = request.body.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const USER_ITEM = await USER.findById(USER_ID);
    if (!USER_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    if(userType==='email'){
    USER_ITEM.nickname = request.body.nickname
    }
    await USER_ITEM.save()
    result.status(201).json({ userData: RESULT_DATA_ITEM });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
module.exports = ROUTER;
