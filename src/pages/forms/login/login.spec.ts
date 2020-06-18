/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { NavMock, NavParamsMock, ViewControllerMock, ToastControllerMock } from '../../../../test-config/mocks-ionic';
import { mockUser } from '../../../../test-config/mockmodels/mockUser';

/* Page imports */
import { LoginPage } from './login';

/* Provider imports */
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';


describe('Login Form', () => {
  let fixture: ComponentFixture<LoginPage>;
  let loginPage: LoginPage;
  let injector: TestBed;
  let userService: UserProvider;
  let toastService: ToastProvider;
  let viewCtrl: ViewController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        LoginPage
      ],
      imports: [
        IonicModule.forRoot(LoginPage)
      ],
      providers: [
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock },
        { provide: ToastController, useClass: ToastControllerMock }
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
    viewCtrl = injector.get(ViewController);

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginPage);
    loginPage = fixture.componentInstance;
  });

  test('should create component', () => {
    fixture.detectChanges();

    expect(loginPage).toBeDefined();
  }); // end 'should create component' test

  test('should initialize the form', () => {
    fixture.detectChanges();

    expect(loginPage.loginForm).toBeDefined();
  }); // end 'should initialize the form' test

  test('should be invalid when form is empty', () => {
    fixture.detectChanges();

    expect(loginPage.loginForm.valid).toBe(false);
  }); // end 'should be invalid when form is empty' test

  test('should close the modal', () => {
    fixture.detectChanges();

    const viewSpy = jest.spyOn(viewCtrl, 'dismiss');

    loginPage.dismiss();

    expect(viewSpy).toHaveBeenCalledWith();
  }); // end 'should close the modal' test

  test('should have require form field error', () => {
    fixture.detectChanges();

    const usernameControl = loginPage.loginForm.controls.username;

    usernameControl.markAsTouched();

    expect(usernameControl.errors.required).toBeTruthy();
  }); // end 'should have require form field error' test

  test('should submit a login form and get a success response', done => {
    fixture.detectChanges();

    userService.logIn = jest
      .fn()
      .mockReturnValue(of(mockUser()));

    const formControls = loginPage.loginForm.controls;
    formControls.username.setValue('test-user');
    formControls.password.setValue('abcdefghij1K%');

    expect(loginPage.loginForm.valid).toBe(true);

    const toastSpy = jest.spyOn(toastService, 'presentToast');
    const viewSpy = jest.spyOn(viewCtrl, 'dismiss');

    loginPage.onSubmit();

    const _mockUser = mockUser();
    const response = {
      success: true,
      user: _mockUser
    };
    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith(`Welcome ${response.user.username}!`, 1000, 'middle', 'bright-toast');
      expect(viewSpy).toHaveBeenCalledWith(_mockUser);
      done();
    }, 10);
  }); // end 'should submit a login form and get a success response' test

  test('should submit a login form and get an error response', done => {
    fixture.detectChanges();

    userService.logIn = jest
      .fn()
      .mockReturnValue(new ErrorObservable('<401> Username or Password is incorrect'));

    const formControls = loginPage.loginForm.controls;
    formControls.username.setValue('test-user');
    formControls.password.setValue('abcdefghij1K%');

    expect(loginPage.loginForm.valid).toBe(true);

    const toastSpy = jest.spyOn(toastService, 'presentToast');

    loginPage.onSubmit();

    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith('<401> Username or Password is incorrect', 5000, 'bottom');
      done();
    }, 10);
  }); // end 'should submit a login form and get an error response' test

  test('should toggle password visibility', () => {
    fixture.detectChanges();

    expect(loginPage.showPassword).toBe(false);

    loginPage.togglePasswordVisible();

    expect(loginPage.showPassword).toBe(true);

    loginPage.togglePasswordVisible();

    expect(loginPage.showPassword).toBe(false);
  }); // end 'should toggle password visibility' test

});
