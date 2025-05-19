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

function searchPublications(publications, query,getTenItems=false) {
    let results = [];

    for (const PUBLICATION of publications) {
        const { name = '', description = '' } = PUBLICATION;
        const COMBINED_TEXT = `${name} ${description}`.toLowerCase(); 
        const LOWER_CASE_QUERY = query.toLowerCase();

        let matchFound = false;
        const z = calculateZFunction(COMBINED_TEXT, LOWER_CASE_QUERY);
        if (z.some(value => value >= LOWER_CASE_QUERY.length)) {
            matchFound = true;
        } else {
            for (let len = LOWER_CASE_QUERY.length - 1; len > 0; len--) {
                const subQuery = LOWER_CASE_QUERY.substring(0, len);
                const zSub = calculateZFunction(COMBINED_TEXT, subQuery);
                if (zSub.some(value => value >= subQuery.length)) {
                    matchFound = true;
                    break;
                }
            }
        }

        if (matchFound) {
            results.push(PUBLICATION);
        }
        if (getTenItems&&results.length >= 10) break;
    }

    return results;
}

module.exports.searchPublications = searchPublications;
module.exports.transliterateQuery = transliterateQuery;