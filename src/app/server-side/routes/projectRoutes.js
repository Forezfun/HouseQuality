const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const PROJECT = require('../models/project.js');
const { checkUserAccess } = require('../helpers/jwtHandlers');

ROUTER.delete('/', async (request, result) => {
  try {
    console.log(request)
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const AUTH_ACCOUNT_ITEM = await PROJECT.findByIdAndDelete(request.query.projectId);
    if (!AUTH_ACCOUNT_ITEM) {
      return result.status(404).json({ message: 'Project not found' });
    }
    result.status(201).json({ message: 'Project deleted' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.post('/', async (request, result) => {
  try {
    console.log(request.body)
    const JWT = request.body.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    console.log(ACCOUNT_ID)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const NEW_PROJECT_ITEM = new PROJECT({
      name: request.body.name,
      rooms: [],
      authorId: ACCOUNT_ID
    })
    await NEW_PROJECT_ITEM.save()
    result.status(201).json({ projectData: NEW_PROJECT_ITEM});
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
});

ROUTER.get('/', async (request, result) => {
  try {
    const JWT = request.query.jwt
    const ACCOUNT_ID = await checkUserAccess(JWT)
    console.log(ACCOUNT_ID)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
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
    const JWT = request.body.jwt
    console.log('before account id')
    const ACCOUNT_ID = await checkUserAccess(JWT)
    console.log('after account id: ', ACCOUNT_ID)
    if (!ACCOUNT_ID) return result.status(404).json({ message: 'User not found' });
    const PROJECT_ITEM = await PROJECT.findOne({ authorId: ACCOUNT_ID })
    if (!PROJECT_ITEM) return result.status(404).json({ message: 'Project not found' });
    PROJECT_ITEM.name = request.body.name
    PROJECT_ITEM.rooms = JSON.parse(request.body.rooms)
    await PROJECT_ITEM.save()
    result.status(201).json({ message: 'Project successfully updated' });
  } catch (err) {
    result.status(400).json({ message: err.message });
  }
})

module.exports = ROUTER;
