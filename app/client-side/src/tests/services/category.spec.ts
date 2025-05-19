import { TestBed } from "@angular/core/testing";
import { CategoryService } from "../../services/category.service";
import { BASE_URL, CATEGORY_RESPONSE } from "./mock-data";
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('CategoryService ', () => {
    let service: CategoryService;
    let httpMock: jasmine.SpyObj<HttpClient>;
    const BASE = BASE_URL + 'category';

    beforeEach(() => {
        
        httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        TestBed.configureTestingModule({
            providers: [
                CategoryService,
                { provide: HttpClient, useValue: httpMock }
            ]
        });

        service = TestBed.inject(CategoryService);
    });

    describe('getAllCategories', () => {

        it('should return category array', async () => {
            httpMock.get.and.returnValue(of(CATEGORY_RESPONSE)); 

            const result = await service.GETgetAllCategories();

            expect(result).toEqual(CATEGORY_RESPONSE);
            expect(httpMock.get).toHaveBeenCalledOnceWith(BASE)
        });

        it('should handle server error response', async () => {
            const errorMessage = 'Server error';
            const httpErrorResponse = new HttpErrorResponse({
                error: new Error(errorMessage),
                status: 500,
                statusText: 'Server Error',
                url: BASE
            });

            httpMock.get.and.returnValue(throwError(() => httpErrorResponse)); 

            try {
                await service.GETgetAllCategories();
            } catch (error: unknown) {
                if (error instanceof HttpErrorResponse) {
                    expect(error.message).toBe('Http failure response for ' + BASE + ': 500 Server Error');
                    expect(error.error.message).toBe(errorMessage);  
                } else {
                    fail('Expected error to be an instance of HttpErrorResponse');
                }
            }
        });

        it('should handle network error', async () => {
            const errorMessage = 'Network error';
            const networkError = new ErrorEvent('NetworkError', { message: errorMessage });

            httpMock.get.and.returnValue(throwError(() => networkError)); 

            try {
                await service.GETgetAllCategories();
            } catch (error: unknown) {
                if (error instanceof ErrorEvent) {
                    expect(error.message).toBe(errorMessage);  
                } else {
                    fail('Expected error to be an instance of ErrorEvent');
                }
            }
        });

    });

});
