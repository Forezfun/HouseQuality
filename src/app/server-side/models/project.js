const MONGOOSE = require('mongoose');
const ROOM_SCHEM = new MONGOOSE.Schema({
  name:String,
  gridArea:String,
  roomProportions:{
    width:Number,
    height:Number,
    length:Number
  }
})
const PROJECT_SCHEM = new MONGOOSE.Schema({
  name: String,
  rooms: [ROOM_SCHEM],
  authorId: String
});

const PROJECT = MONGOOSE.model('Project', PROJECT_SCHEM);

module.exports = PROJECT;
