const MONGOOSE = require('mongoose');
const ADDITIONAL_DATA_SCHEM = new MONGOOSE.Schema({
  category: String
})
const PROPORTIONS_DATA_SCHEM = new MONGOOSE.Schema({
  width:Number,
  length:Number,
  height:Number
})
const FURNITURE_CARD_SCHEM = new MONGOOSE.Schema({
  name: String,
  description: String,
  colors: [{ color: String, idImages: String }],
  shops: [{ cost: Number, url: String }],
  authorId: String,
  proportions:PROPORTIONS_DATA_SCHEM,
  additionalData: ADDITIONAL_DATA_SCHEM
})

const FURNITURE_CARD = MONGOOSE.model('FurnitureCard', FURNITURE_CARD_SCHEM);

module.exports = FURNITURE_CARD;
 