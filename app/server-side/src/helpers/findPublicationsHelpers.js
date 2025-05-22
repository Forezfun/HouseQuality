const Fuse = require('fuse.js');

function transliterateQuery(query) {
    const transliterationMap = {
        'а': 'f', 'б': ',', 'в': 'd', 'г': 'u', 'д': 'l', 'е': 't', 'ё': '`', 'ж': ';', 'з': 'p',
        'и': 'b', 'й': 'q', 'к': 'r', 'л': 'k', 'м': 'v', 'н': 'y', 'о': 'j', 'п': 'g', 'р': 'h',
        'с': 'c', 'т': 'n', 'у': 'e', 'ф': 'a', 'х': '[', 'ц': 'w', 'ч': 'x', 'ш': 'i', 'щ': 'o',
        'ъ': ']', 'ы': 's', 'ь': 'm', 'э': '\'', 'ю': '.', 'я': 'z'
    };

    const reverseMap = Object.fromEntries(
        Object.entries(transliterationMap).map(([ru, en]) => [en, ru])
    );

    return query.split('').map(char =>
        transliterationMap[char] || reverseMap[char] || char
    ).join('');
}
const ADD_FIND_PARAMS={
    threshold: 0.3,
    getTenItems: false
}
function searchPublications(publications, query,additionalFindParams=ADD_FIND_PARAMS) {
    if (!query) return [];

    const options = {
        keys: ['name', 'description'],
        threshold: additionalFindParams.threshold||0.3,           
        ignoreLocation: true,     
        includeScore: true,       
    };

    const fuse = new Fuse(publications, options);
    
    let results = fuse.search(query);

    if (results.length === 0) {
        const transliteratedQuery = transliterateQuery(query);
        if (transliteratedQuery !== query) {
            results = fuse.search(transliteratedQuery);
        }
    }

    if (additionalFindParams.getTenItems) {
        results = results.slice(0, 10);
    }

    return results.map(res => res.item);
}

module.exports.searchPublications = searchPublications;
module.exports.transliterateQuery = transliterateQuery;
