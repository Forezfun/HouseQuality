const MONGOOSE = require('mongoose');
const USER_SCHEM = new MONGOOSE.Schema({
    nickname: String,
    jwtTokens:[String]
  })

const USER = MONGOOSE.model('User', USER_SCHEM);

module.exports = USER;
