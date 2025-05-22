import { categoryData } from '../../src/services/category.service';
import { furnitureFromServerData, furnitureClientData } from '../../src/services/furniture-card-control.service';

export const BASE_URL = 'http://localhost:4200/api/';
export const JWT = 'test.jwt.token';
export const EMAIL = 'test@example.com';
export const ERROR_MESSAGE = 'Service implementation error';
export const SUCCESS_RESPONSE = 'Service implementation success'

export const EMAIL_AUTH_DATA = {
  email: 'test@example.com',
  password: 'password123',
  accountType: 'email' as const
};
export const ACCOUNT_DATA = {
  ...EMAIL_AUTH_DATA,
  nickname: 'testuser'
};
export const GOOGLE_AUTH_DATA = {
  ...EMAIL_AUTH_DATA,
  accountType: 'google' as const
};
export const CHANGE_DATA_EMAIL = {
  ...EMAIL_AUTH_DATA,
  jwt: 'test.jwt.token'
};
export const UPDATE_DATA = {
  jwt: JWT,
  nickname: 'newnickname'
};
export const ACCOUNT_RESPONSE = {
  accountData: {
    avatarUrl: 'avatar.jpg',
    nickname: 'testuser',
    email: 'test@example.com',
    projects: [],
    furnitures: [
      { _id: '1', name: 'Furniture 1', previewUrl: 'previews/1.jpg' },
      { _id: '2', name: 'Furniture 2', previewUrl: 'previews/2.jpg' }
    ]
  }
};

export const JWT_RESPONSE = { jwt: 'test.jwt.token' };
export const CODE_RESPONSE = { resetCode: 123456 };

export const MOCK_IMAGE_FILE = new File(['sample'], 'sample.jpg', { type: 'image/jpeg' });
export const COMPRESSED_IMAGE = new Blob(['compressed'], { type: 'image/jpeg' });
export const MODEL_BLOB = new Blob(['dummy content'], { type: 'application/octet-stream' }) as Blob;

export const PROJECT_ID = 'test-project-id';
export const PROJECT_NAME = 'My Project';
export const COLOR = 'red';
export const FURNITURE_ID = 'furnitureCardId';

export const QUERY = 'chair';
export const NON_EXISTENT_QUERY = 'nonexistent';

export const MOCK_FURNITURE_RESPONSE = [
  { id: 1, name: 'Chair', price: 100 },
  { id: 2, name: 'Table', price: 200 }
];
export const EMPTY_FURNITURE_RESPONSE: any[] = [];

export const CATEGORY_RESPONSE: { categoryArray: categoryData[] } = {
  categoryArray: [
    {
      name: 'sofa',
      translateOne: 'Диван',
      translateMany: 'Диваны',
      filters: [
        {
          name: 'Цвет',
          field: 'color',
          type: 'select',
          options: [
            { name: 'Красный', queryValue: 'red' },
            { name: 'Синий', queryValue: 'blue' },
            { name: 'Зелёный', queryValue: 'green' }
          ]
        }
      ]
    }
  ]
};


export const FURNITURE_CARD_DATA: furnitureFromServerData = {
  name: 'Софа "Люкс"',
  description: 'Эта софа идеально подойдет для вашего дома, с комфортной обивкой и стильным дизайном.',
  proportions: {
    width: 200,
    length: 90,
    height: 85
  },
  shops: [
    { cost: 15000, url: 'https://shop1.example.com' },
    { cost: 14500, url: 'https://shop2.example.com' }
  ],
  additionalData: {
    category: 'Мебель для гостиной'
  },
  colors: [
    {
      color: 'Красный',
      imagesData: {
        idMainImage: 0,
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg']
      }
    },
    {
      color: 'Синий',
      imagesData: {
        idMainImage: 0,
        images: ['image4.jpg', 'image5.jpg', 'image6.jpg']
      }
    }
  ]
};
export const FURNITURE_CARD_RESPONSE = {
  furnitureCard: FURNITURE_CARD_DATA,
  authorMatched: true
};
export const UPDATED_FURNITURE_CARD_DATA: furnitureFromServerData = {
  ...FURNITURE_CARD_DATA,
  name: 'Софа "Люкс" Обновленная',
  description: 'Обновленная софа с новым дизайном и улучшенными характеристиками.'
};
export const DELETED_FURNITURE_CARD_RESPONSE = { message: 'Карточка удалена успешно' };
export const INVALID_FURNITURE_CARD_RESPONSE = {
  authorMatched: true
};

export const NEW_FURNITURE_CARD_DATA: furnitureClientData = {
  name: 'Кресло "Элегант"',
  description: 'Удобное и стильное кресло для вашего интерьера.',
  proportions: {
    width: 70,
    length: 75,
    height: 90
  },
  shops: [
    { cost: 9000, url: 'https://shop1.example.com' }
  ],
  additionalData: {
    category: 'Мебель для офиса'
  },
  colors: [
    {
      color: 'Черный',
      imagesData: {
        idMainImage: 0,
        images: [MOCK_IMAGE_FILE, MOCK_IMAGE_FILE]
      }
    },
    {
      color: 'Белый',
      imagesData: {
        idMainImage: 0,
        images: [MOCK_IMAGE_FILE, MOCK_IMAGE_FILE]
      }
    }
  ]
};
export const INVALID_NEW_FURNITURE_CARD_DATA: furnitureClientData = {
  name: '',
  description: '',
  proportions: {
    width: null,
    length: null,
    height: null
  },
  shops: [],
  additionalData: {},
  colors: []
};
