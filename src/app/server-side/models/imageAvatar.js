const MONGOOSE = require('mongoose');
const IMAGE_AVATAR_SCHEM = new MONGOOSE.Schema({
    filename: String,
    userId:String
  })

const IMAGE_AVATAR = MONGOOSE.model('ImageAvatar', IMAGE_AVATAR_SCHEM);

module.exports = IMAGE_AVATAR;
