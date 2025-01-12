const EXPRESS = require('express');
const ROUTER = EXPRESS.Router();
const FURNITURE_CARD = require('../models/furnitureCard');
const FURNITURE_IMAGE = require('../models/imagesFurniture');

function calculateZFunction(string, pattern) {
    const combined = `${pattern}#${string}`; 
    const z = Array(combined.length).fill(0);
    let left = 0, right = 0;

    for (let i = 1; i < combined.length; i++) {
        if (i <= right) {
            z[i] = Math.min(right - i + 1, z[i - left]);
        }
        while (i + z[i] < combined.length && combined[z[i]] === combined[i + z[i]]) {
            z[i]++;
        }
        if (i + z[i] - 1 > right) {
            left = i;
            right = i + z[i] - 1;
        }
    }

    return z;
}

function searchPublications(publications, query) {
    const results = [];
    
    for (const publication of publications) {
        const { name = '', description = '' } = publication;
        const combinedText = `${name} ${description}`.toLowerCase(); 
        const lowerCaseQuery = query.toLowerCase();
        
        let matchFound = false;
        const z = calculateZFunction(combinedText, lowerCaseQuery);
        if (z.some(value => value >= lowerCaseQuery.length)) {
            matchFound = true;
        } else {
            for (let len = lowerCaseQuery.length - 1; len > 0; len--) {
                const subQuery = lowerCaseQuery.substring(0, len);
                const zSub = calculateZFunction(combinedText, subQuery);
                if (zSub.some(value => value >= subQuery.length)) {
                    matchFound = true;
                    break;
                }
            }
        }

        if (matchFound) {
            results.push(publication);
        }
        if (results.length >= 10) break;
    }
    
    return results;
}


// Маршрут для поиска
ROUTER.get('/', async (request, result) => {
    try {
        const query = request.query.q;
        if (!query || query.trim() === '') {
            return result.status(400).json({ message: 'Search query cannot be empty' });
        }
        const publications = await FURNITURE_CARD.find();
        const filteredPublications = searchPublications(publications, query);
        const processedPunlications = filteredPublications.map(furnitureData=>{
            const cost = furnitureData.shops.sort((a,b)=>a.cost-b.cost)[0].cost
            const colorRequest = furnitureData.colors[0].color
            return {
                name: furnitureData.name,
                cost: cost,
                colorRequest:colorRequest,
                id:furnitureData._id,
                category:furnitureData.additionalData.category
            }
        })
        result.json(processedPunlications);
    } catch (err) {
        result.status(500).json({ message: err.message });
    }
});

module.exports = ROUTER;
