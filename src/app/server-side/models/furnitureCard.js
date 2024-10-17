const MONGOOSE = require('mongoose');
const ADDITIONAL_DATA_SCHEM = new MONGOOSE.Schema({
  category: String
})
const FURNITURE_CARD_SCHEM = new MONGOOSE.Schema({
  idFurnitureModel: String,
  name: String,
  description: String,
  colors: [{ color: String, idImages: String }],
  imagesFolderName: String,
  shops: [{ cost: Number, url: String }],
  authorId: String,
  additionalData: ADDITIONAL_DATA_SCHEM
})

const FURNITURE_CARD = MONGOOSE.model('FurnitureCard', FURNITURE_CARD_SCHEM);

module.exports = FURNITURE_CARD;
