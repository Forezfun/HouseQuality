const nodemailer = require('nodemailer');
require('dotenv').config();
const CODE_PASSWORD = process.env.CODE_AUTH_PASSWORD

function sendEmail(accountEmail, typeEmail, additionalData) {
    let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'housequalityteam@gmail.com',
            pass: CODE_PASSWORD
        }
    });
    let html, responseObject
    switch (typeEmail) {
        case 'resetCode':
            const RESULT = getResetCodeHtml()
            html = RESULT.html
            responseObject={ resetCode: RESULT.resetCode.toString() }
            break
        case 'furnitureDelete':
            html = getDeleteFurnitureHtml(additionalData.furnitureName, additionalData.roomsNamesArray)
            responseObject={message:'Message sent'}
            break
    }
    let mailOptions = {
        from: 'housequalityteam@gmail.com',
        to: accountEmail,
        subject: 'HouseQuality',
        html: html
    };
    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            return error;
        }
    });
    
    return responseObject
}
function getResetCodeHtml() {
    const resetCode = Math.floor(1000 + Math.random() * 9000);
    const resetCodeHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body {
                font-family: Arial, Courier, monospace;
                color: #333;
                margin: 0;
                padding: 0;
            }
            .container {
                width: 80%;
                margin: 0 auto;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 10px 0;
            }
            .header h1 {
                margin: 0;
                color: #333;
            }
            .content {
                padding: 20px 0;
            }
            .content p {
                font-size: 16px;
                line-height: 1.5;
                color: #555;
            }
            .code-box {
                margin: 20px 0;
                padding: 20px;
                background-color: #A3B18A;
                border: 2px solid #344E41;
                border-radius: 10px;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                color: #DAD7CD;
            }
            .footer {
                text-align: center;
                padding: 10px 0;
                font-size: 14px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>HouseQuality</h1>
            </div>
            <div class="content">
                <p>Здравствуйте,</p>
                <p>Мы получили запрос на сброс пароля для вашего аккаунта на сайте HouseQuality. Если вы не отправляли этот запрос, просто проигнорируйте это письмо.</p>
                <p>Для сброса пароля используйте следующий код:</p>
                <div class="code-box">${resetCode}</div>
                <p>Введите этот код на сайте, чтобы продолжить процесс сброса пароля.</p>
                <p>С уважением,<br>Команда HouseQuality</p>
            </div>
            <div class="footer">
                <p>2025 HouseQuality</p>
            </div>
        </div>
    </body>
    </html>`
    return {
        html: resetCodeHtml,
        resetCode: resetCode
    }
}
function getDeleteFurnitureHtml(furnitureName, roomsNamesArray) {
    deleteObjectHtml = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Furniture Removal Notification</title>
    <style>
        body {
            font-family: Arial, Courier, monospace;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            width: 80%;
            margin: 0 auto;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 10px 0;
        }
        .header h1 {
            margin: 0;
            color: #333;
        }
        .content {
            padding: 20px 0;
        }
        .content p {
            font-size: 16px;
            line-height: 1.5;
            color: #555;
        }
        .info-box {
            margin: 20px 0;
            padding: 20px;
            background-color: #A3B18A;
            border: 2px solid #344E41;
            border-radius: 10px;
            color: #DAD7CD;
        }
        .furniture-name {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
        }
        .rooms-list {
            margin-top: 15px;
        }
        .rooms-list ul {
            list-style-type: none;
            padding: 0;
        }
        .rooms-list li {
            padding: 5px 0;
            border-bottom: 1px solid #DAD7CD;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            font-size: 14px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>HouseQuality</h1>
        </div>
        <div class="content">
            <p>Здравствуйте,</p>
            <p>Мы хотели бы уведомить вас об удалении мебели из вашего проекта на HouseQuality.</p>
            
            <div class="info-box">
                <div class="furniture-name">${furnitureName}</div>
                <p>Эта мебель была удалена из следующих комнат:</p>
                <div class="rooms-list">
                    <ul>
                        ${roomsNamesArray.map(room => `<li>${room}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            <p>С уважением,<br>Команда HouseQuality</p>
        </div>
        <div class="footer">
            <p>2025 HouseQuality</p>
        </div>
    </div>
</body>
</html>
    `
return deleteObjectHtml
}
module.exports = sendEmail;