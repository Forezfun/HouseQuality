const MONGOOSE = require('mongoose');
const USER_SCHEM = new MONGOOSE.Schema({
    nickname: String,
    jwts:[String]
  })

const USER = MONGOOSE.model('Account', USER_SCHEM);

module.exports = USER;
