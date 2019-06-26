import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IonicStorageModule } from '@ionic/storage';

import { AuthenticationProvider } from './authentication';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

import { StorageMock } from '../../../test-config/mocks-ionic';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

import { mockCredentials } from '../../../test-config/mockmodels/mockCredentials';
import { mockUser} from '../../../test-config/mockmodels/mockUser';
import { mockUserLogin } from '../../../test-config/mockmodels/mockUserLogin';
import { mockLoginResponse } from '../../../test-config/mockmodels/mockLoginResponse';

describe('Authentication Service', () => {
  let injector;
  let authService;
  let httpMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        AuthenticationProvider,
        ProcessHttpErrorProvider,
        { provide: Storage, useValue: StorageMock }
      ]
    });

    injector = getTestBed();
    authService = injector.get(AuthenticationProvider);
    httpMock = injector.get(HttpTestingController);
  });

  describe('has credentials', () => {

    test('should get username from Subject', done => {
      authService.getUsername().subscribe(name => {
        expect(name).toMatch(mockCredentials.username);
        done();
      });
      authService.storeUserCredentials(mockCredentials);
    });

    test('should clear username from Subject', done => {
      authService.storeUserCredentials(mockCredentials);
      authService.getUsername().subscribe(name => {
        expect(name).toBeUndefined();
        done();
      });
      authService.clearUsername();
    });

    test('should destroy credentials', done => {
      authService.destroyUserCredentials();
      expect(authService.getToken()).toBeUndefined();
      setTimeout(() => {
        authService.loadUserCredentials().subscribe(error => {
          expect(error.error).toMatch('Token not found');
          done();
        });
      }, 100);
    });

  });

  describe('has no credentials', () => {

    test('should apply credentials', () => {
      authService.useCredentials(mockCredentials);
      expect(authService.getPublicUsername()).toMatch(mockCredentials.username);
      expect(authService.getToken()).toMatch(mockCredentials.token);
    });

    test('should store credentials', done => {
      authService.storeUserCredentials(mockCredentials);
      authService.loadUserCredentials().subscribe(error => {
        expect(error.error).toBeNull();
        done();
      });
    });

    test('should log in', done => {
      authService.logIn(mockUserLogin).subscribe(response => {
        expect(response).toEqual({success: true, username: mockUser.username});
        expect(authService.getPublicUsername()).toMatch(mockUser.username);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/users/login`);
      expect(req.request.method).toMatch('POST');
      req.flush(mockLoginResponse);
      httpMock.verify();
    });

  });

});
