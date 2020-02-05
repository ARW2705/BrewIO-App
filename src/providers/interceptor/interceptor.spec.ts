/* Module Imports */
import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';

/* Constant imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Mock imports */
import { StorageMock, HttpMock } from '../../../test-config/mocks-ionic';
import { mockUser } from '../../../test-config/mockmodels/mockUser';

/* Provider imports */
import { AuthorizedInterceptor, UnauthorizedInterceptor } from './interceptor';
import { UserProvider } from '../user/user';
import { ProcessProvider } from '../process/process';
import { RecipeProvider } from '../recipe/recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';


describe('HTTP Interceptor service', () => {
  let injector;
  let httpMock;
  let userService;
  let mockHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        UserProvider,
        ProcessProvider,
        RecipeProvider,
        ProcessHttpErrorProvider,
        HttpMock,
        { provide: Storage, useClass: StorageMock },
        { provide: HTTP_INTERCEPTORS, useClass: AuthorizedInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: UnauthorizedInterceptor, multi: true}
      ]
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    userService = injector.get(UserProvider);
    mockHttpService = injector.get(HttpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Authorized interceptor', () => {

    beforeEach(() => {
      userService.getUser().next(mockUser());
    });

    test('should have authorization header with token', done => {
      const mockResponse = {
        status: 200,
        statusText: 'OK'
      };

      mockHttpService.get()
        .subscribe(response => {
          expect(response).toBeTruthy();
          done();
        });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('testtoken');
      req.flush(mockResponse);
    }); // end 'should have authorization header with token' test

  }); // end 'Authorized interceptor' section

  describe('Unauthorized interceptor', () => {

    test('should have authorization header of undefined', done => {
      const mockErrorResponse = {
        status: 401,
        statusText: 'Unauthorized'
      };

      mockHttpService.get()
        .subscribe(response => {
          expect(response).toBeTruthy();
          done();
        });

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');
      req.flush(mockErrorResponse);
    }); // end 'should have authorization header of undefined' test

  }); // end 'Unauthorized interceptor' section

});
