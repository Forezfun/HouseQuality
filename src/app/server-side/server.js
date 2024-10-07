const EXPRESS = require('express');
const BODYPARSER = require('body-parser');
const CORS = require('cors');
const CONNECT_DB = require('./config/db');
const USERS_ROUTES = require('./routes/userRoutes');
const AUTH_ROUTES = require('./routes/authRoutes');
const PROJECT_ROUTES = require('./routes/projectRoutes');
const IMAGE_AVATAR_ROUTES = require('./routes/imageAvatarRoutes')
const IMAGE_FURNITURE_ROUTES = require('./routes/imagesFurnitureRoutes')
const FURNITURE_CARD_ROUTES = require('./routes/furnitureCardRoutes')
const FURNITURE_MODEL_ROUTES = require('./routes/furnitureModelRoutes')

const APP_PORT = 5000;
const USER_ROUTE = '/user';
const PROJECT_ROUTE = '/projects';
const AUTH_ROUTE = '/auth'
const IMAGE_AVATAR_ROUTE = '/avatar'
const IMAGE_FURNITURE_ROUTE = '/furniture/images'
const FURNITURE_CARD_ROUTE = '/furniture/card'
const FURNITURE_MODEL_ROUTE = '/furniture/model'

const APP = EXPRESS();
// Подключение к базе данных
CONNECT_DB(); 

// Мидлвары
APP.use(CORS());
APP.use(BODYPARSER.json());
APP.use(BODYPARSER.urlencoded({ extended: true }));

// Маршруты
APP.use(PROJECT_ROUTE, PROJECT_ROUTES);
APP.use(USER_ROUTE, USERS_ROUTES);
APP.use(AUTH_ROUTE, AUTH_ROUTES);
APP.use(IMAGE_AVATAR_ROUTE, IMAGE_AVATAR_ROUTES);
APP.use(IMAGE_FURNITURE_ROUTE, IMAGE_FURNITURE_ROUTES);
APP.use(FURNITURE_MODEL_ROUTE, FURNITURE_MODEL_ROUTES);
APP.use(FURNITURE_CARD_ROUTE, FURNITURE_CARD_ROUTES);

// Запуск сервера
APP.listen(APP_PORT, () => {
  console.log(`Server running on port ${APP_PORT}`);
});
APP.get('/error', (req, res) => {
  throw new Error('This is a forced error.');
});

// Middleware для обработки ошибок
APP.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

