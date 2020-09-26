/* Module imports */
import { ComponentFixture, TestBed, getTestBed } from '@angular/core/testing';
import { AbstractControl, FormGroup, FormControl, Validators } from '@angular/forms';
import { IonicModule, ViewController, ToastController } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../../test-config/mockmodels/mockUser';
import { ViewControllerMock, ToastControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { User } from '../../../shared/interfaces/user';

/* Page imports */
import { SignupPage } from './signup';

/* Provider imports */
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';


describe('Signup Form', () => {
  let fixture: ComponentFixture<SignupPage>;
  let signupPage: SignupPage;
  let injector: TestBed;
  let formValidator: FormValidatorProvider;
  let userService: UserProvider;
  let toastService: ToastProvider;
  let viewCtrl: ViewController;
  let originalNgOnInit: () => void;
  let originalNgOnDestroy: () => void;
  const buildForm: () => FormGroup = () => {
    return new FormGroup({
      username: new FormControl(
        '',
        [
          Validators.minLength(6),
          Validators.maxLength(20),
          Validators.required
        ]
      ),
      password: new FormControl(''),
      passwordConfirmation: new FormControl(''),
      email: new FormControl(
        '',
        [ Validators.email ]
      ),
      firstname: new FormControl(''),
      lastname: new FormControl('')
    });
  }
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        SignupPage
      ],
      imports: [
        IonicModule.forRoot(SignupPage)
      ],
      providers: [
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: FormValidatorProvider, useValue: {} },
        { provide: ViewController, useClass: ViewControllerMock },
        { provide: ToastController, useClass: ToastControllerMock },
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
    fixture = TestBed.createComponent(SignupPage);
    signupPage = fixture.componentInstance;

    injector = getTestBed();
    formValidator = injector.get(FormValidatorProvider);
    toastService = injector.get(ToastProvider);
    userService = injector.get(UserProvider);
    viewCtrl = injector.get(ViewController);

    formValidator.passwordPattern = jest
      .fn()
      .mockReturnValue(() => {
        return null;
      });
    formValidator.passwordMatch = jest
      .fn()
      .mockReturnValue(() => {
        return null;
      });

    toastService.presentToast = jest
      .fn();

    originalNgOnInit = signupPage.ngOnInit;
    signupPage.ngOnInit = jest
      .fn();
    originalNgOnDestroy = signupPage.ngOnDestroy;
    signupPage.ngOnDestroy = jest
      .fn();
  });

  test('should create component', () => {
    signupPage.ngOnInit = originalNgOnInit;
    signupPage.ngOnDestroy = originalNgOnDestroy;

    signupPage.initForm = jest
      .fn();

    fixture.detectChanges();

    expect(signupPage).toBeDefined();
  }); // end 'should create component' test

  test('should initialize the form', () => {
    fixture.detectChanges();

    signupPage.initForm();

    expect(signupPage.signupForm).not.toBeNull();
  }); // end 'should initialize the form' test

  test('should be invalid when form is empty', () => {
    fixture.detectChanges();

    signupPage.initForm();

    expect(signupPage.signupForm.valid).toBe(false);
  }); // end 'should be invalid when form is empty' test

  test('should close the modal', () => {
    fixture.detectChanges();

    const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    signupPage.dismiss();

    expect(viewSpy).toHaveBeenCalledWith();
  }); // end 'should close the modal' test

  test('should have required field error', () => {
    signupPage.signupForm = buildForm();

    fixture.detectChanges();

    const usernameControl: AbstractControl = signupPage
      .signupForm
      .controls
      .username;

    expect(usernameControl.valid).toBe(false);

    usernameControl.markAsTouched();

    expect(usernameControl.errors.required).toBeTruthy();
  }); // end 'should have required field error' test

  test('should have minlength field error', () => {
    signupPage.signupForm = buildForm();

    fixture.detectChanges();

    const usernameControl: AbstractControl = signupPage
      .signupForm
      .controls
      .username;

    expect(usernameControl.valid).toBe(false);

    usernameControl.setValue('a');

    expect(usernameControl.errors.minlength).toBeTruthy();
  }); // end 'should have minlength field error' test

  test('shoud have maxlength field error', () => {
    signupPage.signupForm = buildForm();

    fixture.detectChanges();

    const usernameControl: AbstractControl = signupPage
      .signupForm
      .controls
      .username;

    expect(usernameControl.valid).toBe(false);

    usernameControl.setValue('aaaaaaaaaaaaaaaaaaaaa');

    expect(usernameControl.errors.maxlength).toBeTruthy();
  }); // end 'shoud have maxlength field error' test

  test('should have email field error', () => {
    signupPage.signupForm = buildForm();

    fixture.detectChanges();

    const emailControl: AbstractControl = signupPage.signupForm.controls.email;

    expect(emailControl.valid).toBe(false);

    emailControl.setValue('invalid');

    expect(emailControl.errors.email).toBeTruthy();
  }); // end 'should have email field error' test

  test('should submit a signup form and get a success response', done => {
    signupPage.signupForm = buildForm();

    fixture.detectChanges();

    const _mockUser: User = mockUser();
    const formControls: { [key: string]: AbstractControl } = signupPage
      .signupForm
      .controls;
    formControls.username.setValue(_mockUser.username);
    formControls.password.setValue('abcdefghij1K%');
    formControls.passwordConfirmation.setValue('abcdefghij1K%');
    formControls.email.setValue('test@email.com');

    signupPage.userService.signUp = jest
      .fn()
      .mockReturnValue(of(_mockUser));

    expect(signupPage.signupForm.valid).toBe(true);

    const toastSpy: jest.SpyInstance = jest.spyOn(toastService, 'presentToast');
    const viewSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    signupPage.onSubmit();

    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        'Sign up complete!',
        1500,
        'middle',
        'toast-bright'
      );
      expect(viewSpy).toHaveBeenCalled();
      done();
    }, 10);
  }); // end 'should submit a signup form and get a success response' test

  test('should submit a signup form and get an error response', done => {
    signupPage.signupForm = buildForm();

    fixture.detectChanges();

    userService.signUp = jest
      .fn()
      .mockReturnValue(new ErrorObservable('<400> Username already exists'));

    const formControls: { [key: string]: AbstractControl } = signupPage
      .signupForm
      .controls;
    formControls.username.setValue('test-user');
    formControls.password.setValue('abcdefghij1K%');
    formControls.passwordConfirmation.setValue('abcdefghij1K%');
    formControls.email.setValue('test@email.com');

    expect(signupPage.signupForm.valid).toBe(true);

    const toastSpy: jest.SpyInstance = jest.spyOn(toastService, 'presentToast');

    signupPage.onSubmit();

    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith(
        '<400> Username already exists',
        2000
      );
      done();
    }, 10);
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
