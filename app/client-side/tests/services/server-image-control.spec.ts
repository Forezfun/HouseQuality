import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ServerImageControlService } from '../../../client-side/services/server-image-control.service';
import { BASE_URL,JWT,FURNITURE_ID,COLOR,MOCK_IMAGE_FILE } from './mock-data';
import { provideHttpClient } from '@angular/common/http';

const mockImages = [MOCK_IMAGE_FILE, MOCK_IMAGE_FILE];

const IMAGE_DATA = {
  idMainImage: 1,
  images: mockImages
};

describe('ServerImageControlService', () => {
  let service: ServerImageControlService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ServerImageControlService,
        provideHttpClient(),
        provideHttpClientTesting()
    ]
    });
    service = TestBed.inject(ServerImageControlService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should upload user avatar', async () => {
    const promise = service.POSTuploadUserAvatar(MOCK_IMAGE_FILE, JWT);

    const req = httpMock.expectOne(`${BASE_URL}avatar/upload?jwt=${JWT}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.has('image')).toBeTrue();

    req.flush({ message: 'success' });

    await expectAsync(promise).toBeResolvedTo({ message: 'success' });
  });

  it('should upload project images', async () => {
    const promise = service.POSTuploadProjectImages(COLOR, IMAGE_DATA, JWT, FURNITURE_ID);

    const req = httpMock.expectOne(`${BASE_URL}furniture/images/upload/images?furnitureCardId=${FURNITURE_ID}&color=${COLOR}&idMainImage=1&jwt=${JWT}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.getAll('images').length).toBe(2);

    req.flush({ message: 'uploaded' });

    await expectAsync(promise).toBeResolvedTo({ message: 'uploaded' });
  });

  it('should delete project color', async () => {
    const promise = service.DELETEprojectColor(JWT, FURNITURE_ID, COLOR);

    const req = httpMock.expectOne(`${BASE_URL}furniture/images/delete/color?jwt=${JWT}&furnitureCardId=${FURNITURE_ID}&color=${COLOR}`);
    expect(req.request.method).toBe('DELETE');

    req.flush({ message: 'deleted color' });

    await expectAsync(promise).toBeResolvedTo({ message: 'deleted color' });
  });

  it('should delete project', async () => {
    const promise = service.DELETEproject(JWT, FURNITURE_ID);

    const req = httpMock.expectOne(`${BASE_URL}furniture/images/delete/project?jwt=${JWT}&furnitureCardId=${FURNITURE_ID}`);
    expect(req.request.method).toBe('DELETE');

    req.flush({ message: 'project deleted' });

    await expectAsync(promise).toBeResolvedTo({ message: 'project deleted' });
  });

  it('should get all project images', async () => {
    const promise = service.GETallProjectImages(FURNITURE_ID, COLOR);

    const req = httpMock.expectOne(`${BASE_URL}furniture/images/all?furnitureCardId=${FURNITURE_ID}&color=${COLOR}`);
    expect(req.request.method).toBe('GET');

    req.flush({ imagesURLS: ['img1.jpg'], idMainImage: 0 });

    await expectAsync(promise).toBeResolvedTo({ imagesURLS: ['img1.jpg'], idMainImage: 0 });
  });

  it('should get avatar and main image URLs', () => {
    const avatarUrl = service.GETaccountAvatar(JWT);
    const mainImageUrl = service.GETmainImage(FURNITURE_ID, COLOR);

    expect(avatarUrl).toBe(`${BASE_URL}avatar?jwt=${JWT}`);
    expect(mainImageUrl).toBe(`${BASE_URL}furniture/images/main?furnitureCardId=${FURNITURE_ID}&color=${COLOR}`);
  });

  it('should handle POSTuploadUserAvatar error', async () => {
    const promise = service.POSTuploadUserAvatar(MOCK_IMAGE_FILE, JWT);
    const req = httpMock.expectOne(`${BASE_URL}avatar/upload?jwt=${JWT}`);
    req.flush('upload error', { status: 500, statusText: 'Server Error' });
    await expectAsync(promise).toBeRejected();
  });
});
