/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';

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
import { StorageMock } from '../../../test-config/mocks-ionic';

/* Provider imports */
import { UserProvider } from './user';
import { ProcessProvider } from '../process/process';
import { RecipeProvider } from '../recipe/recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

describe('User Service', () => {
  let injector: TestBed;
  let userService: UserProvider;
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
        { provide: Storage, useClass: StorageMock },
        UserProvider,
        ProcessProvider,
        RecipeProvider,
        ProcessHttpErrorProvider,
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
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

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
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

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
    }); // end 'should log in' test

    test('should have token', done => {
      userService.logIn(mockUserLogin())
        .subscribe(_response => {
          expect(userService.getToken()).toMatch(mockUser().token);
          done();
        });

        const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
        loginReq.flush(mockLoginResponse());

        /* Process service and Recipe service tests are handled in their own spec */
        const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
        _processReq.flush([]);
        const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
        _recipeReq.flush([]);
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

        /* Process service and Recipe service tests are handled in their own spec */
        const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
        _processReq.flush([]);
        const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
        _recipeReq.flush([]);
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

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
    }); // end ''should clear user data'' test

    test('should succeed jwt check', done => {
      userService.logIn(mockUserLogin())
        .subscribe(_ => {
          const consoleSpy = jest.spyOn(console, 'log');
          userService.checkJWToken();
          setTimeout(() => {
            expect(consoleSpy).toHaveBeenCalledWith('JWT valid');
            done();
          }, 10);
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse());

      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush(mockJWTSuccess());

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
    }); // end 'should succeed jwt check' test

    test('should fail jwt check', done => {
      userService.logIn(mockUserLogin())
        .subscribe(_ => {
          const consoleSpy = jest.spyOn(console, 'log');
          userService.checkJWToken();
          setTimeout(() => {
            expect(consoleSpy).toHaveBeenCalledWith('JWT valid');
            done();
          }, 10);
        });

      const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse());

      const jwtReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/checkJWToken`);
      jwtReq.flush(mockJWTFailed());

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
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

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
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

      /* Process service and Recipe service tests are handled in their own spec */
      const _processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      _processReq.flush([]);
      const _recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      _recipeReq.flush([]);
    }); // end 'should update profile' test

  }); // end 'Profile update' section

});
