const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const FURNITURE_CARD = require('../models/furnitureCard')
const IMAGES_FURNITURE = require('../models/imagesFurniture');
const { searchPublications,transliterateQuery } = require('./finderRoutes');

ROUTER.get('/category', async (request, result) => {
    try {
        let START_RANGE = Number(request.query.startRange);
        const CATEGORY_NAME = request.query.category;

        if (isNaN(START_RANGE)) throw new Error("Диапазон должен быть числом");

        let filtersObject = {};
        if (request.query.filters) {
            filtersObject = JSON.parse(request.query.filters);
        }

        const FIND_PARAMS = getFindParams(CATEGORY_NAME, filtersObject);
        let furnitureCardsArray = await FURNITURE_CARD.find(FIND_PARAMS)
            .skip(START_RANGE)
            .limit(10);

        START_RANGE += 10;

        if (furnitureCardsArray.length < 10) {
            const TOTAL_COUNT = await FURNITURE_CARD.countDocuments(FIND_PARAMS);

            while (START_RANGE < TOTAL_COUNT && furnitureCardsArray.length < 10) {
                const nextBatch = await FURNITURE_CARD.find(FIND_PARAMS)
                    .skip(START_RANGE)
                    .limit(10);

                furnitureCardsArray.push(...nextBatch);
                START_RANGE += 10;
            }
        }

        if (filtersObject?.name) {
            let searchResults = searchPublications(furnitureCardsArray, filtersObject.name, true);

            if (searchResults.length < 10) {
                const additionalResults = searchPublications(
                    furnitureCardsArray,
                    transliterateQuery(filtersObject.name),
                    true
                );

                const existingIds = new Set(searchResults.map(doc => doc._id.toString()));
                for (const doc of additionalResults) {
                    if (!existingIds.has(doc._id.toString())) {
                        searchResults.push(doc);
                        if (searchResults.length >= 10) break;
                    }
                }
            }

            furnitureCardsArray = searchResults;
        }

        const RESULTS_ARRAY = await Promise.all(
            furnitureCardsArray.map(async (furnitureData) => {
                if (!furnitureData.shops || furnitureData.shops.length === 0) return undefined;
                const minCost = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;

                const IMAGES_FURNITURE_ITEM = await IMAGES_FURNITURE.findOne({
                    furnitureId: furnitureData._id
                });

                if (!IMAGES_FURNITURE_ITEM) return undefined;

                return {
                    name: furnitureData.name,
                    cost: minCost,
                    furnitureId: furnitureData._id,
                    previewUrl: `furniture/images/simple?furnitureCardId=${furnitureData._id}&color=${IMAGES_FURNITURE_ITEM.color}&idImage=${IMAGES_FURNITURE_ITEM.idMainImage}`,
                    colors: furnitureData.colors?.map(colorData => colorData.color) || [],
                    proportions: furnitureData.proportions || null
                };
            })
        );

        const filteredResults = RESULTS_ARRAY.filter(item => item !== undefined);

        result.status(200).json({ resultsArray: filteredResults });

    } catch (error) {
        result.status(400).json({ message: error.message });
    }
});

function getFindParams(categoryName, filtersObject) {
    const baseFilter = (categoryName === 'all') ? {} : { 'additionalData.category': categoryName };

    const additionalFilters = [];

    if (filtersObject) {
        for (const key in filtersObject) {
            if (!filtersObject.hasOwnProperty(key)) continue;

            const filterValue = filtersObject[key];

            if (Array.isArray(filterValue)) {
                const condition = {};
                condition[`additionalData.${key}`] = { $in: filterValue };
                additionalFilters.push(condition);

            } else if (typeof filterValue === 'object' && filterValue !== null) {
                const condition = {};
                const rangeFilter = {};
                if (filterValue.min !== undefined) rangeFilter.$gte = filterValue.min;
                if (filterValue.max !== undefined) rangeFilter.$lte = filterValue.max;
                condition[`additionalData.${key}`] = rangeFilter;
                additionalFilters.push(condition);
            }
        }
    }

    return additionalFilters.length > 0
        ? { $and: [baseFilter, ...additionalFilters] }
        : baseFilter;
}
module.exports = ROUTER;