import { TestBed, inject } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { FurnitureModelControlService } from '../../src/services/furniture-model-control.service';
import { BASE_URL,FURNITURE_ID,JWT, MODEL_BLOB } from './mock-data';


const BASE_SERVICE_URL = BASE_URL + 'furniture/model';

(Object.defineProperty(MODEL_BLOB, 'name', { value: 'model.glb' }));

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

  describe('GETfurnitureModel', () => {
    it('should return a Blob with model file', async () => {
      const promise = service.GETfurnitureModel(JWT, FURNITURE_ID);

      const req = httpMock.expectOne(
        `${BASE_SERVICE_URL}?jwt=${JWT}&furnitureCardId=${FURNITURE_ID}`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');

      req.flush(MODEL_BLOB);
      const result = await promise;
      expect(result).toEqual(MODEL_BLOB);
    });
  });

  describe('POSTuploadFurnitureModel', () => {
    it('should upload model and return message', async () => {
      const response = { message: 'Upload successful' };

      const promise = service.POSTuploadFurnitureModel(MODEL_BLOB, JWT, FURNITURE_ID);

      const req = httpMock.expectOne(
        `${BASE_SERVICE_URL}?jwt=${JWT}&furnitureCardId=${FURNITURE_ID}&fileName=model.glb`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).has('model')).toBeTrue();

      req.flush(response);
      expect(await promise).toEqual(response);
    });
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
