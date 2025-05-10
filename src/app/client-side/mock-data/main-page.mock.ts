import { imageSliderFromServerData } from "../components/image-slider/image-slider.component"
import { furnitureFromServerData } from "../services/furniture-card-control.service"
import { roomData } from "../services/project.service"

const imagesData: imageSliderFromServerData = {
    images: ['/assets/images/sofaSliderPhotos/1.png', '/assets/images/sofaSliderPhotos/2.png', '/assets/images/sofaSliderPhotos/3.png', '/assets/images/sofaSliderPhotos/4.png'],
    idMainImage: 0
}
export const furnitureExampleData:furnitureFromServerData = {
    name: 'Onte Bucle White',
    colors: [{ color: '#FFC2CC', imagesData: imagesData }],
    description: `Механизм: пантограф\nВысота от пола: 12 см\nЯщик для белья: да\nМакс. нагрузка: 100 кг`,
    shops: [{ cost: 125990, url: 'https://www.divan.ru/blagoveshchensk/product/divan-uglovoj-onte-bucle-white' }, { cost: 84990, url: 'https://avtorm.ru/catalog/product-divan-uglovoy-onte-bucle-white' }],
    additionalData: {
        category: 'sofa'
    },
    proportions: {
        width: 1,
        height: 1,
        length: 1
    }
}
export const planHouseExampleData: roomData[] = [
    {
        name: 'Прихожая',
        objects: [],
        gridArea: '1 / 1 / 3 / 4',
        roomProportions: {
            width: 3,
            length: 2,
            height: 3
        }
    },
    {
        name: 'Санузел',
        objects: [],
        gridArea: '3 / 1 / 4 / 2',
        roomProportions: {
            width: 1,
            length: 1,
            height: 3
        }
    },
    {
        name: 'Санузел',
        objects: [],
        gridArea: ' 4 / 1 / 5 / 2',
        roomProportions: {
            width: 1,
            length: 1,
            height: 3
        }
    },
    {
        name: 'Гостинная',
        objects: [],
        gridArea: '5 / 1 / 8 / 5',
        roomProportions: {
            width: 4,
            length: 3,
            height: 3
        }
    },
    {
        name: 'Спальня',
        objects: [],
        gridArea: ' 3 / 2 / 5 / 4',
        roomProportions: {
            width: 2,
            length: 2,
            height: 3
        }
    }
]
