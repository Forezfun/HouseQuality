const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const { checkUserAccess } = require('../helpers/jwtHandlers');
const dbModule = require('../server');

ROUTER.delete('/jwt/delete', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.params.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });

    const AUTH_USER_ITEM = await db.collection('authusers').findOne({ userId: USER_ID });
    if (!AUTH_USER_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    
    AUTH_USER_ITEM.jwtTokens = AUTH_USER_ITEM.jwtTokens.filter(jwtToken => jwtToken !== JWT_TOKEN);
    await db.collection('authusers').updateOne({ userId: USER_ID }, { $set: { jwtTokens: AUTH_USER_ITEM.jwtTokens } });
    
    result.status(201).json({ message: 'JWT deleted' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.post('/user/create', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    let USER_ITEM = await db.collection('authusers').findOne({
      $or: [
        { 'emailData.email': request.body.email },
        { 'googleData.email': request.body.email }
      ]
    });
    
    if (USER_ITEM) return result.status(409).json({ message: 'User already exists' });
    
    const newUser = {
      nickname: request.body.nickname,
      jwtTokens: []
    };
    const userInsertResult = await db.collection('users').insertOne(newUser);
    const userId = userInsertResult.insertedId;
    
    const newAuthUser = {
      userId,
      emailData: {},
      googleData: {}
    };
    
    if (request.body.userType === 'email') {
      newAuthUser.emailData = {
        email: request.body.email,
        password: request.body.password
      };
    }
    
    if (request.body.userType === 'google') {
      newAuthUser.googleData = {
        email: request.body.email,
        googleId: request.body.googleId
      };
    }
    
    await db.collection('authusers').insertOne(newAuthUser);
    result.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.get('/user/get', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.query.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const USER_ITEM = await db.collection('users').findOne({ _id: USER_ID });
    const AUTH_USER_ITEM = await db.collection('authusers').findOne({ userId: USER_ID });
    if (!USER_ITEM || !AUTH_USER_ITEM) {
      return result.status(404).json({ message: 'User not found' });
    }
    
    let RESULT_DATA_ITEM = {
      email: AUTH_USER_ITEM.emailData.email,
      nickname: USER_ITEM.nickname
    };
    
    if (AUTH_USER_ITEM.emailData.password) {
      RESULT_DATA_ITEM.password = AUTH_USER_ITEM.emailData.password;
    }
    
    RESULT_DATA_ITEM.projects = await db.collection('projects').find({ authorId: USER_ID }).toArray();
    RESULT_DATA_ITEM.furnitureCards = await db.collection('furniturecards').find({ authorId: USER_ID }).toArray();
    
    result.status(201).json({ userData: RESULT_DATA_ITEM });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.delete('/user/delete', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.params.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    
    const deleteResult = await db.collection('users').deleteOne({ _id: USER_ID });
    await db.collection('authusers').deleteOne({ userId: USER_ID });
    
    if (deleteResult.deletedCount === 0) {
      return result.status(404).json({ message: 'User not found' });
    }
    
    result.status(201).json({ message: 'User deleted successfully' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.put('/user/put', async (request, result) => {
  try {
    const db = await dbModule.getDb();
    const JWT_TOKEN = request.body.jwtToken;
    const USER_ID = await checkUserAccess(JWT_TOKEN);
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    
    const updateResult = await db.collection('users').updateOne(
      { _id: USER_ID },
      { $set: { nickname: request.body.nickname } }
    );
    
    if (updateResult.matchedCount === 0) {
      return result.status(404).json({ message: 'User not found' });
    }
    
    result.status(201).json({ message: 'User successfully updated' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

module.exports = ROUTER;
