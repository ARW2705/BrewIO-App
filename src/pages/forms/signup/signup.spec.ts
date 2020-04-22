/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { Network } from '@ionic-native/network/ngx';
import { Observable } from 'rxjs/Observable';

/* Constants imports */
import { baseURL } from '../../../shared/constants/base-url';
import { apiVersion } from '../../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../../test-config/mockmodels/mockUser';
import { mockErrorResponse } from '../../../../test-config/mockmodels/mockErrorResponse';
import { NavMock, NavParamsMock, StorageMock, ViewControllerMock, ToastControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { SignupPage } from './signup';

/* Provider imports */
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { ProcessProvider } from '../../../providers/process/process';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { ProcessHttpErrorProvider } from '../../../providers/process-http-error/process-http-error';
import { StorageProvider } from '../../../providers/storage/storage';
import { ConnectionProvider } from '../../../providers/connection/connection';
import { PreferencesProvider } from '../../../providers/preferences/preferences';


describe('Signup Form', () => {
  let fixture: ComponentFixture<SignupPage>;
  let signupPage: SignupPage;
  let httpMock: HttpTestingController;
  let injector: TestBed;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        SignupPage
      ],
      imports: [
        IonicModule.forRoot(SignupPage),
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        UserProvider,
        ToastProvider,
        FormValidatorProvider,
        ProcessHttpErrorProvider,
        Network,
        ConnectionProvider,
        PreferencesProvider,
        { provide: ProcessProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock },
        { provide: ToastController, useClass: ToastControllerMock },
        { provide: StorageProvider, useValue: {} },
        { provide: Storage, useClass: StorageMock }
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(async(() => {
    injector = getTestBed();
    httpMock = injector.get(HttpTestingController);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SignupPage);
    signupPage = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
  });

  test('should create component', () => {
    fixture.detectChanges();
    expect(signupPage).toBeDefined();
  }); // end 'should create component' test

  test('should initialize the form', () => {
    fixture.detectChanges();
    expect(signupPage.signupForm).toBeDefined();
  }); // end 'should initialize the form' test

  test('should detect changes in the form', () => {
    fixture.detectChanges();
    expect(signupPage.preferredUnits).toMatch('EN');
    signupPage.signupForm.controls.preferredUnits.setValue(false);
    expect(signupPage.preferredUnits).toMatch('M');
    signupPage.signupForm.controls.preferredUnits.setValue(true);
    expect(signupPage.preferredUnits).toMatch('EN');
  }); // end 'should detect changes in the form' test

  test('should be invalid when form is empty', () => {
    fixture.detectChanges();
    expect(signupPage.signupForm.valid).toBe(false);
  }); // end 'should be invalid when form is empty' test

  test('should close the modal', () => {
    fixture.detectChanges();
    const viewSpy = jest.spyOn(signupPage.viewCtrl, 'dismiss');
    signupPage.dismiss();
    expect(viewSpy).toHaveBeenCalledWith();
  }); // end 'should close the modal' test

  test('should have required field error', () => {
    fixture.detectChanges();
    const usernameControl = signupPage.signupForm.controls.username;
    expect(usernameControl.valid).toBe(false);
    usernameControl.markAsTouched();
    expect(usernameControl.errors.required).toBeTruthy();
  }); // end 'should have required field error' test

  test('should have minlength field error', () => {
    fixture.detectChanges();
    const usernameControl = signupPage.signupForm.controls.username;
    expect(usernameControl.valid).toBe(false);
    usernameControl.setValue('a');
    expect(usernameControl.errors.minlength).toBeTruthy();
  }); // end 'should have minlength field error' test

  test('shoud have maxlength field error', () => {
    fixture.detectChanges();
    const usernameControl = signupPage.signupForm.controls.username;
    expect(usernameControl.valid).toBe(false);
    usernameControl.setValue('aaaaaaaaaaaaaaaaaaaaa');
    expect(usernameControl.errors.maxlength).toBeTruthy();
  }); // end 'shoud have maxlength field error' test

  test('should have email field error', () => {
    fixture.detectChanges();
    const emailControl = signupPage.signupForm.controls.email;
    expect(emailControl.valid).toBe(false);
    emailControl.setValue('invalid');
    expect(emailControl.errors.email).toBeTruthy();
  }); // end 'should have email field error' test

  test('should have password pattern field error', () => {
    fixture.detectChanges();
    const passwordControl = signupPage.signupForm.controls.password;
    passwordControl.setValue('a');
    expect(passwordControl.errors.passwordInvalid).toBe(true);
    passwordControl.setValue('abcdefghij');
    expect(passwordControl.errors.passwordInvalid).toBe(true);
    passwordControl.setValue('abcdefghij1');
    expect(passwordControl.errors.passwordInvalid).toBe(true);
    passwordControl.setValue('abcdefghij1K');
    expect(passwordControl.errors.passwordInvalid).toBe(true);
    passwordControl.setValue('abcdefghij1K&');
    expect(passwordControl.errors).toBeNull();
  }); // end 'should have password pattern field error' test

  test('should have password match field error', () => {
    fixture.detectChanges();
    const passwordControl = signupPage.signupForm.controls.password;
    const passwordConfirmationControl = signupPage.signupForm.controls.passwordConfirmation;
    passwordControl.setValue('abcdefghij1K&');
    passwordConfirmationControl.setValue('abcdefghij1k$');
    expect(passwordConfirmationControl.errors.mismatch).toBe(true);
    passwordConfirmationControl.setValue('abcdefghij1K&');
    expect(passwordConfirmationControl.errors).toBeNull();
  }); // end 'should have password match field error' test

  test('should check for a form control error', () => {
    fixture.detectChanges();
    const usernameControl = signupPage.signupForm.controls['username'];
    usernameControl.markAsTouched();
    expect(signupPage.hasFormError('username')).toBe(true);
    usernameControl.setValue('username');
    expect(signupPage.hasFormError('username')).toBe(false);
  }); // end 'should check for a form control error' test

  test('should get all error messages for a control', () => {
    fixture.detectChanges();
    const passwordControl = signupPage.signupForm.controls.password;
    passwordControl.setValue('a');
    const errors = signupPage.getFormErrors('password');
    expect(errors.length).toBe(2);
    expect(errors[0]).toMatch('Password must be at least 8 characters');
    expect(errors[1]).toMatch('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*)');
  }); // end 'should get all error messages for a control' test

  test('should submit a signup form and get a success response', done => {
    fixture.detectChanges();
    const _mockUser = mockUser();
    const formControls = signupPage.signupForm.controls;
    formControls.username.setValue(_mockUser.username);
    formControls.password.setValue('abcdefghij1K%');
    formControls.passwordConfirmation.setValue('abcdefghij1K%');
    formControls.email.setValue('test@email.com');

    signupPage.userService.signUp = jest
      .fn()
      .mockReturnValue(Observable.of(_mockUser));

    expect(signupPage.signupForm.valid).toBe(true);

    const toastSpy = jest.spyOn(signupPage.toastService, 'presentToast');
    const viewSpy = jest.spyOn(signupPage.viewCtrl, 'dismiss');

    signupPage.onSubmit();

    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith('Sign up complete!', 1500, 'bright-toast');
      expect(viewSpy).toHaveBeenCalledWith(_mockUser);
      done();
    }, 10);
  }); // end 'should submit a signup form and get a success response' test

  test('should submit a signup form and get an error response', done => {
    fixture.detectChanges();
    const formControls = signupPage.signupForm.controls;
    formControls.username.setValue('test-user');
    formControls.password.setValue('abcdefghij1K%');
    formControls.passwordConfirmation.setValue('abcdefghij1K%');
    formControls.email.setValue('test@email.com');
    expect(signupPage.signupForm.valid).toBe(true);
    const toastSpy = jest.spyOn(signupPage.toastService, 'presentToast');
    signupPage.onSubmit();

    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith('<400> Username already exists', 2000);
      done();
    }, 10);

    const signupReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/signup`);
    signupReq.flush(null, mockErrorResponse(400, 'Username already exists'));
  }); // end 'should submit a signup form and get an error response' test

  test('should toggle password visibility', () => {
    fixture.detectChanges();
    expect(signupPage.showPassword).toBe(false);
    signupPage.togglePasswordVisible();
    expect(signupPage.showPassword).toBe(true);
    signupPage.togglePasswordVisible();
    expect(signupPage.showPassword).toBe(false);
  }); // end 'should toggle password visibility' test

});
