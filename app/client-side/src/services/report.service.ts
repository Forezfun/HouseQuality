import { Injectable } from '@angular/core';
import { baseClientUrl} from '.';
import { modelInterface } from '../components/scene/scene.component';
import { shopData } from './furniture-card-control.service';


export interface reportResponse {
  name: string;
  proportions: modelInterface,
  furnitures: {
    name: string;
    furnitureCardId: string;
    previewUrl: string;
    proportions: modelInterface;
    shops: shopData[];
    category: string;
  }[]
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor() { }

  createReport(roomData: reportResponse, renderImage: Blob): void {
    this.createReportHTML(roomData, renderImage);
  }

  private createReportHTML(roomData: reportResponse, renderImage: Blob): void {
    const reader = new FileReader();

    reader.onload = () => {
      const imageUrl = reader.result as string;
      const htmlContent = this.generateHtmlContent(roomData, imageUrl);
      this.openHtmlInNewTab(roomData.name,htmlContent);
    };

    reader.readAsDataURL(renderImage);
  }

  private generateHtmlContent(roomData: reportResponse, renderUrl: string): string {
    return `
      <!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Отчет по комнате ${roomData.name}</title>
    <style>
        @font-face {
            font-family: 'Calypso';
            src: url('http://localhost:4200/assets/fonts/Calypso.ttf') format('truetype');
        }

        @font-face {
            font-family: 'Courier New';
            src: url('http://localhost:4200/assets/fonts/Courier New.ttf') format('truetype');
        }

        body {
            margin: 0;
            padding: 40px;
            background-color: black;
            color: #DAD7CD;
            font-family: 'Courier New', monospace;
            line-height: 1.6;
            display: flex;
            flex-direction: column;
        }

        .title {
            font-family: 'Calypso', sans-serif;
            text-align: center;
            font-size: 3rem;
            margin-bottom: 40px;
            color: #A3B18A;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .renderTitle {
            font-family: 'Courier New', monospace;
            font-weight: 400;
            font-size: 1.5rem;
            margin: 30px 0 15px;
            color: #A3B18A;
            border-bottom: 2px solid #A3B18A;
            padding-bottom: 8px;
            width:fit-content;
            align-self: center;
        }

        .furnituresSpanTitle {
            font-family: 'Calypso', sans-serif;
            font-size: 2rem;
            margin: 40px 0 20px;
            color: #A3B18A;
            display: block;
            text-align: center;
        }

        .furniture {
            display: flex;
            flex-direction: column;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 30px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease;
        }

        .furnitureTitle {
            font-family: 'Courier New', monospace;
            font-weight: 400;
            margin: 0 auto 15px;
            font-size: 1.3rem;
            color: #DAD7CD;
        }

        .furnitureImage {
            margin: 0 auto;
            max-width: 100%;
            border-radius: 10px;
            margin-bottom: 20px;
        }

        .furnitureFooter {
            display: flex;
            gap: 30px;
            flex-direction: row;
            justify-content: center;
            flex-wrap: wrap;
        }

        .paramsTitle,
        .shopsTitle {
            font-family: 'Calypso', sans-serif;
            font-size: 1.2rem;
            color: #A3B18A;
            margin-bottom: 15px;
        }

        .paramsSpan {
            width: fit-content;
            min-width: 200px;
        }

        .paramsList {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }

        .paramsItem {
            margin-bottom: 8px;
            position: relative;
            padding-left: 20px;
        }

        .shopsSpan {
            min-width: 200px;
        }

        a {
            display: inline-block;
            background-color: white;
            color: black;
            text-decoration: none;
            padding: 5px 20px;
            border-radius: 10px;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            width:250px;
            max-width: 250px;
            text-align: center;
            font-family: 'Courier New';
            font-weight: 400;
            font-size: 0.8rem
        }

        a:hover {
            background-color: transparent;
            color: white;
            border-color: white;
        }

        img {
            width: 100%;
            max-height: 500px;
            object-fit: contain;
            border-radius: 10px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            margin-bottom: 30px;
        }

        .openLink {
            width:250px;
            max-width: 250px;
            margin: 0 auto;
            margin-top: 20px;
        }
        .furnitureLink{
            background-color: #A3B18A;
            color:white;
            &:hover{
                background-color: #344E41;
                border: 2px solid #344E41;
            }
        }

        @media (max-width: 768px) {
            .furnitureFooter {
                flex-direction: column;
                align-items: center;
                gap: 20px;
                width: 100%;
            }

            .paramsSpan,
            .shopsSpan {
                width: 90%;
            }

            .openLink,.shopLink {
                box-sizing: border-box;
                width: 100%;
            }

            .title {
                font-size: 2rem;
            }

            body {
                padding: 20px;
            }
        }
    </style>
</head>
<h1 class="title">Отчет по комнате<br>${roomData.name}</h1>
<h2 class="renderTitle">Вид сверху</h2>
<img src="${renderUrl}"
    alt="Room render">

<h2 class="furnituresSpanTitle">Добавленная мебель</h2>
${roomData.furnitures.map(furniture => `
    <span class="furniture">
    <h3 class="furnitureTitle"> Onte Bucle White </h3>
    <img class= "furnitureImage"
        src = "${furniture.previewUrl}"
        alt = "Onte Bucle White" loading = "lazy">
    <span class="furnitureFooter" >
    <span class="paramsSpan" >
    <p class="paramsTitle"> Параметры </p>
    <ul class= "paramsList">
    <li class="paramsItem"> Ширина: ${roomData.proportions.width}м </li>
    <li class= "paramsItem"> Высота: ${roomData.proportions.height}м </li>
    <li class= "paramsItem"> Длина: ${roomData.proportions.length}м </li>
    </ul>
    </span>
    <span class= "shopsSpan" >
    ${furniture.shops.map(shopData => `
        <p class="shopsTitle"> Магазины </p>
        <span >
      <a class="shopLink" href = "${shopData.url}">
      ${this.costPipe(shopData.cost)}
      </a>
      </span>
      `).join('')
      }
    </span>
    </span>
    <a class= "openLink furnitureLink" href = "${baseClientUrl}shop/${furniture.category}/${furniture.furnitureCardId}"> Посмотреть мебель </a>
    </span>
    `).join('')}
<a class="openLink planLink" href="${baseClientUrl}plan">Посмотреть проект</a>

</html>
    `;
  }
  private costPipe(cost: number) {
    return cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  private openHtmlInNewTab(roomName:string,htmlContent: string): void {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob)

    window.open(url, '_blank');
    this.downloadHtml(roomName,url)
  }
  private downloadHtml(roomName:string,htmlUrl: string): void {
    const downloadButton = document.createElement('a');
    downloadButton.href = htmlUrl;
    downloadButton.download = roomName+'-report.html';
    downloadButton.click();
    URL.revokeObjectURL(htmlUrl);
  }

}