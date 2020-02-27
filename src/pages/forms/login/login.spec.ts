/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

/* Constants imports */
import { baseURL } from '../../../shared/constants/base-url';
import { apiVersion } from '../../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { NavMock, NavParamsMock, StorageMock, ViewControllerMock, ToastControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { LoginPage } from './login';

/* Provider imports */
import { UserProvider } from '../../../providers/user/user';
import { ToastProvider } from '../../../providers/toast/toast';
import { FormValidatorProvider } from '../../../providers/form-validator/form-validator';
import { ProcessProvider } from '../../../providers/process/process';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { ProcessHttpErrorProvider } from '../../../providers/process-http-error/process-http-error';


describe('Login Form', () => {
  let fixture: ComponentFixture<LoginPage>;
  let loginPage: LoginPage;
  let httpMock: HttpTestingController;
  let injector: TestBed;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        LoginPage
      ],
      imports: [
        IonicModule.forRoot(LoginPage),
        HttpClientTestingModule
      ],
      providers: [
        UserProvider,
        ToastProvider,
        ProcessProvider,
        RecipeProvider,
        FormValidatorProvider,
        ProcessHttpErrorProvider,
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock },
        { provide: ToastController, useClass: ToastControllerMock },
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
    fixture = TestBed.createComponent(LoginPage);
    loginPage = fixture.componentInstance;
  });

  afterEach(() => {
    httpMock.verify();
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
    const viewSpy = jest.spyOn(loginPage.viewCtrl, 'dismiss');
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
    const formControls = loginPage.loginForm.controls;
    formControls.username.setValue('test-user');
    formControls.password.setValue('abcdefghij1K%');
    expect(loginPage.loginForm.valid).toBe(true);
    const toastSpy = jest.spyOn(loginPage.toastService, 'presentToast');
    const viewSpy = jest.spyOn(loginPage.viewCtrl, 'dismiss');
    loginPage.onSubmit();

    const response = {
      success: true,
      user: {
        username: 'test-user'
      }
    };
    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith(`Welcome ${response.user.username}!`, 1000, 'middle', 'bright-toast');
      expect(viewSpy).toHaveBeenCalledWith(response);
      done();
    }, 10);

    const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
    loginReq.flush(response);

    const processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
    processReq.flush([]);

    const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
    recipeReq.flush([]);
  }); // end 'should submit a login form and get a success response' test

  test('should submit a login form and get an error response', done => {
    fixture.detectChanges();
    const formControls = loginPage.loginForm.controls;
    formControls.username.setValue('test-user');
    formControls.password.setValue('abcdefghij1K%');
    expect(loginPage.loginForm.valid).toBe(true);
    const toastSpy = jest.spyOn(loginPage.toastService, 'presentToast');
    loginPage.onSubmit();

    setTimeout(() => {
      expect(toastSpy).toHaveBeenCalledWith('<401> Username or Password is incorrect: ', 5000, 'bottom');
      done();
    }, 10);

    const loginReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/login`);
    loginReq.error(new ErrorEvent('Login Error'), {status: 401, statusText: 'Username or Password is incorrect'});
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
