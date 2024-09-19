const MONGOOSE = require('mongoose');

const PAGE_INFORMATION_SCHEM = new MONGOOSE.Schema({
namePage:String,
codePage:String
  });
  const PROJECT_SCHEM = new MONGOOSE.Schema({
    title: String,
    description: String,
    subDescription: String,
    subDescription: String,
    decorationImageUrl: String,
    nameAddModulesArray: [PAGE_INFORMATION_SCHEM],
    author:String
  });

const PUBLICATION = MONGOOSE.model('Publication', PROJECT_SCHEM);

module.exports = PUBLICATION;
