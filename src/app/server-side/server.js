const util = require('util');
const { MongoClient } = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Импорт маршрутов
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
const DB_HOSTS = ['rc1a-a125zcod66sllskf.mdb.yandexcloud.net:27018'];
const DB_USER = 'forezfun';
const DB_PASS = '4691forezfun';
const CACERT = '/home/kruk-german27/HouseQuality/src/app/server-side/root.crt';

const url = util.format(
  'mongodb://%s:%s@%s/%s?replicaSet=%s',
  encodeURIComponent(DB_USER), // Кодируем параметры
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

let dbClient = null;

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

// Функция для вывода списка коллекций
async function logCollections(db) {
  try {
    const collections = await db.listCollections().toArray();
    console.log('Collections in the database:', collections.map((col) => col.name));
  } catch (err) {
    console.error('Error fetching collections:', err.message);
  }
}

// Настройка и запуск сервера Express
async function startServer() {
  try {
    // Подключаемся к базе данных
    dbClient = await connectToDB();
    const db = dbClient.db(DB_NAME);

    const collections = ['authusers', 'furniturecards', 'furnituremodels', 'imageavatars','imagesfurniture','projects','users'];
    for (let collectionName of collections) {
      const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
      if (!collectionExists) {
        await db.createCollection(collectionName);
        console.log(`Collection ${collectionName} created`);
      } else {
        console.log(`Collection ${collectionName} already exists`);
      }
    }
    
    // Создаем Express приложение
    const app = express();
    
    // Мидлвары
    app.use(cors());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // Middleware для передачи объекта базы данных
    app.use((req, res, next) => {
      req.db = db;
      next();
    });
    
    // Маршруты
    app.use('/projects', PROJECT_ROUTES);
    app.use('/user', USERS_ROUTES);
    app.use('/auth', AUTH_ROUTES);
    app.use('/avatar', IMAGE_AVATAR_ROUTES);
    app.use('/furniture/images', IMAGE_FURNITURE_ROUTES);
    app.use('/furniture/card', FURNITURE_CARD_ROUTES);
    app.use('/furniture/model', FURNITURE_MODEL_ROUTES);
    app.use('/shop', SHOP_ROUTES);
    app.use('/finder', FINDER_ROUTES);

    // Обработка ошибок
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ message: 'Internal Server Error' });
    });

    // Запуск сервера
    const APP_PORT = 5000;
    app.listen(APP_PORT, () => {
      console.log(`Server running on port ${APP_PORT}`);
    });
    await logCollections(db);
    db.runCommand({ usersInfo: 1 });

    // Обработка завершения процесса
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      if (dbClient) {
        await dbClient.close();
        console.log('MongoDB connection closed');
      }
      process.exit(0);
    });
  } catch (err) {
    console.error('Error starting the server:', err.message);
    process.exit(1);
  }
}

// Запуск приложения
startServer();
