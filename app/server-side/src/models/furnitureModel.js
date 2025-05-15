const MONGOOSE = require('mongoose');
const FURNITURE_MODEL_SCHEM = new MONGOOSE.Schema({
  filename: String,
  furnitureId:String,
  originalName:String
  })

const FURNITURE_MODEL = MONGOOSE.model('FurnitureModel', FURNITURE_MODEL_SCHEM);

module.exports = FURNITURE_MODEL;
