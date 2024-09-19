const MONGOOSE = require('mongoose');
const IMAGE_AVATAR_SCHEM = new MONGOOSE.Schema({
    filename: String,
    filepath: String,
    userId:String
  })

const AUTH_USER = MONGOOSE.model('ImageAvatar', IMAGE_AVATAR_SCHEM);

module.exports = AUTH_USER;
