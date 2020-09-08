/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { BASE_URL } from '../../shared/constants/base-url';
import { API_VERSION } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { mockJWTSuccess, mockJWTFailed } from '../../../test-config/mockmodels/mockJWTResponse';
import { mockLoginResponse } from '../../../test-config/mockmodels/mockLoginResponse';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockUserLogin } from '../../../test-config/mockmodels/mockUserLogin';
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { LoginCredentials } from '../../shared/interfaces/login-credentials';
import { User } from '../../shared/interfaces/user';
import { UserResponse } from '../../shared/interfaces/user-response';

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

    test('should have \'offline\' as id', done => {
      userService.getUser()
        .subscribe(
          (user: User): void => {
            expect(user._id).toBeUndefined();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should have undefined as id' test

    test('should have undefined as token', () => {
      expect(userService.getToken()).toBeUndefined();
    }); // end 'should have undefined as token' test

    test('should log out', () => {
      userService.clearUserData = jest
        .fn();

      const connectionSpy: jest.SpyInstance = jest
        .spyOn(connectionService, 'setOfflineMode');
      const clearSpy: jest.SpyInstance = jest
        .spyOn(userService, 'clearUserData');

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
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch(`<401> Not Authorized`)
            done();
          }
        );

        const additionalErrorData: object = {
          error: {
            name: 'Authentication Error',
            message: 'Unauthorized'
          }
        }

        const loginReq = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
        expect(loginReq.request.method).toMatch('POST');
        loginReq
          .flush(
            null,
            mockErrorResponse(401, 'Not Authorized', additionalErrorData)
          );
    }); //  end 'should fail to log in' test

    test('should load a registered user with valid token from storage', done => {
      const _mockUser: User = mockUser();

      storage.getUser = jest
        .fn()
        .mockReturnValue(of(_mockUser));

      const checkSpy: jest.SpyInstance = jest.spyOn(userService, 'checkJWToken');
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(checkSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('success');
        done();
      }, 10);

      const jwtReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/checkJWToken`);
      expect(jwtReq.request.method).toMatch('GET')
      jwtReq.flush({status: 'success', success: true, user: _mockUser});
    }); // end 'should load a registered user with valid token from storage' test

    test('should load a registered user with invalid token from storage', done => {
      storage.getUser = jest
        .fn()
        .mockReturnValue(of(mockUser()));

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<401> Not Authorized'));

      const checkSpy: jest.SpyInstance = jest.spyOn(userService, 'checkJWToken');
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(checkSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('<401> Not Authorized');
        expect(userService.user$.value.token).toBeUndefined();
        done();
      }, 10);

      const jwtReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/checkJWToken`);
      expect(jwtReq.request.method).toMatch('GET');
      jwtReq.flush(null, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should load a registered user with invalid token from storage' test

    test('should load an offline user from storage', done => {
      const _mockUser: User = mockUser();
      _mockUser.token = undefined;

      storage.getUser = jest
        .fn()
        .mockReturnValue(of(_mockUser));

      const setOfflineSpy: jest.SpyInstance = jest
        .spyOn(connectionService, 'setOfflineMode');

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

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      userService.loadUserFromStorage();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('User load error: error');
        done();
      }, 10);
    }); // end 'should fail to load a user from storage' test

  }); // end 'User is not logged in' section

  describe('User is logged in', () => {

    test('should log in', done => {
      userService.logIn(mockUserLogin(), false)
        .subscribe(
          () => {
            expect(userService.isLoggedIn()).toBe(true);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const loginReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should log in' test

    test('should successfully store a user on login', done => {
      storage.setUser = jest
        .fn()
        .mockReturnValue(of({}));

      const _mockUserLogin: LoginCredentials = mockUserLogin();
      _mockUserLogin.remember = true;

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      userService.logIn(_mockUserLogin, false)
        .subscribe(
          (): void => {
            expect(userService.isLoggedIn()).toBe(true);
            expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
              .toMatch('stored user data');
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const loginReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should successfully store a user on login' test

    test('should fail to store a user on login', done => {
      const _mockUserLogin: LoginCredentials = mockUserLogin();
      _mockUserLogin.remember = true;

      storage.setUser = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Failed to store user'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      userService.logIn(_mockUserLogin, false)
        .subscribe(
          (): void => {
            expect(userService.isLoggedIn()).toBe(true);
            expect(consoleSpy)
              .toHaveBeenCalledWith('User store error: Failed to store user');
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const loginReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should fail to store a user on login' test

    test('should have token', done => {
      userService.logIn(mockUserLogin(), false)
        .subscribe(
          (): void => {
            expect(userService.getToken()).toMatch(mockUser().token);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

        const loginReq: TestRequest = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
        expect(loginReq.request.method).toMatch('POST');
        loginReq.flush(mockLoginResponse());
    }); // end 'should have token' test

    test('should have user data', done => {
      const _mockUser: User = mockUser();

      userService.logIn(mockUserLogin(), false)
        .subscribe(
          (): void => {
            userService.getUser()
              .subscribe(
                (user: User): void => {
                  expect(user.username).toMatch(_mockUser.username);
                  expect(user.email).toMatch(_mockUser.email);
                  expect(user.friendList.length).toBe(2);
                  done();
                },
                (error: any): void => {
                  console.log('Internal test error', error);
                  expect(true).toBe(false);
                }
              );
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

        const loginReq: TestRequest = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
        expect(loginReq.request.method).toMatch('POST');
        loginReq.flush(mockLoginResponse());
    }); // end 'should have user data' test

    test('should clear user data', done => {
      userService.logIn(mockUserLogin(), false)
        .subscribe(
          (): void => {
            userService.getUser()
              .subscribe(
                (user: User): void => {
                  if (userService.isLoggedIn()) {
                    expect(user.username.length).toBeGreaterThan(0);
                  } else {
                    expect(user.username).toMatch('');
                    done();
                  }
                },
                (error: any): void => {
                  console.log('Internal test error', error);
                  expect(true).toBe(false);
                }
              );
            userService.clearUserData();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const loginReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end ''should clear user data'' test

    test('should succeed jwt check', done => {
      userService.checkJWToken()
        .subscribe(
          (jwtResponse: UserResponse): void => {
            expect(jwtResponse.success).toBe(true);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const jwtReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/checkJWToken`);
      expect(jwtReq.request.method).toMatch('GET');
      jwtReq.flush(mockJWTSuccess());
    }); // end 'should succeed jwt check' test

    test('should fail jwt check', done => {
      const _mockJWTFailed: UserResponse = mockJWTFailed();
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<401> Not Authorized'));

      userService.checkJWToken()
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (jwtErrorResponse: string): void => {
            expect(jwtErrorResponse).toMatch('<401> Not Authorized');
            done();
          }
        );

      const jwtReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/checkJWToken`);
      expect(jwtReq.request.method).toMatch('GET');
      jwtReq.flush(_mockJWTFailed, mockErrorResponse(401, 'Not Authorized'));
    }); // end 'should fail jwt check' test

  }); // end 'User is logged in' section

  describe('User sign up', () => {

    test('should sign up', done => {
      userService.signUp(mockUserLogin())
        .subscribe(
          (signup: UserResponse): void => {
            expect(signup.success).toBe(true);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const signupReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/signup`);
      expect(signupReq.request.method).toMatch('POST');
      signupReq.flush({success: true});

      const loginReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should sign up' test

    test('should fail signup', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      userService.signUp(mockUserLogin())
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> User not found');
            done();
          }
        );

      const signupReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/signup`);
      expect(signupReq.request.method).toMatch('POST');
      signupReq.flush(null, mockErrorResponse(404, 'User not found'));
    }); // end 'should fail signup' test

  }); // end 'User sign up' section

  describe('Profile update', () => {

    test('should update profile', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      preferenceService.setUnits = jest
        .fn();
      storage.setUser = jest
        .fn()
        .mockReturnValue(of({}));

      const _mockUserUpdate: User = mockUser();
      _mockUserUpdate.email = 'updated@email.com';
      _mockUserUpdate['shouldIgnore'] = 'this should be ignored';

      const update: object = { email: 'updated@email.com' };

      userService.updateUserProfile(update)
        .subscribe(
          (response: User): void => {
            expect(response.email).toMatch(update['email']);
            expect(response['shouldIgnore']).toBeUndefined();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const patchReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/profile`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_mockUserUpdate);
    }); // end 'should update profile' test

    test('should no update user profile if not logged in', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      userService.updateUserProfile({})
        .subscribe(
          (response: any): void => {
            expect(response).toBeNull();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should no update user profile if not logged in' test

    test('should get error response on profile update', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      userService.updateUserProfile({})
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> User not found');
            done();
          }
        );

      const updateReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/users/profile`);
      expect(updateReq.request.method).toMatch('PATCH');
      updateReq.flush(null, mockErrorResponse(404, 'User not found'));
    });

  }); // end 'Profile update' section

});
