/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../../../test-config/mockmodels/mockUser';

/* Interface imports */
import { User } from '../../../../shared/interfaces/user';

/* Component imports */
import { ProfileComponent } from './profile';

/* Provider imports */
import { UserProvider } from '../../../../providers/user/user';
import { ToastProvider } from '../../../../providers/toast/toast';


describe('Profile Component', () => {
  let profilePage: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let injector: TestBed;
  let userService: UserProvider;
  let toastService: ToastProvider;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ProfileComponent
      ],
      imports: [
        IonicModule.forRoot(ProfileComponent)
      ],
      providers: [
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} }
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
    toastService = injector.get(ToastProvider);

    userService.getUser = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<User>(mockUser()));
    userService.isLoggedIn = jest
      .fn()
      .mockReturnValue(true);

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    profilePage = fixture.componentInstance;
  });

  test('should create the component', () => {
    fixture.detectChanges();

    expect(profilePage).toBeDefined();
  }); // end 'should create the component' test

  test('should have new updated values', () => {
    fixture.detectChanges();

    profilePage.originalValues.email = 'new-email';

    expect(profilePage.hasValuesToUpdate()).toBe(true);
  }); // end 'should have new updated values' test

  test('should not have new updated values', () => {
    fixture.detectChanges();

    profilePage.originalValues = profilePage.userForm.value;

    expect(profilePage.hasValuesToUpdate()).toBe(false);
  }); // end 'should not have new updated values' test

  test('should stop editing', () => {
    fixture.detectChanges();

    profilePage.changeEdit('email', null);

    expect(profilePage.editing).toMatch('');
  }); // end 'should stop editing' test

  test('should init form with user', () => {
    fixture.detectChanges();

    const _mockUser = mockUser();

    expect(profilePage.userForm.controls.email.value).toMatch(_mockUser.email);
    expect(profilePage.userForm.controls.firstname.value).toMatch(_mockUser.firstname);
    expect(profilePage.userForm.controls.lastname.value).toMatch(_mockUser.lastname);
  }); // end 'should init form with user' test

  test('should init form without a user', () => {
    fixture.detectChanges();

    profilePage.initForm({});

    expect(profilePage.userForm.controls.email.value.length).toBe(0);
    expect(profilePage.userForm.controls.firstname.value.length).toBe(0);
    expect(profilePage.userForm.controls.lastname.value.length).toBe(0);
  }); // end 'should init form without a user' test

  test('should be in editing for field', () => {
    fixture.detectChanges();

    const field = 'firstname';

    profilePage.editing = field;

    expect(profilePage.isEditing(field)).toBe(true);
  }); // end 'should be in editing for field' test

  test('should not be in editing for field', () => {
    fixture.detectChanges();

    const field = 'email';

    profilePage.editing = '';

    expect(profilePage.isEditing(field)).toBe(false);
  }); // end 'should not be in editing for field' test

  test('should be logged in', () => {
    fixture.detectChanges();

    expect(profilePage.isLoggedIn()).toBe(true);
  }); // end 'should be logged in' test

  test('should change editing to \'email\'', () => {
    fixture.detectChanges();

    profilePage.changeEdit('email', undefined);

    expect(profilePage.editing).toMatch('email');
  }); // end 'should change editing to \'email\'' test

  test('should change editing to \'firstname\'', () => {
    fixture.detectChanges();

    profilePage.changeEdit('firstname', undefined);

    expect(profilePage.editing).toMatch('firstname');
  }); // end 'should change editing to \'firstname\'' test

  test('should change editing to \'lastname\'', () => {
    fixture.detectChanges();

    profilePage.changeEdit('lastname', undefined);

    expect(profilePage.editing).toMatch('lastname');
  }); // end 'should change editing to \'lastname\'' test

  test('should stop editing', () => {
    fixture.detectChanges();

    profilePage.changeEdit('email', null);

    expect(profilePage.editing).toMatch('');
  }); // end 'should stop editing' test

  test('should map new values to original values', () => {
    fixture.detectChanges();

    const newValues = {
      email: 'new-email',
      firstname: 'new-firstname',
      lastname: 'new-lastname',
      ignore: true
    };

    profilePage.mapOriginalValues(newValues);

    expect(profilePage.originalValues.email).toMatch(newValues.email);
    expect(profilePage.originalValues.firstname).toMatch(newValues.firstname);
    expect(profilePage.originalValues.lastname).toMatch(newValues.lastname);
    expect(profilePage.originalValues['ignore']).toBeUndefined();
  }); // end 'should map new values to original values' test

  test('should submit an update', () => {
    const _mockUser = mockUser();

    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(of(_mockUser));

    profilePage.updateForm = jest
      .fn();

    fixture.detectChanges();

    const updateSpy = jest.spyOn(profilePage, 'updateForm');
    const toastSpy = jest.spyOn(toastService, 'presentToast');

    profilePage.onUpdate();

    expect(updateSpy).toHaveBeenCalledWith(_mockUser);
    expect(toastSpy).toHaveBeenCalledWith('Profile Updated');
  }); // end 'should submit an update' test

  test('should fail to update user profile on error response', () => {
    fixture.detectChanges();

    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(new ErrorObservable('update error'));

    const toastSpy = jest.spyOn(toastService, 'presentToast');

    profilePage.onUpdate();

    expect(toastSpy).toHaveBeenCalledWith('update error');
  }); // end 'should fail to update user profile on error response' test

  test('should update original values with updated values', () => {
    fixture.detectChanges();

    profilePage.updateForm({
      email: 'email',
      firstname: 'first',
      lastname: 'last'
    });

    expect(profilePage.originalValues.email).toMatch('email');
    expect(profilePage.originalValues.firstname).toMatch('first');
    expect(profilePage.originalValues.lastname).toMatch('last');
  }); // end 'should update original values with updated values' test

});
