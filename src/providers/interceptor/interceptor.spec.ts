/* Module Imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Constant imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Interface imports */
import { User } from '../../shared/interfaces/user';

/* Mock imports */
import { HttpMock } from '../../../test-config/mocks-ionic';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';

/* Provider imports */
import { AuthorizedInterceptor, UnauthorizedInterceptor } from './interceptor';
import { UserProvider } from '../user/user';
import { ToastProvider } from '../toast/toast';


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
        HttpClientTestingModule
      ],
      providers: [
        HttpMock,
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: HTTP_INTERCEPTORS, useClass: AuthorizedInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: UnauthorizedInterceptor, multi: true}
      ]
    });
  }));

  beforeAll(async(() => {
    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
    userService = injector.get(UserProvider);
    mockHttpService = injector.get(HttpMock);
    toastService = injector.get(ToastProvider);

    toastService.presentToast = jest
      .fn();
  }));

  afterEach(() => {
    httpMock.verify();
  });

  describe('Authorized interceptor', () => {

    beforeAll(() => {
      const _mockUser = mockUser();
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));
      userService.getToken = jest
        .fn()
        .mockReturnValue(_mockUser.token);
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

    beforeEach(() => {
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(null));
      userService.getToken = jest
        .fn()
        .mockReturnValue(undefined);
    });

    test('should have authorization header of undefined and 401 error', done => {
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          response => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error.status).toBe(401);
            expect(error.statusText).toMatch('Not Authorized');
            expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0]).toMatch('Not Authorized. Please log in');
            done();
          }
        );

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');
      req.flush(null, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should have authorization header of undefined and 401 error' test

    test('should have authorization header of undefined and a non-401 error', done => {
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          response => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error.status).toBe(400);
            expect(error.statusText).toMatch('Bad Request');
            expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0]).toMatch('An unexpected error occured: <400> Bad Request');
            done();
          }
        );

      const req = httpMock.expectOne(`${baseURL}/${apiVersion}/mock`);
      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');
      req.flush(null, mockErrorResponse(400, 'Bad Request'));
    }); // end 'should have authorization header of undefined and a non-401 error' test

  }); // end 'Unauthorized interceptor' section

});
