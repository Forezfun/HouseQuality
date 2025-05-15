const MONGOOSE = require('mongoose');
const AUTH_USER_SCHEM = new MONGOOSE.Schema({
    accountId:String,
    emailData:{email:String,password:String},
    googleData:{email:String,googleId:String}
  })

const AUTH_USER = MONGOOSE.model('AuthAccount', AUTH_USER_SCHEM);

module.exports = AUTH_USER;
