const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const PROJECT = require('../models/project.js');
const { isTokenNoneExpired, checkUserAccess } = require('../helpers/jwtHandlers');
ROUTER.delete('/', async (request, result) => {
  try {
    console.log(request)
    const JWT_TOKEN = request.query.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const AUTH_USER_ITEM = await PROJECT.findByIdAndDelete(request.query.projectId);
    if (!AUTH_USER_ITEM) {
      return result.status(404).json({ message: 'Project not found' });
    }
    result.status(201).json({ message: 'Project deleted' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});
ROUTER.post('/', async (request, result) => {
  try {
    const JWT_TOKEN = request.body.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    console.log(USER_ID)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const NEW_PROJECT_ITEM = new PROJECT({
      name: request.body.nameProject,
      rooms: [],
      authorId: USER_ID
    })
    await NEW_PROJECT_ITEM.save()
    result.status(201).json({ projectData: NEW_PROJECT_ITEM});
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});
ROUTER.get('/', async (request, result) => {
  try {
    const JWT_TOKEN = request.query.jwtToken
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    console.log(USER_ID)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const PROJECT_ITEM = await PROJECT.findById(request.query.projectId)
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Project not found' });
    result.status(201).json({ projectData: PROJECT_ITEM });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})
ROUTER.put('/', async (request, result) => {
  try {
    console.log(request.body)
    const JWT_TOKEN = request.body.jwtToken
    console.log('before user id')
    const USER_ID = await checkUserAccess(JWT_TOKEN)
    console.log('after user id: ', USER_ID)
    if (!USER_ID) return result.status(404).json({ message: 'User not found' });
    const PROJECT_ITEM = await PROJECT.findOne({ authorId: USER_ID })
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Project not found' });
    PROJECT_ITEM.name = request.body.nameProject
    PROJECT_ITEM.rooms = JSON.parse(request.body.rooms)
    await PROJECT_ITEM.save()
    result.status(201).json({ message: 'Project successfully updated' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})


module.exports = ROUTER;
