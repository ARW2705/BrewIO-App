import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';

import { UserProvider } from './user';
import { AuthenticationProvider } from '../authentication/authentication';
import { RecipeProvider } from '../recipe/recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockJWTSuccess, mockJWTFailed } from '../../../test-config/mockmodels/mockJWTResponse';
import { mockCredentials } from '../../../test-config/mockmodels/mockCredentials';
import { mockUserLogin } from '../../../test-config/mockmodels/mockUserLogin';
import { mockLoginResponse } from '../../../test-config/mockmodels/mockLoginResponse';
import { StorageMock } from '../../../test-config/mocks-ionic';

import { clone } from '../../shared/utility-functions/utilities';

describe('User service', () => {
  let injector: TestBed;
  let userService: UserProvider;
  let authService: AuthenticationProvider;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        Events,
        { provide: Storage, useValue: StorageMock },
        UserProvider,
        AuthenticationProvider,
        RecipeProvider,
        ProcessHttpErrorProvider
      ]
    });
    injector = getTestBed();
    userService = injector.get(UserProvider);
    authService = injector.get(AuthenticationProvider);
    httpMock = injector.get(HttpTestingController);
  });

  describe('User is logged out', () => {

    test('should be logged out', () => {
      expect(userService.getLoginStatus()).toBe(false);
    });

    test('should get null for user', () => {
      expect(userService.getUser()).toBeNull();
    });

    test('should get empty string for username', () => {
      expect(userService.getUsername()).toMatch('');
    });

  });

  describe('User is logged in', () => {

    afterEach(() => {
      httpMock.verify();
    });

    test('should log in', done => {
      userService.logIn(mockUserLogin).subscribe(user => {
        expect(user).toEqual(mockUser.username);
        done();
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should have true login status', done => {
      userService.logIn(mockUserLogin).subscribe(_ => {
        expect(userService.getLoginStatus()).toBe(true);
        done();
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should have a user profile', done => {
      userService.logIn(mockUserLogin).subscribe(_ => {
        expect(userService.getUser()).toEqual(mockUser);
        done();
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should clear user profile', done => {
      const _mockUserLogin = mockUserLogin;
      _mockUserLogin['remember'] = true;

      userService.logIn(_mockUserLogin).subscribe(_ => {
        userService.loadProfileFromStorage().subscribe(profile => {
          expect(profile.error).toBeNull();
          userService.clearProfile();
          setTimeout(() => {
            userService.loadProfileFromStorage().subscribe(profile => {
              expect(profile.error).toMatch('Profile not found');
              done();
            });
          }, 100);
        });
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should have a username', done => {
      userService.logIn(mockUserLogin).subscribe(_ => {
        expect(userService.getUsername()).toMatch('mockUser');
        done();
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should return Observable<User>', done => {
      userService.logIn(mockUserLogin).subscribe(username => {
        expect(username).toMatch(mockUser.username);
        done();
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should log out', done => {
      userService.logIn(mockUserLogin).subscribe(_ => {
        userService.logOut();
        expect(userService.getLoginStatus()).toBe(false);
        done();
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      loginReq.flush(mockLoginResponse);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      profileReq.flush(mockUser);
    });

    test('should sign up', done => {
      const _mockUser = mockUser;

      userService.signUp(_mockUser).subscribe(user => {
        expect(user).toEqual(_mockUser);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/signup`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    });

    test('should update user profile', done => {
      const _mockUser = mockUser;
      const updatedUser = clone(mockUser);
      updatedUser.firstname = 'updated';

      userService.logIn(_mockUser).subscribe(username => {
        expect(username).toMatch(_mockUser.username);
        mockUser.firstname = 'updated';
        userService.updateUserProfile(_mockUser).subscribe(updated => {
          expect(updated).toEqual(updatedUser);
          done();
        });
      });

      const logInReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      logInReq.flush(_mockUser);

      const getProfileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      getProfileReq.flush(_mockUser);

      const updateReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      expect(updateReq.request.method).toMatch('PATCH');
      updateReq.flush(updatedUser);
    });

  });

  describe('User is stored', () => {

    test('should load user from storage', done => {
      userService.storeUserProfile(mockUser);
      authService.storeUserCredentials(mockCredentials);
      userService.loadProfileFromStorage().subscribe(error => {
        expect(error.error).toBeNull();
        done();
      });
    });

    test('should login from storage', done => {
      userService.storeUserProfile(mockUser);
      authService.storeUserCredentials(mockCredentials);
      userService.loadUserFromStorage();
      setTimeout(() => {
        expect(userService.getLoginStatus()).toBe(true);
        done();
      }, 100);
      httpMock.verify();
    });

    test('should call logout()', done => {
      const logOutSpy = jest.spyOn(userService, 'logOut');
      authService.destroyUserCredentials();
      setTimeout(() => {
        userService.loadUserFromStorage();
        setTimeout(() => {
          expect(logOutSpy).toHaveBeenCalled();
          done();
        }, 100);
      }, 100);
    });

  });

});
