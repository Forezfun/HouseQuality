const MONGOOSE = require('mongoose');
const FILTER_SCHEM = new MONGOOSE.Schema({
    name: String,
    field: String,
    type: {
        type: String,
        required: true,
        enum: ['select', 'range']
    },
    minValue:Number,
    maxValue:Number,
    options: [
        {
            name:String,
            queryValue:String
        }
    ]
});
const CATEGORY_SCHEM = new MONGOOSE.Schema({
    name: String,
    translateOne: String,
    translateMany: String,
    filters: [FILTER_SCHEM]
})
const CATEGORY = MONGOOSE.model('Category', CATEGORY_SCHEM);

module.exports = CATEGORY;