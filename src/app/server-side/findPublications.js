   const enToRuMap = {
    'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з', '[': 'х', ']': 'ъ',
    'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л', 'l': 'д', ';': 'ж', '\'': 'э',
    'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь', ',': 'б', '.': 'ю'
  };
   const ruToEnMap = {
    'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p', 'х': '[', 'ъ': ']',
    'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k', 'д': 'l', 'ж': ';', 'э': '\'',
    'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm', 'б': ',', 'ю': '.'
  };
  
  function translateLayout(word, toRussian = true) {
    const map = toRussian ? enToRuMap : ruToEnMap;
    return word.split('').map(char => map[char.toLowerCase()] || char).join('');
  }
  
  function processWord(word) {
    const lowerCase = word.toLowerCase();
    const upperCase = word.toUpperCase();
    const translatedToRu = translateLayout(lowerCase, true);
    const translatedToEn = translateLayout(lowerCase, false);
    
    return [
      translatedToRu,
      translatedToEn,
      lowerCase,
      upperCase
    ];
  }
function findPublications(findWord,publications){
    const findWordVariants = processWord(findWord)
    let resultArray = []
    let findPublicationCheck = false
    publications.forEach(publication=>{
        findWordVariants.forEach(word=>{if(publication.title.includes(word))resultArray=[...resultArray,publication._id]})      
    })
    publications.forEach(publication=>{
        findPublicationCheck=false
        publication.nameAddModulesArray.forEach(page=>{
            if(findPublicationCheck)return
            findWordVariants.forEach(word=>{
                if(page.codePage.includes(word)|page.namePage.includes(word)){resultArray=[...resultArray,publication._id];findPublicationCheck=true}
            })      
        })  
    })
    return [...new Set(resultArray)]
}
module.exports = findPublications
  