const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const ACCOUNT = require('../models/account');
const AUTH_ACCOUNT = require('../models/authAccount');
const PROJECT = require('../models/project')
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');
const IMAGES_FURNITURE = require('../models/imagesFurniture');

ROUTER.delete('/jwt/delete', async (request, result) => {
  try {
    const JWT = request.params.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    console.log(AUTH_ACCOUNT_ITEM.jwts)
    AUTH_ACCOUNT_ITEM.jwts.filter(jwt => { return jwt !== JWT ? true : false })
    console.log(AUTH_ACCOUNT_ITEM.jwts)
    await AUTH_ACCOUNT_ITEM.save()
    result.status(201).json({ message: 'JWT deleted' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});
ROUTER.post('/', async (request, result) => {
  try {
    console.log(request.body)
    let ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({
      $or: [
        { 'emailData.email': request.body.email },
        { 'googleData.email': request.body.email }
      ]
    });
    if (ACCOUNT_ITEM) return result.status(409).json({ message: 'User already exists' });
    ACCOUNT_ITEM = new ACCOUNT({
      nickname: request.body.nickname,
      jwts: []
    })
    let AUTH_ACCOUNT_ITEM = new AUTH_ACCOUNT({
      accountId: ACCOUNT_ITEM._id,
      emailData: {},
      googleData: {}
    })
    if (request.body.accountType === 'email') {
      AUTH_ACCOUNT_ITEM.emailData = {
        email: request.body.email,
        password: request.body.password
      }
    }
    if (request.body.accountType === 'google') {
      AUTH_ACCOUNT_ITEM.googleData = {
        email: request.body.email,
        googleId: request.body.googleId
      }
    }
    await ACCOUNT_ITEM.save()
    await AUTH_ACCOUNT_ITEM.save()
    result.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});
ROUTER.get('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    console.log('id: ',ACCOUNT_ID)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!ACCOUNT_ITEM || !AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    let RESULT_DATA_ITEM = {
      email: AUTH_ACCOUNT_ITEM.emailData.email,
      nickname: ACCOUNT_ITEM.nickname
    }
    if (AUTH_ACCOUNT_ITEM.emailData.password !== undefined) {
      RESULT_DATA_ITEM.password = AUTH_ACCOUNT_ITEM.emailData.password
    }
    const ACCOUNT_PROJECTS = await PROJECT.find({ authorId: ACCOUNT_ID })

    RESULT_DATA_ITEM.projects = ACCOUNT_PROJECTS
    RESULT_DATA_ITEM.furnitures = await proccessFurnitures(ACCOUNT_ID)
    result.status(201).json({ accountData: RESULT_DATA_ITEM });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
async function proccessFurnitures(ACCOUNT_ID) {
  let furnitures =[]
  try {
    const ACCOUNT_FUNRITURE_CARDS = await FURNITURE_CARD.find({ authorId: ACCOUNT_ID })
    for(const FURNITURE_DATA of ACCOUNT_FUNRITURE_CARDS){
      const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({furnitureId:FURNITURE_DATA._id})
      furnitures.push({
        _id:FURNITURE_DATA._id,
        name:FURNITURE_DATA.name,
        previewUrl:`furniture/images/simple?furnitureCardId=${FURNITURE_DATA._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${IMAGES_FURNITURE_ITEM.idMainImage||0}`
      })
    }
  } catch (error) {
    console.log(error)
    return error
  }
  return furnitures
}
ROUTER.delete('/', async (request, result) => {
  try {
    const JWT = request.params.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!ACCOUNT_ITEM || !AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    await AUTH_ACCOUNT_ITEM.remove()
    await ACCOUNT_ITEM.remove()
    result.status(201).json({ message: 'User deleted successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
ROUTER.put('/', async (request, result) => {
  try {
    console.log('acc', request.query, request.body, request.params)
    const JWT = request.body.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    console.log(ACCOUNT_ID)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    if (!ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    ACCOUNT_ITEM.nickname = request.body.nickname
    await ACCOUNT_ITEM.save()
    result.status(201).json({ message: 'User successfully updated' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
module.exports = ROUTER;
