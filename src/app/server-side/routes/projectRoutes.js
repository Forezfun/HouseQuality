const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const PUBLICATION = require('../models/furnitureCard.js');
const findPublications = require('../findPublications.js')

ROUTER.get('/', async (request, result) => {
  try {
    let PUBLICATIONS
    if(request.query.findWord){
      const ALL_PUBLICATIONS = PUBLICATIONS = await PUBLICATION.find()
      NEEDFUL_PUBLICATIONS_ID_ARRAY = findPublications(request.query.findWord,ALL_PUBLICATIONS)
      PUBLICATIONS = await PUBLICATION.find({ '_id': { $in: NEEDFUL_PUBLICATIONS_ID_ARRAY } });
    }else{
      PUBLICATIONS = await PUBLICATION.find().limit(10);
    }
    result.json(PUBLICATIONS);
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});
ROUTER.get('/:id', async (request, result) => {
  try {
    const publicationId = request.params.id;
    const PUBLICATION_ITEM = await PUBLICATION.findById(publicationId);
    if (!PUBLICATION_ITEM) {
      return result.status(404).json({ message: 'Publication not found' });
    }
    result.json(PUBLICATION_ITEM);
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});
ROUTER.post('/', async (request, result) => {
  try {
    const PUBLICATION_ITEM = new PUBLICATION({
      title: request.body.title,
      description: request.body.description,
      subDescription: request.body.subDescription,
      decorationImageUrl: request.body.decorationImageUrl,
      nameAddModulesArray: request.body.nameAddModulesArray,
      author:request.body.author
    });
    const NEW_PUBLICATION = await PUBLICATION_ITEM.save();
    result.status(201).json(NEW_PUBLICATION);
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
});
ROUTER.put('/:id', async (request, result) => {
  try {
    const PUBLICATION_ITEM = await PUBLICATION.findById(request.params.id);
    if (!PUBLICATION_ITEM) {
      return result.status(404).json({ message: 'Publication not found' });
    }
    
    PUBLICATION_ITEM.title = request.body.title || PUBLICATION_ITEM.title;
    PUBLICATION_ITEM.description = request.body.description || PUBLICATION_ITEM.description;
    PUBLICATION_ITEM.subDescription = request.body.subDescription || PUBLICATION_ITEM.subDescription;
    PUBLICATION_ITEM.decorationImageUrl = request.body.decorationImage || PUBLICATION_ITEM.decorationImageUrl;
    PUBLICATION_ITEM.nameAddModulesArray = request.body.nameAddModulesArray || PUBLICATION_ITEM.nameAddModulesArray;

    const updatedPublication = await PUBLICATION_ITEM.save();
    result.json(updatedPublication);
  } catch (error) {
    result.status(400).json({ message: error.message });
  }
});

ROUTER.delete('/:id', async (request, result) => {
  try {
    const deletedPublication = await PUBLICATION.findByIdAndDelete(request.params.id);
    if (!deletedPublication) {
      return result.status(404).json({ message: 'Publication not found' });
    }
    result.json({ message: 'Publication deleted',idProject:request.params.id});
  } catch (error) {
    result.status(500).json({ message: error.message });
  }
});


module.exports = ROUTER;
