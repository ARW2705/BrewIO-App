/* Module imports */
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { IonicModule } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
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
  let originalNgOnInit: () => void;
  let originalNgOnDestroy: () => void;
  const staticUser: User = mockUser();
  const staticUserForm: FormGroup = new FormGroup({
    email: new FormControl(''),
    firstname: new FormControl(''),
    lastname: new FormControl('')
  });
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

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    profilePage = fixture.componentInstance;

    injector = getTestBed();
    userService = injector.get(UserProvider);
    toastService = injector.get(ToastProvider);

    toastService.presentToast = jest
      .fn();

    profilePage.userForm = staticUserForm;
    profilePage.isLoggedIn = true;
    profilePage.user = staticUser;

    originalNgOnInit = profilePage.ngOnInit;
    profilePage.ngOnInit = jest
      .fn();
    originalNgOnDestroy = profilePage.ngOnDestroy;
    profilePage.ngOnDestroy = jest
      .fn();
  });

  test('should create the component', () => {
    profilePage.ngOnInit = originalNgOnInit;
    profilePage.ngOnDestroy = originalNgOnDestroy;

    userService.getUser = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<User>(staticUser));
    userService.isLoggedIn = jest
      .fn()
      .mockReturnValue(true);
    profilePage.initForm = jest
      .fn();

    fixture.detectChanges();

    expect(profilePage).toBeDefined();
  }); // end 'should create the component' test

  test('should get error when trying to get user', () => {
    profilePage.ngOnInit = originalNgOnInit;
    profilePage.initForm = jest
      .fn();

    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    userService.getUser = jest
      .fn()
      .mockReturnValue(new ErrorObservable('user error'));

    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith('Error getting user: user error');
  }); // end 'should get error when trying to get user' test

  test('should stop editing', () => {
    fixture.detectChanges();

    profilePage.changeEdit('email', null);

    expect(profilePage.editing).toMatch('');
  }); // end 'should stop editing' test

  test('should init form with user', () => {
    fixture.detectChanges();

    profilePage.initForm(staticUser);

    expect(profilePage.userForm.controls.email.value)
      .toMatch(staticUser.email);
    expect(profilePage.userForm.controls.firstname.value)
      .toMatch(staticUser.firstname);
    expect(profilePage.userForm.controls.lastname.value)
      .toMatch(staticUser.lastname);
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

    const field: string = 'firstname';

    profilePage.editing = field;

    expect(profilePage.isEditing(field)).toBe(true);
  }); // end 'should be in editing for field' test

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

  test('should submit an update', () => {
    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(of(staticUser));

    fixture.detectChanges();

    const toastSpy: jest.SpyInstance = jest.spyOn(toastService, 'presentToast');

    profilePage.onUpdate();

    expect(toastSpy).toHaveBeenCalledWith('Profile Updated');
  }); // end 'should submit an update' test

  test('should fail to update user profile on error response', () => {
    userService.updateUserProfile = jest
      .fn()
      .mockReturnValue(new ErrorObservable('update error'));

    fixture.detectChanges();

    const toastSpy: jest.SpyInstance = jest.spyOn(toastService, 'presentToast');

    profilePage.onUpdate();

    expect(toastSpy).toHaveBeenCalledWith('update error');
  }); // end 'should fail to update user profile on error response' test

});
