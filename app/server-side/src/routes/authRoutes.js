require('dotenv').config();
const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const ACCOUNT = require('../models/account');
const cryptoKey = process.env.CRYPTO_KEY;
const sendEmail = require('../helpers/sendcode');
const AUTH_ACCOUNT = require('../models/authAccount');
const jwtService = require('jsonwebtoken');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');
const { encryptPassword, decryptPassword } = require('../helpers/passwordHandlers');

const ACCOUNT_TYPES = ['google', 'email'];

/**
 * @function POST /auth/jwt/long
 * @instance
 * @memberof module:account
 * @summary Генерация долгоживущего JWT токена (1 неделя)
 * @param {module:account.GoogleData | module:account.EmailData} - body запроса, в зависимости от типа пользователя.
 * @example
 * response - 201 - JWT токен создан
 * {
 *   "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 * }
 * @example
 * response - 400 - Неправильный тип аккаунта или ошибка
 * {
 *   "message": "Неправильный тип аккаунта"
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 409 - Неправильный пароль или GoogleId
 * {
 *   "message": "Неправильный пароль"
 * }
 */

ROUTER.post('/jwt/long', async (request, result) => {
  try {
    if (!ACCOUNT_TYPES.includes(request.body.accountType)) {
      return result.status(400).json({ message: 'Неправильный тип аккаунта' });
    }
    let AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({
      $or: [
        { 'emailData.email': request.body.email },
        { 'googleData.email': request.body.email }
      ]
    });
    if (!AUTH_ACCOUNT_ITEM) return result.status(404).json({ message: 'Аккаунт не найден' });

    if (request.body.accountType === 'email' &&
      decryptPassword(AUTH_ACCOUNT_ITEM.emailData.password) !== request.body.password) {
      return result.status(409).json({ message: 'Неправильный пароль' });
    }

    if (request.body.accountType === 'google' &&
      AUTH_ACCOUNT_ITEM.googleData.googleId !== request.body.googleId) {
      return result.status(409).json({ message: 'Неправильный GoogleId' });
    }

    const ACCOUNT_ITEM = await ACCOUNT.findById(AUTH_ACCOUNT_ITEM.accountId);
    if (!ACCOUNT_ITEM) return result.status(404).json({ message: 'Аккаунт не найден' });

    ACCOUNT_ITEM.jwts = ACCOUNT_ITEM.jwts.filter(jwt => isTokenNoneExpired(jwt));

    const PAYLOAD = { accountId: AUTH_ACCOUNT_ITEM.accountId };
    const OPTIONS = { expiresIn: '1w' };
    const JWT = jwtService.sign(PAYLOAD, cryptoKey, OPTIONS);
    ACCOUNT_ITEM.jwts.push(JWT);

    await ACCOUNT_ITEM.save();
    result.status(201).json({ jwt: JWT });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

/**
 * @function POST /auth/jwt/temporary
 * @instance
 * @memberof module:account
 * @summary Генерация временного JWT токена (10 минут)
 * @param {string} email - Email пользователя
 * @example
 * response - 201 - JWT токен создан
 * {
 *   "jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": "Ошибка обработки запроса"
 * }
 */

ROUTER.post('/jwt/temporary', async (request, result) => {
  try {
    const AUTH_ACCOUNT_ITEM = await AUTH_ACCOUNT.findOne({
      $or: [
        { 'emailData.email': request.query.email },
        { 'googleData.email': request.query.email }
      ]
    });
    if (!AUTH_ACCOUNT_ITEM) return result.status(404).json({ message: 'Аккаунт не найден' });

    const PAYLOAD = { accountId: AUTH_ACCOUNT_ITEM.accountId };
    const OPTIONS = { expiresIn: '10min' };
    const JWT = jwtService.sign(PAYLOAD, cryptoKey, OPTIONS);

    const ACCOUNT_ITEM = await ACCOUNT.findById(AUTH_ACCOUNT_ITEM.accountId);
    if (!ACCOUNT_ITEM) return result.status(404).json({ message: 'Аккаунт не найден' });

    ACCOUNT_ITEM.jwts.push(JWT);
    await ACCOUNT_ITEM.save();

    result.status(201).json({ jwt: JWT });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

/**
 * @function PUT /auth/account
 * @memberof module:account
 * @summary Обновление пароля аккаунта по JWT
 * Пока допускаетя изменение только пароля для email аккаунта
 * @param {string} jwt - JWT токен
 * @param {'email'|'google'} accountType - Тип пользователя
 * @param {string} password - Новый пароль
 * @example
 * response - 201 - Аккаунт обновлён
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
 *   "message": "Ошибка обработки запроса"
 * }
 */
ROUTER.put('/account', async (request, result) => {
  try {
    const JWT = request.body.jwt;
    const ACCOUNT_ID = await checkUserAccess(JWT);
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'Аккаунт не найден' });

    let authAccountItem = await AUTH_ACCOUNT.findOne({ accountId: ACCOUNT_ID });
    if (!authAccountItem) return result.status(404).json({ message: 'Аккаунт не найден' });

    if (request.body.accountType === 'email') {
      authAccountItem.emailData.password = encryptPassword(request.body.password);
    }
    await authAccountItem.save();

    result.status(201).json({ message: 'Аккаунт обновлен' });
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

/**
 * @function GET /auth/account/code
 * @instance
 * @memberof account
 * @summary Отправка кода подтверждения на email для сброса пароля
 * @param {string} email - Email пользователя
 * @example
 * response - 201 - Код отправлен
 * {
 *   "code": "123456"
 * }
 * @example
 * response - 404 - Аккаунт не найден
 * {
 *   "message": "Аккаунт не найден"
 * }
 * @example
 * response - 500 - Ошибка сервера
 * {
 *   "message": "Ошибка обработки запроса"
 * }
 */

ROUTER.get('/account/code', async (request, result) => {
  try {
    const ACCOUNT_EMAIL = request.query.email;
    const FOUND_ACCOUNT = await AUTH_ACCOUNT.findOne({ 'emailData.email': ACCOUNT_EMAIL });
    if (!FOUND_ACCOUNT) return result.status(404).json({ message: 'Аккаунт не найден' });

    const SENT_CODE_OBJECT = sendEmail(ACCOUNT_EMAIL, 'resetCode');
    result.status(201).json(SENT_CODE_OBJECT);
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});

module.exports = ROUTER;
