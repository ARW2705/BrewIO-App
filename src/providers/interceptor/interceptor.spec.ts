import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';

import { AuthorizedInterceptor, UnauthorizedInterceptor } from './interceptor';
import { AuthenticationProvider } from '../authentication/authentication';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

import { StorageMock, HttpMock } from '../../../test-config/mocks-ionic';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

describe('HTTP Interceptor service', () => {
  let injector;
  let httpMock;
  let authService;
  let mockHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        AuthenticationProvider,
        ProcessHttpErrorProvider,
        HttpMock,
        { provide: Storage, useValue: StorageMock },
        { provide: HTTP_INTERCEPTORS, useClass: AuthorizedInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: UnauthorizedInterceptor, multi: true}
      ]
    });

    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    authService = injector.get(AuthenticationProvider);
    mockHttpService = injector.get(HttpMock);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Authorized interceptor', () => {

    beforeEach(() => {
      authService.authToken = 'testtoken';
    });

    test('should have authorization header with token', done => {
      const mockResponse = {
        status: 200,
        statusText: 'OK'
      };

      mockHttpService.get().subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('testtoken');
      req.flush(mockResponse);
    });

  });

  describe('Unauthorized interceptor', () => {

    test('should have authorization header of undefined', done => {
      const mockErrorResponse = {
        status: 401,
        statusText: 'Unauthorized'
      };

      mockHttpService.get().subscribe(response => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');
      req.flush(mockErrorResponse);
    });

  });

});
