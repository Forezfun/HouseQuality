const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const ACCOUNT = require('../models/account');
const AUTH_ACCOUNT = require('../models/authAccount');
const PROJECT = require('../models/project');
const FURNITURE_CARD = require('../models/furnitureCard');
const { checkUserAccess } = require('../helpers/jwtHandlers');
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const { encryptPassword, decryptPassword } = require('../helpers/passwordHandlers');

/**
 * @module account
 */

/**
 * @function DELETE /account/jwt/delete
 * @instance
 * @summary Удаление JWT токена пользователя
 * @param {string} jwt - JWT токен для удаления
 * @example
 * response - 201 - Успешно
 * {
 *   "message": "JWT deleted"
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.delete('/jwt/delete', async (request, result) => {
  try {
    const JWT = request.query.jwt;
    const ACCOUNT_ID = await checkUserAccess(JWT);
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });
    console.log(ACCOUNT_ID)
    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    ACCOUNT_ITEM.jwts = ACCOUNT_ITEM.jwts.filter(jwt => jwt !== JWT);
    await ACCOUNT_ITEM.save();
    result.status(201).json({ message: 'JWT deleted' });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

/**
 * @typedef {Object} createAccountEmailData
 * @description Данные для создания google-пользователя
 * @memberof module:account
 * @property {string} email - Email пользователя.
 * @property {string} password - Пароль.
 * @property {'email'} accountType - Тип пользователя.
 */
/**
 * @typedef {Object} createAccountGoogleData
 * @description Данные для создания email-пользователя
 * @memberof module:account
 * @property {string} email - Email, связанный с Google аккаунтом.
 * @property {string} googleId - Уникальный идентификатор Google пользователя.
 * @property {'google'} accountType - Тип пользователя.
 */

/**
 * @function POST /account/
 * @instance
 * @summary Создание нового аккаунта
 * @param {module:account.createAccountGoogleData |module:account.createAccountEmailData} - body запроса, в зависимости от типа пользователя.
 * @example
 * response - 201 - Пользователь создан
 * {
 *   "message": "Пользователь создан"
 * }
 * @example
 * response - 409 - Аккаунт уже существует
 * {
 *   "message": "Аккаунт уже существует"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
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
    });

    let AUTH_ACCOUNT_ITEM = new AUTH_ACCOUNT({
      accountId: ACCOUNT_ITEM._id,
      emailData: {},
      googleData: {}
    });

    if (request.body.accountType === 'email') {
      AUTH_ACCOUNT_ITEM.emailData = {
        email: request.body.email,
        password: encryptPassword(request.body.password)
      };
    }

    if (request.body.accountType === 'google') {
      AUTH_ACCOUNT_ITEM.googleData = {
        email: request.body.email,
        googleId: request.body.googleId
      };
    }

    await ACCOUNT_ITEM.save();
    await AUTH_ACCOUNT_ITEM.save();
    result.status(201).json({ message: 'Пользователь создан' });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

/**
 * @function GET /account/
 * @instance
 * @summary Получение данных аккаунта по JWT
 * @param {string} jwt - JWT токен
 * @example
 * response - 201 - Данные аккаунта
 * {
 *   "accountData": {
 *     "email": "user@example.com",
 *     "nickname": "Account",
 *     "password": "123456",
 *     "projects": [...], //TODO Доделать 
 *     "furnitures": [...] //TODO Доделать
 *   }
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.get('/', async (request, result) => {
  try {
    const JWT = request.query.jwt;
    const ACCOUNT_ID = await checkUserAccess(JWT);
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });

    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });

    if (!ACCOUNT_ITEM || !AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }

    let RESULT_DATA_ITEM = {
      email: AUTH_ACCOUNT_ITEM.emailData.email,
      nickname: ACCOUNT_ITEM.nickname
    };

    if (AUTH_ACCOUNT_ITEM.emailData.password !== undefined) {
      RESULT_DATA_ITEM.password = decryptPassword(AUTH_ACCOUNT_ITEM.emailData.password);
    }

    const ACCOUNT_PROJECTS = await PROJECT.find({ authorId: ACCOUNT_ID });

    RESULT_DATA_ITEM.projects = ACCOUNT_PROJECTS;
    RESULT_DATA_ITEM.furnitures = await proccessFurnitures(ACCOUNT_ID);

    result.status(201).json({ accountData: RESULT_DATA_ITEM });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

async function proccessFurnitures(ACCOUNT_ID) {
  let furnitures = [];
  try {
    const ACCOUNT_FURNITURE_CARDS = await FURNITURE_CARD.find({ authorId: ACCOUNT_ID });
    for (const FURNITURE_DATA of ACCOUNT_FURNITURE_CARDS) {
      const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({ furnitureCardId: FURNITURE_DATA._id });
      if(!IMAGES_FURNITURE_ITEM)continue
      furnitures.push({
        _id: FURNITURE_DATA._id,
        name: FURNITURE_DATA.name,
        previewUrl: `furniture/images/simple?furnitureCardId=${FURNITURE_DATA._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${IMAGES_FURNITURE_ITEM.idMainImage || 0}`
      });
      console.log(furnitures)
      return furnitures;
    }
  } catch (error) {
    return error;
  }
}

/**
 * @function DELETE /account/
 * @instance
 * @summary Удаление аккаунта по JWT
 * @param {string} jwt - JWT токен
 * @example
 * response - 201 - Аккаунт успешно удален
 * {
 *   "message": "Аккаунт успешно удален"
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.delete('/', async (request, result) => {
  try {
    const JWT = request.query.jwt;
    const ACCOUNT_ID = await checkUserAccess(JWT);
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });

    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });

    if (!ACCOUNT_ITEM || !AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }

    await AUTH_ACCOUNT_ITEM.remove();
    await ACCOUNT_ITEM.remove();

    result.status(201).json({ message: 'Аккаунт успешно удален' });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

/**
 * @function PUT /account/
 * @instance
 * @summary Обновление никнейма аккаунта по JWT
 * @param {string} jwt - JWT токен
 * @param {string} nickname - Новый никнейм
 * @example
 * response - 201 - Аккаунт обновлен
 * {
 *   "message": "Аккаунт обновлен"
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": error
 * }
 */
ROUTER.put('/', async (request, result) => {
  try {
    const JWT = request.query.jwt;
    const ACCOUNT_ID = await checkUserAccess(JWT);
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });

    const ACCOUNT_ITEM = await ACCOUNT.findById(ACCOUNT_ID);
    if (!ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Аккаунт не найден' });
    }

    ACCOUNT_ITEM.nickname = request.query.nickname;
    await ACCOUNT_ITEM.save();

    result.status(201).json({ message: 'Аккаунт обновлен' });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

module.exports = ROUTER;
