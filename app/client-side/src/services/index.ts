/**
 * Базовый URL клиента (фронтенда), по которому доступно Angular-приложение.
 * @constant {string}
 */
export const baseClientUrl = 'http://localhost:4200/'

/**
 * Базовый URL для API-запросов к серверу.
 * Формируется как базовый URL клиента + 'api/'.
 * @constant {string}
 */
export const baseUrl = baseClientUrl + 'api/'
