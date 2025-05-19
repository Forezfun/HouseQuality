import { provideHttpClient } from '@angular/common/http';
import { ShopService, furnitureShopData } from '../../services/shop.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BASE_URL } from './mock-data';

describe('ShopService', () => {
  let service: ShopService;

  const SHOP_RESPONSE: { resultsArray: furnitureShopData[] } = {
    resultsArray: [
      {
        name: 'Chair',
        cost: 100,
        previewUrl: '/images/chair.jpg',
        furnitureCardId: 'f1',
        colors: ['red'],
        proportions: {
          width: 1,
          height: 1,
          length: 1
        }
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ShopService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ShopService);
  });

  afterEach(() => {
    if ((window as any).fetch && (window.fetch as any).and) {
      (window.fetch as any).and.callThrough();
    }
  });

  it('should fetch category data with transformed previewUrl', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response(JSON.stringify(SHOP_RESPONSE), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })));

    const result = await service.GETgetCategoryData('chairs', 0);

    expect(window.fetch).toHaveBeenCalledWith(
      `${BASE_URL}shop?category=chairs&startRange=0`,
      jasmine.any(Object)
    );
    expect(result.resultsArray[0].previewUrl).toBe(BASE_URL + '/images/chair.jpg');
  });

  it('should throw error when GETgetCategoryData fails', async () => {
    spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response('Error loading category', {
      status: 500,
      statusText: 'Server Error'
    })));

    await expectAsync(service.GETgetCategoryData('tables', 0)).toBeRejectedWithError(/Ошибка: 500/);
  });
});
