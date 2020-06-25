/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockUserLogin } from '../../../test-config/mockmodels/mockUserLogin';
import { mockLoginResponse } from '../../../test-config/mockmodels/mockLoginResponse';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { mockJWTSuccess, mockJWTFailed } from '../../../test-config/mockmodels/mockJWTResponse';
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Provider imports */
import { UserProvider } from './user';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';
import { PreferencesProvider } from '../preferences/preferences';

describe('User Service', () => {
  let injector: TestBed;
  let userService: UserProvider;
  let connectionService: ConnectionProvider;
  let processHttpError: ProcessHttpErrorProvider;
  let storage: StorageProvider;
  let preferenceService: PreferencesProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        UserProvider,
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: ConnectionProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} },
        { provide: Events, useClass: EventsMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
    connectionService = injector.get(ConnectionProvider);
    httpMock = injector.get(HttpTestingController);
    processHttpError = injector.get(ProcessHttpErrorProvider);
    storage = injector.get(StorageProvider);
    preferenceService = injector.get(PreferencesProvider);

    connectionService.setOfflineMode = jest
      .fn();
    preferenceService.setUnits = jest
      .fn();
    storage.removeUser = jest
      .fn();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('User is not logged in', () => {

    test('should be logged out', () => {
      expect(userService.isLoggedIn()).toBe(false);
    }); // end 'should be logged out' test

    test('should have \'offline\' as id', () => {
      userService.getUser()
        .subscribe(user => {
          expect(user._id).toBeUndefined();
        });
    }); // end 'should have undefined as id' test

    test('should have undefined as token', () => {
      expect(userService.getToken()).toBeUndefined();
    }); // end 'should have undefined as token' test

    test('should log out', () => {
      userService.clearUserData = jest
        .fn();

      const connectionSpy = jest.spyOn(connectionService, 'setOfflineMode');
      const clearSpy = jest.spyOn(userService, 'clearUserData');

      userService.logOut();

      expect(connectionSpy).toHaveBeenCalledWith(true);
      expect(clearSpy).toHaveBeenCalled();
    }); // end 'should log out' test

    test('should fail to log in', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<401> Not Authorized'));

      userService.logIn({username: '', password: '', remember: false}, false)
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error).toMatch(`<401> Not Authorized`)
            done();
          }
        );

        const additionalErrorData = {
          error: {
            name: 'Authentication Error',
            message: 'Unauthorized'
          }
        }

        const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
        expect(loginReq.request.method).toMatch('POST');
        loginReq.flush(null, mockErrorResponse(401, 'Not Authorized', additionalErrorData));
    }); //  end 'should fail to log in' test

    test('should load a registered user with valid token from storage', done => {
      const _mockUser = mockUser();

      storage.getUser = jest
        .fn()
        .mockReturnValue(of(_mockUser));

      const checkSpy = jest.spyOn(userService, 'checkJWToken');
      const consoleSpy = jest.spyOn(console, 'log');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(checkSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('success');
        done();
      }, 10);

      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush({status: 'success', success: true, user: _mockUser});
    }); // end 'should load a registered user with valid token from storage' test

    test('should load a registered user with invalid token from storage', done => {
      storage.getUser = jest
        .fn()
        .mockReturnValue(of(mockUser()));

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<401> Not Authorized'));

      const checkSpy = jest.spyOn(userService, 'checkJWToken');
      const consoleSpy = jest.spyOn(console, 'log');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(checkSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('<401> Not Authorized');
        expect(userService.user$.value.token).toBeUndefined();
        done();
      }, 10);

      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush(null, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should load a registered user with invalid token from storage' test

    test('should load an offline user from storage', done => {
      const _mockUser = mockUser();
      _mockUser.token = undefined;

      storage.getUser = jest
        .fn()
        .mockReturnValue(of(_mockUser));

      const setOfflineSpy = jest.spyOn(connectionService, 'setOfflineMode');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(setOfflineSpy).toHaveBeenCalledWith(true);
        done();
      }, 10);
    }); // end 'should load an offline user from storage' test

    test('should fail to load a user from storage', done => {
      storage.getUser = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error'));

      const consoleSpy = jest.spyOn(console, 'log');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('user load error');
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][1]).toMatch('error');
        done();
      }, 10);
    }); // end 'should fail to load a user from storage' test

  }); // end 'User is not logged in' section

  describe('User is logged in', () => {

    test('should log in', done => {
      userService.logIn(mockUserLogin(), false)
        .subscribe(_response => {
          expect(userService.isLoggedIn()).toBe(true);
          done();
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should log in' test

    test('should successfully store a user on login', done => {
      storage.setUser = jest
        .fn()
        .mockReturnValue(of({}));

      const _mockUserLogin = mockUserLogin();
      _mockUserLogin.remember = true;

      const consoleSpy = jest.spyOn(console, 'log');

      userService.logIn(_mockUserLogin, false)
        .subscribe(_response => {
          setTimeout(() => {
            expect(userService.isLoggedIn()).toBe(true);
            expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('stored user data');
            done();
          }, 10);
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should successfully store a user on login' test

    test('should fail to store a user on login', done => {
      const _mockUserLogin = mockUserLogin();
      _mockUserLogin.remember = true;

      storage.setUser = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Failed to store user'));

      const consoleSpy = jest.spyOn(console, 'log');

      userService.logIn(_mockUserLogin, false)
        .subscribe(() => {
          setTimeout(() => {
            expect(userService.isLoggedIn()).toBe(true);
            expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('user store error');
            expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][1]).toMatch('Failed to store user');
            done();
          }, 10);
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should fail to store a user on login' test

    test('should have token', done => {
      userService.logIn(mockUserLogin(), false)
        .subscribe(_response => {
          expect(userService.getToken()).toMatch(mockUser().token);
          done();
        });

        const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
        loginReq.flush(mockLoginResponse());
    }); // end 'should have token' test

    test('should have user data', done => {
      const _mockUser = mockUser();

      userService.logIn(mockUserLogin(), false)
        .subscribe(_ => {
          userService.getUser()
            .subscribe(user => {
              expect(user.username).toMatch(_mockUser.username);
              expect(user.email).toMatch(_mockUser.email);
              expect(user.friendList.length).toBe(2);
              done();
            });
        });

        const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
        loginReq.flush(mockLoginResponse());
    }); // end 'should have user data' test

    test('should clear user data', done => {
      userService.logIn(mockUserLogin(), false)
        .subscribe(_ => {
          userService.getUser()
            .subscribe(user => {
              if (userService.isLoggedIn()) {
                expect(user.username.length).toBeGreaterThan(0);
              } else {
                expect(user.username).toMatch('');
                done();
              }
            });
          userService.clearUserData();
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse());
    }); // end ''should clear user data'' test

    test('should succeed jwt check', done => {
      userService.checkJWToken()
        .subscribe((jwtResponse: any) => {
          expect(jwtResponse.success).toBe(true);
          done();
        });

      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush(mockJWTSuccess());
    }); // end 'should succeed jwt check' test

    test('should fail jwt check', done => {
      const _mockJWTFailed = mockJWTFailed();
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<401> Not Authorized'));

      userService.checkJWToken()
        .subscribe(
          (res) => { console.log('shouldnt be here', res) },
          (jwtErrorResponse: any) => {
            console.log(jwtErrorResponse);
            expect(jwtErrorResponse).toMatch('<401> Not Authorized');
            done();
          }
        );

      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush(_mockJWTFailed, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should fail jwt check' test

  }); // end 'User is logged in' section

  describe('User sign up', () => {

    test('should sign up', done => {
      userService.signUp(mockUserLogin())
        .subscribe(signup => {
          expect(signup.success).toBe(true);
          done();
        });

      const signupReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/signup`);
      signupReq.flush({success: true});

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse());
    }); // end 'should sign up' test

    test('should fail signup', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      userService.signUp(mockUserLogin())
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error).toMatch('<404> User not found');
            done();
          }
        );

      const signupReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/signup`);
      signupReq.flush(null, mockErrorResponse(404, 'User not found'));
    }); // end 'should fail signup' test

  }); // end 'User sign up' section

  describe('Profile update', () => {

    test('should update profile', done => {
      userService.getUser()
        .skip(2)
        .subscribe(user => {
          expect(user.username).toMatch('mock');
          expect(user['shouldIgnore']).toBeUndefined();
          done();
        });

      userService.logIn(mockUserLogin(), false)
        .subscribe(user => {
          user.username = 'mock';
          userService.updateUserProfile(user)
            .subscribe(_ => {});
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse());

      const updateReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/profile`);
      const _updatedMockUser = mockUser();
      _updatedMockUser.username = 'mock';
      _updatedMockUser['shouldIgnore'] = true;
      updateReq.flush(_updatedMockUser);
    }); // end 'should update profile' test

    test('should get error response on profile update', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      userService.updateUserProfile({})
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
            done();
          },
          error => {
            expect(error).toMatch('<404> User not found');
            done();
          }
        );

      const updateReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/profile`);
      updateReq.flush(null, mockErrorResponse(404, 'User not found'));
    });

  }); // end 'Profile update' section

});
