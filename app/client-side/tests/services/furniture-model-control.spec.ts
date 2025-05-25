import { TestBed, inject } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FurnitureModelControlService } from '../../src/services/furniture-model-control.service';
import { BASE_URL, FURNITURE_ID, JWT, MODEL_FILE } from './mock-data';


const BASE_SERVICE_URL = BASE_URL + 'furniture/model';

(Object.defineProperty(MODEL_FILE, 'name', { value: 'model.glb' }));

describe('FurnitureModelControlService', () => {
  let service: FurnitureModelControlService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FurnitureModelControlService,
        { provide: 'baseUrl', useValue: BASE_URL },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FurnitureModelControlService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('DELETEfurnitureModel', () => {
    it('should delete model and return message', async () => {
      const response = { message: 'Delete successful' };

      const promise = service.DELETEfurnitureModel(JWT, FURNITURE_ID);

      const req = httpMock.expectOne(
        `${BASE_SERVICE_URL}?jwt=${JWT}&furnitureCardId=${FURNITURE_ID}`
      );
      expect(req.request.method).toBe('DELETE');

      req.flush(response);
      expect(await promise).toEqual(response);
    });
  });
});
