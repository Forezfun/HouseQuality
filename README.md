[![House-Quality-Logo.png](https://i.postimg.cc/fy26nzFH/House-Quality-Logo.png)](https://postimg.cc/0KSt7s9m)

## 📋 Содержание
- [Требования](#-Требования)
- [Установка](#-установка)
- [Запуск](#-запуск)
- [Структура проекта](#-структура-проекта)
- [Разработка](#-разработка)

## ⚙️ Требования

Перед началом работы убедитесь, что у вас установлены:

- Node.js
- Angular CLI
- NPM
- MongoDB

 ⚠️ Убедитесь, что у вас выключен VPN для корректной отправки Email(Nodemailer).

## 📦 Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/Forezfun/HouseQuality.git
cd HouseQuality
```

2. Установите зависимости для фронтенда:

```bash
cd app/client-side
npm install
```

3. Установите зависимости для бэкенда:

```bash
cd app/server-side
npm install
```

## 🚀 Запуск

### Клиентская часть (Angular)

```bash
cd app/client-side/src
ng serve
```

Проект будет доступен по адресу: [http://localhost:4200](http://localhost:4200)

### Серверная часть (Node.js + MongoDB)

```bash
cd app/server-side/src
node server
```

Сервер по умолчанию запустится на [http://localhost:5000](http://localhost:5000)

⚠️ Убедитесь, что MongoDB запущена локально.

## 🗂 Структура проекта

```text
├── app/                        # Корневая директория приложения
│   ├── client-side/            # Фронтенд-часть (Angular)
│   │   ├── dist/               # Скомпилированные фронтенд-файлы
│   │   ├── node_modules/       # Зависимости фронтенда
│   │   ├── src/                # Исходный код фронтенда
│   │   ├── package-lock.json   # Package-lock.json
│   │   └── package.json        # Зависимости фронтенда
│   │
│   └── server-side/            # Бэкенд-часть (Node.js/Express + MongoDB)
│       ├── node_modules/       # Зависимости бэкенда
│       ├── src/                # Исходный код сервера
│       ├── package-lock.json   # Package-lock.json
│       └── package.json        # Зависимости бэкенда
│
├── .editorconfig               # Настройки форматирования кода
├── .gitignore                  # Игнорируемые Git файлы
├── hq.conf                     # Конфигурационный файл приложения
└── README.md                   # README
```

## 🛠 Разработка

- Фронтенд написан на **Angular** (SCSS, RxJS, TypeScript).
- Бэкенд использует **Node.js**, **Express**, **MongoDB (Mongoose)**.
