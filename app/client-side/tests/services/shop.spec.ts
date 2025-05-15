import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ShopService, furnitureShopData } from '../../../client-side/services/shop.service';
import { BASE_URL } from './mock-data';
import { provideHttpClient } from '@angular/common/http';

describe('ShopService', () => {
    let service: ShopService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                ShopService,
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(ShopService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    const SHOP_RESPONSE: { resultsArray: furnitureShopData[] } = {
        resultsArray: [
            {
                name: 'Chair',
                cost: 100,
                previewUrl: '/images/chair.jpg',
                furnitureId: 'f1'
            }
        ]
    };

    it('should fetch category data with transformed previewUrl', async () => {
        const promise = service.GETgetCategoryData('chairs', 0);

        const req = httpMock.expectOne(
            `${BASE_URL}shop/category?category=chairs&startRange=0`
        );
        expect(req.request.method).toBe('GET');
        req.flush(SHOP_RESPONSE);

        const result = await promise;
        expect(result.resultsArray[0].previewUrl).toBe(BASE_URL + '/images/chair.jpg');
    });

    it('should fetch all furnitures with transformed previewUrl', async () => {
        const promise = service.GETgetAllFurnitures(10);

        const req = httpMock.expectOne(`${BASE_URL}shop/all?startRange=10`);
        expect(req.request.method).toBe('GET');
        req.flush(SHOP_RESPONSE);

        const result = await promise;
        expect(result.resultsArray[0].previewUrl).toBe(BASE_URL + '/images/chair.jpg');
    });

    it('should throw error when GETgetCategoryData fails', async () => {
        const promise = service.GETgetCategoryData('tables', 0);

        const req = httpMock.expectOne(
            `${BASE_URL}shop/category?category=tables&startRange=0`
        );
        req.flush('Error loading category', { status: 500, statusText: 'Server Error' });

        await expectAsync(promise).toBeRejected();
    });

    it('should throw error when GETgetAllFurnitures fails', async () => {
        const promise = service.GETgetAllFurnitures(0);

        const req = httpMock.expectOne(`${BASE_URL}shop/all?startRange=0`);
        req.flush('Error loading all furniture', { status: 500, statusText: 'Server Error' });

        await expectAsync(promise).toBeRejected();
    });
});
