const util = require('util');
const { MongoClient } = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Конфигурация MongoDB
const DB_RS = 'rs01';
const DB_NAME = 'db2';
const DB_HOSTS = ['rc1a-l5fcnpfz3hao9zwr.mdb.yandexcloud.net:27018'];
const DB_USER = 'forezfun';
const DB_PASS = '4691forezfun';
const CACERT = '/home/kruk-german27/HouseQuality/src/app/server-side/root.crt';

const url = util.format(
  'mongodb://%s:%s@%s/',
  DB_USER,
  DB_PASS,
  DB_HOSTS.join(',')
);

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  tlsCAFile: CACERT,
  replicaSet: DB_RS,
};

// Настройка и запуск сервера Express
async function startServer() {
  let dbClient = null;

  try {
    // Подключение к MongoDB
    dbClient = await MongoClient.connect(url, options);
    console.log('Connected to MongoDB');

    const db = dbClient.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log('Connected to database:', db.databaseName);
    console.log('DB collections:', collections);

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
    app.use('/projects', require('./routes/projectRoutes'));
    app.use('/user', require('./routes/userRoutes'));
    app.use('/auth', require('./routes/authRoutes'));
    app.use('/avatar', require('./routes/imageAvatarRoutes'));
    app.use('/furniture/images', require('./routes/imagesFurnitureRoutes'));
    app.use('/furniture/card', require('./routes/furnitureCardRoutes'));
    app.use('/furniture/model', require('./routes/furnitureModelRoutes'));
    app.use('/shop', require('./routes/shopRoutes'));
    app.use('/finder', require('./routes/finderRoutes'));

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
    if (dbClient) {
      await dbClient.close();
    }
    process.exit(1);
  }
}

// Запуск приложения
startServer();
