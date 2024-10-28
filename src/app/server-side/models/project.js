const MONGOOSE = require('mongoose');
const OJECT_SCHEM = new MONGOOSE.Schema({
  objectId: String,
  xMetersDistance: Number,
  zMetersDistance: Number,
  yRotate: Number
});

const ROOM_SCHEM = new MONGOOSE.Schema({
  name:String,
  gridArea:String,
  roomProportions:{
    width:Number,
    height:Number,
    length:Number
  },
  objects:[OJECT_SCHEM]
})
const PROJECT_SCHEM = new MONGOOSE.Schema({
  name: String,
  rooms: [ROOM_SCHEM],
  authorId: String
});

const PROJECT = MONGOOSE.model('Project', PROJECT_SCHEM);

module.exports = PROJECT;
