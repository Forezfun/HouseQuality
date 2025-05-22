import { TestBed } from '@angular/core/testing';
import { ProjectService } from '../../src/services/project.service';
import { provideHttpClient, HttpParams } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BASE_URL, PROJECT_ID, PROJECT_NAME, JWT } from './mock-data';
import { ReportService } from '../../src/services/report.service';

const BASE_SERVICE_URL = BASE_URL + 'project';

describe('ProjectService', () => {
    let service: ProjectService;
    let httpMock: HttpTestingController;
    let reportServiceSpy: jasmine.SpyObj<ReportService>;



    const MOCK_PROJECT = {
        _id: PROJECT_ID,
        authorId: 'author123',
        name: PROJECT_NAME,
        rooms: []
    };

    beforeEach(() => {
        reportServiceSpy = jasmine.createSpyObj('ReportService', ['createReport']);

        TestBed.configureTestingModule({
            providers: [
                ProjectService,
                { provide: ReportService, useValue: reportServiceSpy },
                provideHttpClient(),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(ProjectService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should create a new project', async () => {
        const promise = service.POSTcreateProject(JWT, PROJECT_NAME);

        const req = httpMock.expectOne(BASE_SERVICE_URL);
        expect(req.request.method).toBe('POST');

        const params = req.request.body as HttpParams;
        expect(params.get('jwt')).toBe(JWT);
        expect(params.get('name')).toBe(PROJECT_NAME);

        req.flush({ projectData: MOCK_PROJECT });

        expect(await promise).toEqual({ projectData: MOCK_PROJECT });
    });

    it('should delete a project', async () => {
        const promise = service.DELETEdeleteProject(JWT, PROJECT_ID);

        const req = httpMock.expectOne(`${BASE_SERVICE_URL}?jwt=${JWT}&projectId=${PROJECT_ID}`);
        expect(req.request.method).toBe('DELETE');

        req.flush({ message: 'Project deleted' });
        expect(await promise).toEqual({ message: 'Project deleted' });
    });

    it('should get a project by ID', async () => {
        const promise = service.GETgetProject(JWT, PROJECT_ID);

        const req = httpMock.expectOne(`${BASE_SERVICE_URL}?jwt=${JWT}&projectId=${PROJECT_ID}`);
        expect(req.request.method).toBe('GET');

        req.flush({ projectData: MOCK_PROJECT });
        expect(await promise).toEqual({ projectData: MOCK_PROJECT });
    });

    it('should update a project', async () => {
        const projectData = {
            name: PROJECT_NAME,
            rooms: []
        };
        const promise = service.PUTupdateProject(JWT, PROJECT_ID, projectData);

        const req = httpMock.expectOne(req =>
            req.method === 'PUT' &&
            req.url === BASE_SERVICE_URL &&
            req.params.get('jwt') === JWT &&
            req.params.get('projectId') === PROJECT_ID
        );

        expect(req.request.body).toEqual(projectData);

        req.flush({ message: 'Updated successfully' });
        expect(await promise).toEqual({ message: 'Updated successfully' });
    });


    it('should handle GETgetProject error', async () => {
        const promise = service.GETgetProject(JWT, PROJECT_ID);

        const expectedUrl = `${BASE_SERVICE_URL}?jwt=${JWT}&projectId=${PROJECT_ID}`;

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');

        req.error(new ProgressEvent('Network error'));
        try {
            await promise;
            fail('Expected error to be thrown');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });

    it('should handle POSTcreateProject error', async () => {
        const promise = service.POSTcreateProject(JWT, PROJECT_NAME);

        const req = httpMock.expectOne(BASE_SERVICE_URL);
        expect(req.request.method).toBe('POST');

        req.error(new ProgressEvent('Network error'));
        try {
            await promise;
            fail('Expected error to be thrown');
        } catch (error) {
            expect(error).toBeDefined();
        }
    });
});
