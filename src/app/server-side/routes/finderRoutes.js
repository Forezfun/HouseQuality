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

function transliterateQuery(query) {
    const transliterationMap = {
        'а': 'f', 'б': ',', 'в': 'd', 'г': 'u', 'д': 'l', 'е': 't', 'ё': '`', 'ж': ';', 'з': 'p', 'и': 'b', 'й': 'q',
        'к': 'r', 'л': 'k', 'м': 'v', 'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h', 'с': 'c', 'т': 'n', 'у': 'e',
        'ф': 'a', 'х': '[', 'ц': 'w', 'ч': 'x', 'ш': 'i', 'щ': 'o', 'ъ': ']', 'ы': 's', 'ь': 'm', 'э': '\'',
        'ю': '.', 'я': 'z'
    };

    return query.split('').map(char => transliterationMap[char] || char).join('');
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

ROUTER.get('/', async (request, result) => {
    try {
        const query = request.query.q;
        if (!query || query.trim() === '') {
            return result.status(400).json({ message: 'Search query cannot be empty' });
        }

        const publications = await FURNITURE_CARD.find();
        let filteredPublications = searchPublications(publications, query);

        if (filteredPublications.length < 10) {
            const transliteratedQuery = transliterateQuery(query);
            const additionalResults = searchPublications(publications, transliteratedQuery);
            const uniqueResults = new Map();

            [...filteredPublications, ...additionalResults].forEach(pub => {
                uniqueResults.set(pub._id.toString(), pub);
            });

            filteredPublications = Array.from(uniqueResults.values()).slice(0, 10);
        }

        const processedPublications = filteredPublications.map(furnitureData => {
            const cost = furnitureData.shops.sort((a, b) => a.cost - b.cost)[0].cost;
            const colorRequest = furnitureData.colors[0].color;
            return {
                name: furnitureData.name,
                cost: cost,
                colorRequest: colorRequest,
                id: furnitureData._id,
                category: furnitureData.additionalData.category
            };
        });

        result.json(processedPublications);
    } catch (err) {
        result.status(500).json({ message: err.message });
    }
});

module.exports = ROUTER;
