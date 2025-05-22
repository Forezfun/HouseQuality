/**
 * Проверяет, является ли устройство десктопом или нет
 * @returns true, если устройство десктоп, иначе false
 */
export function checkDesktop () {
    return /windows nt|macintosh|x11|linux/.test(navigator.userAgent.toLowerCase())
}