/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, Events, ToastController, ModalController } from 'ionic-angular';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Constants imports */
import { baseURL } from '../../../../shared/constants/base-url';
import { apiVersion } from '../../../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../../../test-config/mockmodels/mockUser';
import { ModalControllerMock, ToastControllerMock } from '../../../../../test-config/mocks-ionic';

/* Module imports */
import { UserComponentsModule } from '../user.components.module';

/* Component imports */
import { ProfileComponent } from './profile';

/* Provider imports */
import { UserProvider } from '../../../../providers/user/user';
import { ProcessHttpErrorProvider } from '../../../../providers/process-http-error/process-http-error';
import { ModalProvider } from '../../../../providers/modal/modal';
import { ToastProvider } from '../../../../providers/toast/toast';
import { StorageProvider } from '../../../../providers/storage/storage';
import { ConnectionProvider } from '../../../../providers/connection/connection';
import { PreferencesProvider } from '../../../../providers/preferences/preferences';


describe('About Component', () => {
  let profileComponent: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let injector: TestBed;
  let httpMock: HttpTestingController;
  let userService: UserProvider;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [ ],
      imports: [
        IonicModule.forRoot(ProfileComponent),
        UserComponentsModule,
        HttpClientTestingModule,
        IonicStorageModule
      ],
      providers: [
        UserProvider,
        ModalProvider,
        ToastProvider,
        ProcessHttpErrorProvider,
        PreferencesProvider,
        { provide: ConnectionProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: ModalController, useClass: ModalControllerMock },
        { provide: ToastController, useClass: ToastControllerMock },
        { provide: Events, useValue: {} }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(async(() => {
    injector = getTestBed();
    userService = injector.get(UserProvider);
    httpMock = injector.get(HttpTestingController);
    userService.user$.next(mockUser());
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    profileComponent = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Profile Component', () => {

    test('should create the component', () => {
      fixture.detectChanges();
      expect(ProfileComponent).toBeDefined();
    }); // end 'should create the component' test

    test('should have new updated values', () => {
      fixture.detectChanges();
      profileComponent.originalValues.email = 'new-email';
      expect(profileComponent.hasValuesToUpdate()).toBe(true);
    }); // end 'should have new updated values' test

    test('should not have new updated values', () => {
      fixture.detectChanges();
      profileComponent.originalValues = profileComponent.userForm.value;
      expect(profileComponent.hasValuesToUpdate()).toBe(false);
    }); // end 'should not have new updated values' test

    test('should stop editing', () => {
      fixture.detectChanges();
      profileComponent.changeEdit('email', null);
      expect(profileComponent.editing).toMatch('');
    }); // end 'should stop editing' test

    test('should init form with user', () => {
      fixture.detectChanges();
      const _mockUser = mockUser();
      expect(profileComponent.userForm.controls.email.value).toMatch(_mockUser.email);
      expect(profileComponent.userForm.controls.firstname.value).toMatch(_mockUser.firstname);
      expect(profileComponent.userForm.controls.lastname.value).toMatch(_mockUser.lastname);
    }); // end 'should init form with user' test

    test('should init form without a user', () => {
      fixture.detectChanges();
      profileComponent.initForm({});
      expect(profileComponent.userForm.controls.email.value.length).toBe(0);
      expect(profileComponent.userForm.controls.firstname.value.length).toBe(0);
      expect(profileComponent.userForm.controls.lastname.value.length).toBe(0);
    }); // end 'should init form without a user' test

    test('should be in editing for field', () => {
      fixture.detectChanges();
      const field = 'firstname';
      profileComponent.editing = field;
      expect(profileComponent.isEditing(field)).toBe(true);
    }); // end 'should be in editing for field' test

    test('should not be in editing for field', () => {
      fixture.detectChanges();
      const field = 'email';
      profileComponent.editing = '';
      expect(profileComponent.isEditing(field)).toBe(false);
    }); // end 'should not be in editing for field' test

    test('should be logged in', () => {
      fixture.detectChanges();
      expect(profileComponent.isLoggedIn()).toBe(true);
    }); // end 'should be logged in' test

    test('should change editing to \'email\'', () => {
      fixture.detectChanges();
      profileComponent.changeEdit('email', undefined);
      expect(profileComponent.editing).toMatch('email');
    }); // end 'should change editing to \'email\'' test

    test('should change editing to \'firstname\'', () => {
      fixture.detectChanges();
      profileComponent.changeEdit('firstname', undefined);
      expect(profileComponent.editing).toMatch('firstname');
    }); // end 'should change editing to \'firstname\'' test

    test('should change editing to \'lastname\'', () => {
      fixture.detectChanges();
      profileComponent.changeEdit('lastname', undefined);
      expect(profileComponent.editing).toMatch('lastname');
    }); // end 'should change editing to \'lastname\'' test

    test('should stop editing', () => {
      fixture.detectChanges();
      profileComponent.changeEdit('email', null);
      expect(profileComponent.editing).toMatch('');
    }); // end 'should stop editing' test

    test('should map new values to original values', () => {
      fixture.detectChanges();
      const newValues = {
        email: 'new-email',
        firstname: 'new-firstname',
        lastname: 'new-lastname',
        ignore: true
      };

      profileComponent.mapOriginalValues(newValues);

      expect(profileComponent.originalValues.email).toMatch(newValues.email);
      expect(profileComponent.originalValues.firstname).toMatch(newValues.firstname);
      expect(profileComponent.originalValues.lastname).toMatch(newValues.lastname);
      expect(profileComponent.originalValues['ignore']).toBeUndefined();
    }); // end 'should map new values to original values' test

    test('should submit an update', done => {
      fixture.detectChanges();
      const _mockUser = mockUser();
      const onUpdateSpy = jest.spyOn(profileComponent.userService, 'updateUserProfile');
      const toastSpy = jest.spyOn(profileComponent.toastService, 'presentToast');

      profileComponent.onUpdate();

      const updateReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/profile`);
      expect(updateReq.request.method).toMatch('PATCH');
      updateReq.flush({
        email: _mockUser.email,
        firstname: _mockUser.firstname,
        lastname: _mockUser.lastname
      });

      setTimeout(() => {
        expect(onUpdateSpy).toHaveBeenCalled();
        expect(toastSpy).toHaveBeenCalledWith('Profile Updated');
        done();
      }, 10);
    }); // end 'should submit an update' test

    test('should fail to update user profile on error response', () => {
      fixture.detectChanges();
      userService.updateUserProfile = jest
        .fn()
        .mockReturnValue(new ErrorObservable('update error'));
      const toastSpy = jest.spyOn(profileComponent.toastService, 'presentToast');

      profileComponent.onUpdate();

      expect(toastSpy).toHaveBeenCalledWith('update error');
    }); // end 'should fail to update user profile on error response' test

    test('should update original values with updated values', () => {
      fixture.detectChanges();
      profileComponent.updateForm({
        email: 'email',
        firstname: 'first',
        lastname: 'last'
      });
      expect(profileComponent.originalValues.email).toMatch('email');
      expect(profileComponent.originalValues.firstname).toMatch('first');
      expect(profileComponent.originalValues.lastname).toMatch('last');
    }); // end 'should update original values with updated values' test

  });

});
