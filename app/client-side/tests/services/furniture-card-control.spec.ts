import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FurnitureCardControlService } from '../../src/services/furniture-card-control.service';
import {
    BASE_URL,
    JWT,
    FURNITURE_CARD_DATA,
    FURNITURE_CARD_RESPONSE,
    UPDATED_FURNITURE_CARD_DATA,
    SUCCESS_RESPONSE,
    DELETED_FURNITURE_CARD_RESPONSE,
    INVALID_FURNITURE_CARD_RESPONSE
} from './mock-data';

describe('FurnitureCardControlService', () => {
    let service: FurnitureCardControlService;
    let httpMock: HttpTestingController;

    const BASE_SERVICE_URL = BASE_URL + 'furniture/card';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FurnitureCardControlService,
                { provide: 'baseUrl', useValue: BASE_URL },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(FurnitureCardControlService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('GETfurnitureCard', () => {
        it('should return furniture card with correct data', async () => {
            const promise = service.GETfurnitureCard('furnitureCardId', JWT);

            const req = httpMock.expectOne(`${BASE_SERVICE_URL}?furnitureCardId=furnitureCardId&jwt=${JWT}`);
            expect(req.request.method).toBe('GET');

            req.flush(FURNITURE_CARD_RESPONSE);

            const EXPECTED_TRANSFORMED = {
                furnitureCard: {
                    ...FURNITURE_CARD_RESPONSE.furnitureCard,
                    colors: FURNITURE_CARD_RESPONSE.furnitureCard.colors.map(colorData => ({
                        color: colorData.color,
                        imagesData: {
                            idMainImage: colorData.imagesData.idMainImage,
                            images: colorData.imagesData.images.map(url => BASE_URL + url) // добавляем baseUrl
                        }
                    }))
                },
                authorMatched: true
            };

            const result = await promise;

            expect(result).toEqual({
                furnitureCard: EXPECTED_TRANSFORMED.furnitureCard,
                authorMatched: true
            });
        });

        it('should throw error when response is missing furnitureCard', async () => {
            const promise = service.GETfurnitureCard('furnitureCardId', JWT);

            const req = httpMock.expectOne(`${BASE_SERVICE_URL}?furnitureCardId=furnitureCardId&jwt=${JWT}`);
            expect(req.request.method).toBe('GET');

            req.flush(INVALID_FURNITURE_CARD_RESPONSE);
            try {
                await promise;
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        it('should handle network errors gracefully', async () => {
            const promise = service.GETfurnitureCard('furnitureCardId', JWT);

            const req = httpMock.expectOne(`${BASE_SERVICE_URL}?furnitureCardId=furnitureCardId&jwt=${JWT}`);
            expect(req.request.method).toBe('GET');

            req.error(new ProgressEvent('Network error'));
            try {
                await promise;
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });
    });

    describe('POSTcreateFurnitureCard', () => {
        it('should create furniture card with correct data', async () => {
            const promise = service.POSTcreateFurnitureCard(FURNITURE_CARD_DATA, JWT);

            const req = httpMock.expectOne(`${BASE_SERVICE_URL}?jwt=${JWT}`);
            expect(req.request.method).toBe('POST');
            assertParams(req.request.body, FURNITURE_CARD_DATA);

            req.flush({ furnitureData: { ...FURNITURE_CARD_DATA, _id: 'newFurnitureId' } });
            expect(await promise).toEqual({ furnitureData: { ...FURNITURE_CARD_DATA, _id: 'newFurnitureId' } });
        });
    });

    describe('PUTupdateFurnitureCard', () => {
        it('should update furniture card with correct data', async () => {
            const promise = service.PUTupdateFurnitureCard(UPDATED_FURNITURE_CARD_DATA, 'furnitureCardId', JWT);

            const req = httpMock.expectOne(`${BASE_SERVICE_URL}?jwt=${JWT}&furnitureCardId=furnitureCardId`);
            expect(req.request.method).toBe('PUT');
            assertParams(req.request.body, UPDATED_FURNITURE_CARD_DATA);

            req.flush({ message: SUCCESS_RESPONSE });
            expect(await promise).toEqual({ message: SUCCESS_RESPONSE });
        });
    });

    describe('DELETEfurnitureCard', () => {
        it('should delete furniture card with correct params', async () => {
            const promise = service.DELETEfurnitureCard(JWT, 'furnitureCardId');

            const req = httpMock.expectOne(`${BASE_SERVICE_URL}?jwt=${JWT}&furnitureCardId=furnitureCardId`);
            expect(req.request.method).toBe('DELETE');

            req.flush(DELETED_FURNITURE_CARD_RESPONSE);
            expect(await promise).toEqual(DELETED_FURNITURE_CARD_RESPONSE);
        });
    });

    function assertParams(requestBody: any, expected: Record<string, any>) {
        Object.entries(expected).forEach(([key, value]) => {
            expect(requestBody[key]).toBe(value);
        });
    }
});
