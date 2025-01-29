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

const MONGO_URI = util.format(
  'mongodb://%s:%s@%s/%s?replicaSet=%s&tls=true&tlsCAFile=%s',
  DB_USER,
  DB_PASS,
  DB_HOSTS.join(','),
  DB_NAME,
  DB_RS,
  CACERT
);

// Глобальная переменная для подключения
let dbClient;

async function connectToMongo() {
  try {
    dbClient = new MongoClient(MONGO_URI);
    await dbClient.connect();
    console.log('✅ Подключено к MongoDB');

    const db = dbClient.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    console.log('📂 Коллекции в базе:', collections.map(col => col.name));

    return db;
  } catch (err) {
    console.error('❌ Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  }
}

// Запуск сервера
async function startServer() {
  const db = await connectToMongo();
  const app = express();

  // Мидлвары
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Передача объекта БД в роуты (лучше передавать в нужные)
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Подключение маршрутов
  app.use('/projects', require('./routes/projectRoutes')(db));
  app.use('/user', require('./routes/userRoutes')(db));
  app.use('/auth', require('./routes/authRoutes')(db));
  app.use('/avatar', require('./routes/imageAvatarRoutes')(db));
  app.use('/furniture/images', require('./routes/imagesFurnitureRoutes')(db));
  app.use('/furniture/card', require('./routes/furnitureCardRoutes')(db));
  app.use('/furniture/model', require('./routes/furnitureModelRoutes')(db));
  app.use('/shop', require('./routes/shopRoutes')(db));
  app.use('/finder', require('./routes/finderRoutes')(db));

  // Обработка ошибок
  app.use((err, req, res, next) => {
    console.error('❌ Ошибка сервера:', err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
  });

  // Запуск сервера
  const APP_PORT = 5000;
  app.listen(APP_PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${APP_PORT}`);
  });

  // Закрытие соединения при завершении процесса
  process.on('SIGINT', async () => {
    console.log('\n🛑 Завершение работы сервера...');
    if (dbClient) {
      await dbClient.close();
      console.log('✅ Соединение с MongoDB закрыто');
    }
    process.exit(0);
  });
}

// Запуск приложения
startServer();
