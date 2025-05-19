const MONGOOSE = require('mongoose');

/**
 * @typedef {Object} ObjectInRoom
 * @memberof module:project
 * @property {string} objectId - ID объекта (мебели или другого элемента).
 * @property {number} xMetersDistance - Смещение по оси X в метрах.
 * @property {number} zMetersDistance - Смещение по оси Z в метрах.
 * @property {number} yRotate - Вращение объекта по оси Y в градусах.
 */

/**
 * @typedef {Object} RoomProportions
 * @memberof module:project
 * @property {number} width - Ширина комнаты(м).
 * @property {number} height - Высота комнаты(м).
 * @property {number} length - Длина комнаты(м).ищвн
 */

/**
 * @typedef {Object} Room
 * @memberof module:project
 * @property {string} name - Название комнаты.
 * @property {string} gridArea - Строка, описывающая позицию комнаты в сетке (например 'grid-area:1/1/2/2').
 * @property {module:project.RoomProportions} roomProportions - Габариты комнаты.
 * @property {module:project.ObjectInRoom[]} objects - Список объектов, размещённых в комнате.
 */

/**
 * @typedef {Object} Project
 * @memberof module:project
 * @property {string} name - Название проекта.
 * @property {module:project.Room[]} rooms - Список комнат в проекте.
 * @property {string} authorId - ID пользователя, создавшего проект.
 */

const OJECT_SCHEM = new MONGOOSE.Schema({
  objectId: String,
  xMetersDistance: Number,
  zMetersDistance: Number,
  yRotate: Number
});

const ROOM_SCHEM = new MONGOOSE.Schema({
  name: String,
  gridArea: String,
  roomProportions: {
    width: Number,
    height: Number,
    length: Number
  },
  objects: [OJECT_SCHEM]
});

const PROJECT_SCHEM = new MONGOOSE.Schema({
  name: String,
  rooms: [ROOM_SCHEM],
  authorId: String
});

const PROJECT = MONGOOSE.model('Project', PROJECT_SCHEM);

module.exports = PROJECT;
