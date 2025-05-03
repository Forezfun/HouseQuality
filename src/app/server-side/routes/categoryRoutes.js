const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const CATEGORY = require('../models/category');

ROUTER.get('/all', async (request, result) => {
    try {
        const CATEGORY_ARRAY=await CATEGORY.find()
        result.status(201).json({categoryArray:CATEGORY_ARRAY});
    } catch (err) {
        result.status(400).json({ message: err.message });
    }
})

module.exports = ROUTER;
