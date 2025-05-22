const { searchPublications, transliterateQuery } = require('../../src/helpers/findPublicationsHelpers');

describe('transliterateQuery', () => {
  it('should transliterate Russian to English layout', () => {
    expect(transliterateQuery('привет')).toBe('ghbdtn');
  });

  it('should transliterate English to Russian layout', () => {
    expect(transliterateQuery('ghbdtn')).toBe('привет');
  });

  it('should keep unknown characters unchanged', () => {
    expect(transliterateQuery('123!@#')).toBe('123!@#');
  });

  it('should mix transliteration in both directions', () => {
    expect(transliterateQuery('ghбdт')).toBe('пр,вn');
  });
});

describe('searchPublications', () => {
  const publications = [
    { name: 'Стол деревянный', description: 'Классический обеденный стол' },
    { name: 'Стул офисный', description: 'Удобный стул с мягкой спинкой' },
    { name: 'Шкаф для одежды', description: 'Большой шкаф с зеркалом' },
    { name: 'Диван', description: 'Мягкий угловой диван' },
  ];

  it('should find a full match in name', () => {
    const results = searchPublications(publications, 'шкаф');
    expect(results).toHaveLength(1);
    expect(results[0].name).toMatch(/шкаф/i);
  });

  it('should find a partial match', () => {
    const results = searchPublications(publications, 'дерево');
    expect(results).toHaveLength(1);
    expect(results[0].name).toMatch(/стол/i);
  });

  it('should return multiple results if matched', () => {
    const results = searchPublications(publications, 'ст');
    expect(results.length).toBeGreaterThan(1);
  });

  it('should return empty array if no match', () => {
    const results = searchPublications(publications, 'пылесос');
    expect(results).toEqual([]);
  });

  it('should respect getTenItems limit', () => {
    const bigList = Array.from({ length: 20 }, (_, i) => ({
      name: `Товар ${i}`,
      description: `Описание товара ${i}`,
    }));
    const ADD_FIND_PARAMS={
        getTenItems: true
    }
    const results = searchPublications(bigList, 'товар', ADD_FIND_PARAMS);
    expect(results).toHaveLength(10);
  });
});
