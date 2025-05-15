const EXPRESS = require('express');
const { ObjectId } = require('mongodb');
const ROUTER = EXPRESS.Router();
const PROJECT = require('../models/project.js');
const { checkUserAccess } = require('../helpers/jwtHandlers');
const FURNITURE_CARD = require('../models/furnitureCard.js');

ROUTER.delete('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const AUTH_ACCOUNT_ITEM = await PROJECT.findByIdAndDelete(request.query.projectId);
    if (!AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Проект не найден' });
    }
    result.status(201).json({ message: 'Проект удален' });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
});

ROUTER.post('/', async (request, result) => {
  try {
    const JWT = request.body.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const NEW_PROJECT_ITEM = new PROJECT({
      name: request.body.name,
      rooms: [],
      authorId: ACCOUNT_ID
    })
    await NEW_PROJECT_ITEM.save()
    result.status(201).json({ projectData: NEW_PROJECT_ITEM });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
});

ROUTER.get('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const PROJECT_ITEM = await PROJECT.findById(request.query.projectId)
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Аккаунт не найден' });
    result.status(201).json({ projectData: PROJECT_ITEM });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
})

ROUTER.get('/room', async (request, result) => {
  try {
    const { jwt: JWT, roomId: ROOM_ID } = request.query
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const OBJECT_ROOM_ID = new ObjectId(ROOM_ID);
    const ROOM_ITEMS = await PROJECT.aggregate([
      { $match: { "rooms._id": OBJECT_ROOM_ID } },
      {
        $project: {
          room: {
            $filter: {
              input: "$rooms",
              as: "room",
              cond: { $eq: ["$$room._id", OBJECT_ROOM_ID] }
            }
          }
        }
      }
    ])
    if (ROOM_ITEMS.length == 0) return result.status(404).json({ message: 'Комната не найдена' });
    const ROOM_ITEM = ROOM_ITEMS[0].room[0]

    let REPORT_OBJECT = {
      name: ROOM_ITEM.name,
      proportions: ROOM_ITEM.roomProportions
    }


    const OBJECTS_PROMISES = ROOM_ITEM.objects.map(async (objectData) => {
      return await proccessFunriture(objectData.objectId);
    });
    const PROCESSED_FURNITURES = (await Promise.all(OBJECTS_PROMISES)).filter(x => x != undefined)

    REPORT_OBJECT.furnitures = PROCESSED_FURNITURES

    result.status(201).json(REPORT_OBJECT);
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
})

async function proccessFunriture(funritureId) {
  const FURNITURE_ITEM = await FURNITURE_CARD.findById(funritureId)
  if (!FURNITURE_ITEM) return undefined

  let result = {
    name: FURNITURE_ITEM.name,
    proportions: FURNITURE_ITEM.proportions,
    furnitureId: FURNITURE_ITEM._id,
    category: FURNITURE_ITEM.additionalData.category || 'all'
  }
  result.shops = FURNITURE_ITEM.shops.sort((a, b) => a - b).slice(0, 5)

  const FIRST_COLOR = FURNITURE_ITEM.colors[0].color
  const MAIN_FURNITURE_IMAGE_URL = `furniture/images/main?furnitureCardId=${funritureId}&color=${FIRST_COLOR}`
  result.previewUrl = MAIN_FURNITURE_IMAGE_URL

  return result
}

ROUTER.put('/', async (request, result) => {
  try {
    const JWT = request.body.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const PROJECT_ITEM = await PROJECT.findOne({ authorId: ACCOUNT_ID })
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Проект не найден' });
    PROJECT_ITEM.name = request.body.name
    PROJECT_ITEM.rooms = JSON.parse(request.body.rooms)
    await PROJECT_ITEM.save()
    result.status(201).json({ message: 'Проект удален' });
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
})

module.exports = ROUTER;
