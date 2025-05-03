const MONGOOSE = require('mongoose');

const CATEGORY_SCHEM = new MONGOOSE.Schema({
    name:String,
    translateOne:String,
    translateMany:String
})
const CATEGORY = MONGOOSE.model('Category', CATEGORY_SCHEM);

module.exports = CATEGORY;