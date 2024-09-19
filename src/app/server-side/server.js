const EXPRESS = require('express');
const BODYPARSER = require('body-parser');
const CORS = require('cors');
const CONNECT_DB = require('./config/db');
const USERS_ROUTES = require('./routes/userRoutes');
const AUTH_ROUTES = require('./routes/authRoutes');
const PROJECT_ROUTES = require('./routes/projectRoutes');
const IMAGE_ROUTES = require('./routes/imageRoutes')

const APP_PORT = 5000;
const USER_ROUTE = '/user';
const PROJECT_ROUTE = '/projects';
const AUTH_ROUTE = '/auth'
const IMAGE_ROUTE = '/images'

const APP = EXPRESS();
APP.use(BODYPARSER.json({ limit: '50mb' }));
APP.use(BODYPARSER.urlencoded({ limit: '50mb', extended: true }));
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
APP.use(IMAGE_ROUTE, IMAGE_ROUTES);

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
