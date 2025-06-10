const EXPRESS = require('express');
const BODYPARSER = require('body-parser');
const CORS = require('cors');
const CONNECT_DB = require('./src/config/db');
const ACCOUNTS_ROUTES = require('./src/routes/accountRoutes');
const AUTH_ROUTES = require('./src/routes/authRoutes');
const PROJECT_ROUTES = require('./src/routes/projectRoutes');
const IMAGE_AVATAR_ROUTES = require('./src/routes/imageAvatarRoutes')
const IMAGE_FURNITURE_ROUTES = require('./src/routes/imagesFurnitureRoutes')
const FURNITURE_CARD_ROUTES = require('./src/routes/furnitureCardRoutes')
const FURNITURE_MODEL_ROUTES = require('./src/routes/furnitureModelRoutes')
const SHOP_ROUTES = require('./src/routes/shopRoutes')
const FINDER_ROUTES = require('./src/routes/findRoutes')
const CATEGORY_ROUTES = require('./src/routes/categoryRoutes')

const APP_PORT = 5000;
const ACCOUNT_ROUTE = '/account';
const PROJECT_ROUTE = '/project';
const AUTH_ROUTE = '/auth'
const IMAGE_AVATAR_ROUTE = '/account/avatar'
const IMAGE_FURNITURE_ROUTE = '/furniture/images'
const FURNITURE_CARD_ROUTE = '/furniture/card'
const FURNITURE_MODEL_ROUTE = '/furniture/model'
const SHOP_ROUTE = '/shop'
const FINDER_ROUTE = '/find'
const CATEGORY_ROUTE = '/category'

const APP = EXPRESS();

CONNECT_DB();

const CORS_OPTIONS = {
  origin: 'https://housequality.site',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
};

APP.use((req, res, next) => {
  if (req.path.startsWith('/assets/')) {
    next();
  } else {
    CORS(CORS_OPTIONS)(req, res, next);
  }
});
APP.use(BODYPARSER.json());
APP.use(BODYPARSER.urlencoded({ extended: true }));

APP.use(PROJECT_ROUTE, PROJECT_ROUTES);
APP.use(ACCOUNT_ROUTE, ACCOUNTS_ROUTES);
APP.use(AUTH_ROUTE, AUTH_ROUTES);
APP.use(IMAGE_AVATAR_ROUTE, IMAGE_AVATAR_ROUTES);
APP.use(IMAGE_FURNITURE_ROUTE, IMAGE_FURNITURE_ROUTES);
APP.use(FURNITURE_MODEL_ROUTE, FURNITURE_MODEL_ROUTES);
APP.use(FURNITURE_CARD_ROUTE, FURNITURE_CARD_ROUTES);
APP.use(SHOP_ROUTE, SHOP_ROUTES);
APP.use(CATEGORY_ROUTE, CATEGORY_ROUTES);
APP.use(FINDER_ROUTE, FINDER_ROUTES);


APP.listen(APP_PORT, 'localhost', () => {
  console.log(`Server running on port ${APP_PORT}`);
});
APP.get('/error', (request, result) => {
  throw new Error('This is a forced error.');
});
APP.use((error, request, result, next) => {
  console.error(error.stack);
  result.status(500).send('Something broke!');
});