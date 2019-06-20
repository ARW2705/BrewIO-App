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
import { StorageMock } from '../../../test-config/mocks-ionic';

import { clone } from '../../shared/utility-functions/utilities';

describe('User service', () => {
  let injector: TestBed;
  let userService: UserProvider;
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
    httpMock = injector.get(HttpTestingController);
  });

  describe('User is logged out', () => {

    test('should status logged out', () => {
      expect(userService.getLoginStatus()).toBe(false);
    });

    test('should return null for user', () => {
      expect(userService.getUser()).toBe(null);
    });

    test('should return empty string for username', () => {
      expect(userService.getUsername()).toMatch('');
    });

  });

  describe('User is logged in', () => {
    const _mockUser = mockUser;

    test('should log in', () => {
      userService.logIn(_mockUser).subscribe(user => {
        expect(user).toEqual(_mockUser);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    })

    test('should have true login status', () => {
      const _mockUser = mockUser;

      userService.logIn(_mockUser).subscribe(_ => {
        expect(userService.getLoginStatus()).toBe(true);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    });

    test('should have a user profile', () => {
      const _mockUser = mockUser;

      userService.logIn(_mockUser).subscribe(_ => {
        expect(userService.getUser()).toEqual(_mockUser);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    })

    test('should have a username', () => {
      const _mockUser = mockUser;

      userService.logIn(_mockUser).subscribe(_ => {
        expect(userService.getUsername()).toMatch('testuser');
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    });

    test('should return Observable<User>', () => {
      const _mockUser = mockUser;

      userService.logIn({
        'username': 'testuser',
        'password': 'testpass'
      }).subscribe(_ => {
        userService.getUserProfile().subscribe(profile => {
          expect(profile).toEqual(_mockUser);
        });
      });

      const loginReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(loginReq.request.method).toMatch('POST');
      loginReq.flush(_mockUser);

      const profileReq = httpMock.expectOne(`${baseURL}${apiVersion}/users/profile`);
      expect(profileReq.request.method).toMatch('GET');
      profileReq.flush(_mockUser);
    });

    test('should log out', () => {
      const _mockUser = mockUser;

      userService.logIn(_mockUser).subscribe(_ => {
        userService.logOut();
        expect(userService.getLoginStatus()).toBe(false);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    });

    test('should sign up', () => {
      const _mockUser = mockUser;

      userService.signUp(_mockUser).subscribe(user => {
        expect(user).toEqual(_mockUser);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/signup`);
      expect(req.request.method).toMatch('POST');
      req.flush(_mockUser);
    });

    test('should update user profile', () => {
      const _mockUser = mockUser;
      const updatedUser = clone(mockUser);
      updatedUser.firstname = 'updated';

      userService.logIn(_mockUser).subscribe(username => {
        expect(username).toMatch(_mockUser.username);
        mockUser.firstname = 'updated';
        userService.updateUserProfile(_mockUser).subscribe(updated => {
          expect(updated).toEqual(updatedUser);
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

    test('should update user\'s in progress list', () => {
      const _mockUser = mockUser;
      const mockBatchArray = [mockBatch];

      userService.logIn(_mockUser).subscribe(user => {
        expect(user.inProgressList.length).toBe(0);
        userService.updateUserInProgressList(mockBatchArray);
        expect(user.inProgressList.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      req.flush(_mockUser);
    });

  });

});
