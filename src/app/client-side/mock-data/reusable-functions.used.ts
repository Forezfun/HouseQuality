export function checkDesktop () {
    return /windows nt|macintosh|x11|linux/.test(navigator.userAgent.toLowerCase())
}