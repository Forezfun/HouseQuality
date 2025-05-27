const EXPRESS = require('express');
const { ObjectId } = require('mongodb');
const ROUTER = EXPRESS.Router();
const PROJECT = require('../models/project.js');
const { checkUserAccess } = require('../helpers/jwtHandlers');
const FURNITURE_CARD = require('../models/furnitureCard.js');
const proccessColor = require('../helpers/colorHandler');

/**
 * @module project
 * @description Маршруты для работы с проектами пользователей.
 */
/**
 * @function DELETE /project
 * @instance
 * @summary Удаление проекта
 * @param {string} jwt - JWT токен
 * @param {string} projectId - ID проекта для удаления
 * @returns {object} JSON с сообщением о результате операции
 *
 * @example response - 201 - Успех
 * {
 *   "message": "Проект удален"
 * }
 * @example response - 404 - Проект не найден
 * {
 *   "message": "Проект не найден"
 * }
 * @example response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
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
    result.status(500).json({ message: error.message });
  }
});
/**
 * @function POST /project
 * @instance
 * @summary Создание нового проекта
 * @param {string} jwt - JWT токен
 * @param {module:project.Project} body - Объект с данными проекта
 * @returns {object} JSON объект с данными проекта
 * @see При успешном запросе возвращает { projectData: {@link module:project.Project | Project} }
 * @see При неуспешном запросе возвращает { message: string }
 *
 * @example response - 201 - Успех
 * {
 *   "projectData": {
 *     "_id": "664a328ab1a2b5d52a458f2f",
 *     "name": "Проект кухни",
 *     "rooms": [],
 *     "authorId": "6641e6b9ce33a302f92f7c11"
 *   }
 * }
 * @example response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
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
    result.status(500).json({ message: error.message });
  }
});
/**
 * @function GET /project
 * @instance
 * @summary Получение данных проекта
 * @param {string} jwt - JWT токен
 * @param {string} projectId - ID проекта
 * @returns {object} JSON объект с данными проекта
 * @see При успешном запросе возвращает { projectData: {@link module:project.Project | Project} }
 * @see При неуспешном запросе возвращает { message: string }
 *
 * @example response - 201 - Успех
 * {
 *   "projectData": {
 *     "_id": "664a328ab1a2b5d52a458f2f",
 *     "name": "Проект кухни",
 *     "rooms": [],
 *     "authorId": "6641e6b9ce33a302f92f7c11"
 *   }
 * }
 * @example response - 404 - Проект не найден
 * {
 *   "message": "Проект не найден"
 * }
 * @example response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.get('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const PROJECT_ITEM = await PROJECT.findById(request.query.projectId)
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Аккаунт не найден' });
    result.status(201).json({ projectData: PROJECT_ITEM });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
})
/**
 * @function GET /project/room
 * @instance
 * @summary Получение данных комнаты по ID
 * @param {string} jwt - JWT токен
 * @param {string} roomId - ID комнаты
 * @returns {object} JSON объект с данными комнаты проекта
 *
 * @example response - 201 - Успех
 * {
 *   "roomData": {
 *     "_id": "664a42a9d1f04561fce4e998",
 *     "name": "Гостиная",
 *     "objects": [
 *       {
 *         "objectId": "6634f1129f6f7cba29cd12f9",
 *         "position": { "x": 1, "y": 1, "z": 1 },
 *         "rotation": { "x": 0, "y": 180, "z": 0 }
 *       }
 *     ]
 *   }
 * }
 * @example response - 404 - Комната не найдена
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
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
    result.status(500).json({ message: error.message });
  }
})

async function proccessFunriture(funritureId) {
  const FURNITURE_ITEM = await FURNITURE_CARD.findById(funritureId)
  if (!FURNITURE_ITEM) return undefined

  let result = {
    name: FURNITURE_ITEM.name,
    proportions: FURNITURE_ITEM.proportions,
    furnitureCardId: FURNITURE_ITEM._id,
    category: (FURNITURE_ITEM.additionalData || {}).category || 'all'
  }
  result.shops = FURNITURE_ITEM.shops.sort((a, b) => a - b).slice(0, 5)

  const FIRST_COLOR = FURNITURE_ITEM.colors[0]==='#'?'%23'+FURNITURE_ITEM.colors[0].color.slice(1):FURNITURE_ITEM.colors[0]
  
  const MAIN_FURNITURE_IMAGE_URL = `furniture/images/main?furnitureCardId=${funritureId}&color=${proccessColor(FIRST_COLOR.color)}`
  result.previewUrl = MAIN_FURNITURE_IMAGE_URL

  return result
}
/**
 * @function PUT /project
 * @instance
 * @summary Обновление проекта пользователя
 * @param {string} jwt - JWT токен
 * @param {module:project.Project} body - Объект с данными проекта
 * 
 * @example response - 201 - Успех
 * {
 *   "message": "Проект обновлен"
 * }
 * 
 * @example response - 404 - Проект или аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"|"Проект не найден"
 * }
 * 
 * @example response - 500 - Ошибка сервера
 * {
 *   "message": "Ошибка"
 * }
 */
ROUTER.put('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const PROJECT_ID = request.query.projectId
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    const PROJECT_ITEM = await PROJECT.findById(PROJECT_ID)
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Проект не найден' });
    PROJECT_ITEM.name = request.body.name
    PROJECT_ITEM.rooms = request.body.rooms
    await PROJECT_ITEM.save()
    result.status(201).json({ message: 'Проект обновлен' });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
})

module.exports = ROUTER;
