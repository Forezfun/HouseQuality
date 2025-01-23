const util = require('util');
const MongoClient = require('mongodb').MongoClient;
const EXPRESS = require('express');
const BODYPARSER = require('body-parser');
const CORS = require('cors');
const USERS_ROUTES = require('./routes/userRoutes');
const AUTH_ROUTES = require('./routes/authRoutes');
const PROJECT_ROUTES = require('./routes/projectRoutes');
const IMAGE_AVATAR_ROUTES = require('./routes/imageAvatarRoutes');
const IMAGE_FURNITURE_ROUTES = require('./routes/imagesFurnitureRoutes');
const FURNITURE_CARD_ROUTES = require('./routes/furnitureCardRoutes');
const FURNITURE_MODEL_ROUTES = require('./routes/furnitureModelRoutes');
const SHOP_ROUTES = require('./routes/shopRoutes');
const FINDER_ROUTES = require('./routes/finderRoutes');

// Конфигурация MongoDB
const DB_RS = 'rs01';
const DB_NAME = 'db1';
const DB_HOSTS = ['rc1a-joef29r9lsoq5sqd.mdb.yandexcloud.net:27018'];
const DB_USER = 'forezfun';
const DB_PASS = '4691forezfun';
const CACERT = '/home/kruk-german27/HouseQuality/src/app/server-side/root.crt';

const url = util.format(
  'mongodb://%s:%s@%s/%s?replicaSet=%s',
  encodeURIComponent(DB_USER), // Для корректного использования в URL
  encodeURIComponent(DB_PASS),
  DB_HOSTS.join(','),
  DB_NAME,
  DB_RS
);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsCAFile: CACERT,
  replicaSet: DB_RS,
};

// Функция для подключения к базе данных
async function connectToDB() {
  try {
    const client = await MongoClient.connect(url, options);
    console.log('Connected to MongoDB');
    return client;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    throw err;
  }
}

// Настройка и запуск сервера Express
async function startServer() {
  try {
    // Подключаемся к базе данных
    const dbClient = await connectToDB();
    const db = dbClient.db(DB_NAME);

    // Создаем Express приложение
    const APP = EXPRESS();

    // Мидлвары
    APP.use(CORS());
    APP.use(BODYPARSER.json());
    APP.use(BODYPARSER.urlencoded({ extended: true }));

    // Передаем объект базы данных в маршруты
    APP.use((req, res, next) => {
      req.db = db;
      next();
    });

    // Маршруты
    APP.use('/projects', PROJECT_ROUTES);
    APP.use('/user', USERS_ROUTES);
    APP.use('/auth', AUTH_ROUTES);
    APP.use('/avatar', IMAGE_AVATAR_ROUTES);
    APP.use('/furniture/images', IMAGE_FURNITURE_ROUTES);
    APP.use('/furniture/card', FURNITURE_CARD_ROUTES);
    APP.use('/furniture/model', FURNITURE_MODEL_ROUTES);
    APP.use('/shop', SHOP_ROUTES);
    APP.use('/finder', FINDER_ROUTES);

    // Обработка ошибок
    APP.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Internal Server Error' });
    });

    // Запуск сервера
    const APP_PORT = 5000;
    APP.listen(APP_PORT, () => {
      console.log(`Server running on port ${APP_PORT}`);
    });
  } catch (err) {
    console.error('Error starting the server:', err.message);
    process.exit(1); // Завершаем процесс при критической ошибке
  }
}

// Запуск приложения
startServer();
