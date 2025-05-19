import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FinderService } from '../../services/finder.service';
import { BASE_URL, QUERY, NON_EXISTENT_QUERY, MOCK_FURNITURE_RESPONSE, EMPTY_FURNITURE_RESPONSE} from './mock-data';
import { provideHttpClient } from '@angular/common/http';

describe('FinderService', () => {
    let service: FinderService;
    let httpMock: HttpTestingController;
    const BASE_URL_WITH_QUERY = BASE_URL + 'finder?q=';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FinderService,
                { provide: 'baseUrl', useValue: BASE_URL },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(FinderService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('GETfindFurnitures', () => {
        it('should return furniture data on valid query', async () => {
            const promise = service.GETfindFurnitures(QUERY);

            const req = httpMock.expectOne(BASE_URL_WITH_QUERY + QUERY);
            expect(req.request.method).toBe('GET');

            req.flush(MOCK_FURNITURE_RESPONSE);
            expect(await promise).toEqual(MOCK_FURNITURE_RESPONSE);
        });

        it('should handle error if server fails', async () => {
            const promise = service.GETfindFurnitures(QUERY);

            const req = httpMock.expectOne(BASE_URL_WITH_QUERY + QUERY);
            expect(req.request.method).toBe('GET');

            req.error(new ProgressEvent('Network error'));

            try {
                await promise;
                fail('Expected error to be thrown');
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        it('should handle empty result from server', async () => {
            const promise = service.GETfindFurnitures(NON_EXISTENT_QUERY);

            const req = httpMock.expectOne(BASE_URL_WITH_QUERY + NON_EXISTENT_QUERY);
            expect(req.request.method).toBe('GET');

            req.flush(EMPTY_FURNITURE_RESPONSE);

            expect(await promise).toEqual(EMPTY_FURNITURE_RESPONSE);
        });
    });
});
