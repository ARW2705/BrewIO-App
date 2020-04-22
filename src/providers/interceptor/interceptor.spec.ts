/* Module Imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpErrorResponse } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage';
import { Events, ToastController } from 'ionic-angular';

/* Constant imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { HttpMock, ToastControllerMock } from '../../../test-config/mocks-ionic';
import { mockUser } from '../../../test-config/mockmodels/mockUser';

/* Provider imports */
import { AuthorizedInterceptor, UnauthorizedInterceptor } from './interceptor';
import { UserProvider } from '../user/user';
import { ProcessProvider } from '../process/process';
import { RecipeProvider } from '../recipe/recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';
import { ToastProvider } from '../toast/toast';
import { PreferencesProvider } from '../preferences/preferences';


describe('HTTP Interceptor service', () => {
  let injector: TestBed;
  let httpMock: HttpTestingController;
  let userService: UserProvider;
  let mockHttpService: HttpMock;
  let toastService: ToastProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        UserProvider,
        HttpMock,
        Events,
        ToastProvider,
        { provide: ProcessProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: ConnectionProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} },
        { provide: ToastController, useClass: ToastControllerMock },
        { provide: HTTP_INTERCEPTORS, useClass: AuthorizedInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: UnauthorizedInterceptor, multi: true}
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    userService = injector.get(UserProvider);
    mockHttpService = injector.get(HttpMock);
    toastService = injector.get(ToastProvider);
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
      expect(req.request.headers.get('Authorization')).toMatch('bearer testtoken');
      req.flush(mockResponse);
    }); // end 'should have authorization header with token' test

  }); // end 'Authorized interceptor' section

  describe('Unauthorized interceptor', () => {

    test('should have authorization header of undefined and 401 error', done => {
      const mockErrorResponse: HttpErrorResponse = new HttpErrorResponse({
        status: 401,
        statusText: 'Not Authorized'
      });
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          response => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error.status).toBe(mockErrorResponse.status);
            expect(error.statusText).toMatch(mockErrorResponse.statusText);
            expect(toastSpy.mock.calls[0][0]).toMatch('Not Authorized. Please log in');
            done();
          }
        );

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');
      req.flush({}, mockErrorResponse);
    }); // end 'should have authorization header of undefined and 401 error' test

    test('should have authorization header of undefined and a non-401 error', done => {
      const mockErrorResponse: HttpErrorResponse = new HttpErrorResponse({
        status: 400,
        statusText: 'Bad Request'
      });
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          response => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error.status).toBe(mockErrorResponse.status);
            expect(error.statusText).toMatch(mockErrorResponse.statusText);
            expect(toastSpy.mock.calls[0][0]).toMatch(`An unexpected error occured: <${mockErrorResponse.status}> ${mockErrorResponse.statusText}`);
            done();
          }
        );

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');
      req.flush(null, mockErrorResponse);
    }); // end 'should have authorization header of undefined and a non-401 error' test

  }); // end 'Unauthorized interceptor' section

});
