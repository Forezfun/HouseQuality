const MONGOOSE = require('mongoose');
const FURNITURE_CARD_SCHEM = new MONGOOSE.Schema({
    idFurnitureModel:String,
    authorId:String,
    title:String,
    description:String,
    colors:[String],
    shops:[{cost:Number,shopLink:String}]
  })

const FURNITURE_CARD = MONGOOSE.model('FurnitureCard', FURNITURE_CARD_SCHEM);

module.exports = FURNITURE_CARD;
