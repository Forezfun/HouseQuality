function proccessColor(color){
    if (color.startsWith('#')) {
        return '%23'+color.slice(1);
    }
    return color;
}
module.exports = proccessColor;