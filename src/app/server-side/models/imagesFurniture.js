const MONGOOSE = require('mongoose');
const IMAGES_FURNITURE_SCHEM = new MONGOOSE.Schema({
    color:String,
    images:[{
        filename: String
    }],
    idMainImage:Number,
    furnitureId:String
  })

const IMAGES_FURNITURE = MONGOOSE.model('ImagesFurniture', IMAGES_FURNITURE_SCHEM);

module.exports = IMAGES_FURNITURE;
