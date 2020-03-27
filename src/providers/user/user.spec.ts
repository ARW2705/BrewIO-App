/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { Network } from '@ionic-native/network/ngx';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockUserLogin } from '../../../test-config/mockmodels/mockUserLogin';
import { mockLoginResponse } from '../../../test-config/mockmodels/mockLoginResponse';
import { mockJWTSuccess, mockJWTFailed } from '../../../test-config/mockmodels/mockJWTResponse';

/* Provider imports */
import { UserProvider } from './user';
import { ProcessProvider } from '../process/process';
import { RecipeProvider } from '../recipe/recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';

describe('User Service', () => {
  let injector: TestBed;
  let userService: UserProvider;
  let connectionService: ConnectionProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        Events,
        Network,
        UserProvider,
        ProcessProvider,
        RecipeProvider,
        ProcessHttpErrorProvider,
        StorageProvider,
        ConnectionProvider
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
    connectionService = injector.get(ConnectionProvider);
    connectionService.connection = true;
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('User is not logged in', () => {

    test('should be logged out', () => {
      expect(userService.isLoggedIn()).toBe(false);
    }); // end 'should be logged out' test

    test('should have undefined as id', () => {
      userService.getUser()
        .subscribe(user => {
          expect(user._id).toBeUndefined();
        });
    }); // end 'should have undefined as id' test

    test('should have undefined as token', () => {
      expect(userService.getToken()).toBeUndefined();
    }); // end 'should have undefined as token' test

    test('should log out', done => {
      userService.getUser()
        .skip(2)
        .subscribe(() => {
          expect(userService.getToken()).toBeUndefined();
          done();
        });

      userService.logIn(mockUserLogin())
        .subscribe(_ => {
          userService.logOut();
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should log out' test

  }); // end 'User is not logged in' section

  describe('User is logged in', () => {

    test('should log in', done => {
      userService.logIn(mockUserLogin())
        .subscribe(_response => {
          expect(userService.isLoggedIn()).toBe(true);
          done();
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(mockLoginResponse());
    }); // end 'should log in' test

    test('should have token', done => {
      userService.logIn(mockUserLogin())
        .subscribe(_response => {
          expect(userService.getToken()).toMatch(mockUser().token);
          done();
        });

        const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
        loginReq.flush(mockLoginResponse());
    }); // end 'should have token' test

    test('should have user data', done => {
      const _mockUser = mockUser();
      userService.logIn(mockUserLogin())
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
      userService.logIn(mockUserLogin())
        .subscribe(_ => {
          userService.getUser()
            .subscribe(user => {
              if (userService.isLoggedIn()) {
                expect(user.username).not.toBeUndefined();
              } else {
                expect(user.username).toBeUndefined();
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
      userService.checkJWToken()
        .subscribe(
          (res) => { console.log('shouldnt be here', res) },
          (jwtErrorResponse: any) => {
            console.log(jwtErrorResponse);
            expect(jwtErrorResponse).toMatch(`${_mockJWTFailed.error.name}: ${_mockJWTFailed.error.message}`);
            done();
          }
        );

      const errorResponse = {
        status: 401,
        statusText: 'not authorized'
      };
      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush(_mockJWTFailed, errorResponse);
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
      userService.signUp(mockUserLogin())
        .subscribe(signup => {
          expect(signup.success).toBe(false);
          done();
        });

      const signupReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/signup`);
      signupReq.flush({success: false});
    }); // end 'should fail signup' test

  }); // end 'User sign up' section

  describe('Profile update', () => {

    test('should update profile', done => {
      userService.getUser()
        .skip(2)
        .subscribe(user => {
          expect(user.username).toMatch('mock');
          done();
        });

      userService.logIn(mockUserLogin())
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
      updateReq.flush(_updatedMockUser);
    }); // end 'should update profile' test

  }); // end 'Profile update' section

});
