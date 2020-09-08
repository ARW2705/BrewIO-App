/* Module Imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Constant imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

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
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthorizedInterceptor,
          multi: true
        },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: UnauthorizedInterceptor,
          multi: true
        }
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
      const _mockUser: User = mockUser();
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));
      userService.getToken = jest
        .fn()
        .mockReturnValue(_mockUser.token);
    });

    test('should have authorization header with token', done => {
      const mockResponse: object = {
        status: 200,
        statusText: 'OK'
      };

      mockHttpService.get()
        .subscribe(response => {
          expect(response).toBeTruthy();
          done();
        });

      const req: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/mock`);

      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization'))
        .toMatch('bearer testtoken');

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

    test('should have authorization header of undefined and 401 error (logged in)', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          (response: any): void => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          (error: object): void => {
            expect(error['status']).toEqual(401);
            expect(error['statusText']).toMatch('Not Authorized');
            expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0])
              .toMatch('Not Authorized. Please log in');
            done();
          }
        );

      const req: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/mock`);

      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');

      req.flush(null, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should have authorization header of undefined and 401 error (logged in)' test

    test('should have authorization header of undefined and 401 error (not logged in)', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          (response: any): void => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          (error: object): void => {
            expect(error['status']).toEqual(401);
            expect(error['statusText']).toMatch('Not Authorized');
            expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0])
              .toMatch('Authorization Error');
            done();
          }
        );

      const req: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/mock`);

      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');

      req.flush(null, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should have authorization header of undefined and 401 error (not logged in)' test

    test('should have authorization header of undefined and a non-401 error', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      mockHttpService.get()
        .subscribe(
          (response: any): void => {
            console.log('Should have no response', response);
            expect(true).toBe(false);
            done();
          },
          (error: object): void => {
            expect(error['status']).toEqual(400);
            expect(error['statusText']).toMatch('Bad Request');
            expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0])
              .toMatch('An unexpected error occured: <400> Bad Request');
            done();
          }
        );

      const req: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/mock`);

      expect(req.request.headers.has('Authorization')).toBeTruthy();
      expect(req.request.headers.get('Authorization')).toMatch('undefined');

      req.flush(null, mockErrorResponse(400, 'Bad Request'));
    }); // end 'should have authorization header of undefined and a non-401 error' test

  }); // end 'Unauthorized interceptor' section

});
