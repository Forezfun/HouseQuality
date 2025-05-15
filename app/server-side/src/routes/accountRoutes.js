const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const ACCOUNT = require('../models/account');
const AUTH_ACCOUNT = require('../models/authAccount');
const PROJECT = require('../models/project')
const FURNITURE_CARD = require('../models/furnitureCard')
const { checkUserAccess } = require('../helpers/jwtHandlers');
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const { encryptPassword,decryptPassword } = require('../helpers/passwordHandlers');


ROUTER.delete('/jwt/delete', async (request, result) => {
  try {
    const JWT = request.params.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }
    AUTH_ACCOUNT_ITEM.jwts.filter(jwt => { return jwt !== JWT ? true : false })
    await AUTH_ACCOUNT_ITEM.save()
    result.status(201).json({ message: 'JWT deleted' });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
});
ROUTER.post('/', async (request, result) => {
  try {
    let ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({
      $or: [
        { 'emailData.email': request.body.email },
        { 'googleData.email': request.body.email }
      ]
    });
    if (ACCOUNT_ITEM) return result.status(409).json({ message: 'Аккаунт уже существует' });
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
        password: encryptPassword(request.body.password)
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
    result.status(201).json({ message: 'Пользователь создан' });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
});
ROUTER.get('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!ACCOUNT_ITEM || !AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }
    let RESULT_DATA_ITEM = {
      email: AUTH_ACCOUNT_ITEM.emailData.email,
      nickname: ACCOUNT_ITEM.nickname
    }
    if (AUTH_ACCOUNT_ITEM.emailData.password !== undefined) {
      RESULT_DATA_ITEM.password = decryptPassword(AUTH_ACCOUNT_ITEM.emailData.password)
    }
    const ACCOUNT_PROJECTS = await PROJECT.find({ authorId: ACCOUNT_ID })

    RESULT_DATA_ITEM.projects = ACCOUNT_PROJECTS
    RESULT_DATA_ITEM.furnitures = await proccessFurnitures(ACCOUNT_ID)
    result.status(201).json({ accountData: RESULT_DATA_ITEM });
  } catch (error) {
    result.status(400).json({ message: error.message });
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
    return error
  }
  return furnitures
}
ROUTER.delete('/', async (request, result) => {
  try {
    const JWT = request.params.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!ACCOUNT_ITEM || !AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }
    await AUTH_ACCOUNT_ITEM.remove()
    await ACCOUNT_ITEM.remove()
    result.status(201).json({ message: 'Аккаунт успешно удален' });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
})
ROUTER.put('/', async (request, result) => {
  try {
    const JWT = request.body.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    if (!ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }
    ACCOUNT_ITEM.nickname = request.body.nickname
    await ACCOUNT_ITEM.save()
    result.status(201).json({ message: 'Аккаунт обновлен' });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
})
module.exports = ROUTER;
