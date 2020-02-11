/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, ToastController, ModalController } from 'ionic-angular';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicStorageModule } from '@ionic/storage';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { NavMock } from '../../../test-config/mocks-ionic';
import { StorageMock } from '../../../test-config/mocks-ionic';
import { ToastControllerMock } from '../../../test-config/mocks-ionic';
import { ModalControllerMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { UserPage } from './user';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';
import { ModalProvider } from '../../providers/modal/modal';
import { ToastProvider } from '../../providers/toast/toast';


describe('User Page', () => {

  describe('Page component creation', () => {
    let userPage: UserPage;
    let fixture: ComponentFixture<UserPage>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          UserPage
        ],
        imports: [
          IonicModule.forRoot(UserPage),
          IonicStorageModule.forRoot(),
          HttpClientTestingModule,
          FormsModule,
          ReactiveFormsModule
        ],
        providers: [
          UserProvider,
          { provide: NavController, useValue: {} },
          { provide: ProcessProvider, useValue: {} },
          { provide: RecipeProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: ModalProvider, useValue: {} },
          { provide: ToastProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock }
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(UserPage);
      userPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should create the component', () => {
      expect(userPage).toBeDefined();
    }); // end 'should create the component' test

    test('should have an empty user', () => {
      expect(userPage.user$).not.toBeNull();
    }); // end 'should have an empty user' test

  }); // end 'Page component creation' section


  describe('Page with user', () => {
    let userPage: UserPage;
    let fixture: ComponentFixture<UserPage>;
    let injector: TestBed;
    let httpMock: HttpTestingController;
    let userService: UserProvider;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          UserPage
        ],
        imports: [
          IonicModule.forRoot(UserPage),
          IonicStorageModule.forRoot(),
          HttpClientTestingModule
        ],
        providers: [
          // NavController,
          UserProvider,
          ToastProvider,
          { provide: NavController, useValue: {} },
          { provide: ProcessProvider, useValue: {} },
          { provide: RecipeProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: ModalProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock },
          { provide: ToastController, useClass: ToastControllerMock }
        ]
      })
      .compileComponents();
    }));

    afterEach(() => {
      httpMock.verify();
    });

    beforeEach(async(() => {
      injector = getTestBed();
      userService = injector.get(UserProvider);
      httpMock = injector.get(HttpTestingController);
      userService.user$.next(mockUser());
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(UserPage);
      userPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should have new updated values', () => {
      userPage.originalValues.email = 'new-email';
      expect(userPage.hasValuesToUpdate()).toBe(true);
    }); // end 'should have new updated values' test

    test('should stop editing', () => {
      userPage.changeEdit('email', null);
      expect(userPage.editing).toMatch('');
    }); // end 'should stop editing' test

    test('should init form with user', () => {
      const _mockUser = mockUser();
      expect(userPage.userForm.controls.email.value).toMatch(_mockUser.email);
      expect(userPage.userForm.controls.firstname.value).toMatch(_mockUser.firstname);
      expect(userPage.userForm.controls.lastname.value).toMatch(_mockUser.lastname);
    }); // end 'should init form with user' test

    test('should be logged in', () => {
      expect(userPage.isLoggedIn()).toBe(true);
    }); // end 'should be logged in' test

    test('should change editing to \'email\'', () => {
      userPage.changeEdit('email', undefined);
      expect(userPage.editing).toMatch('email');
    }); // end 'should change editing to \'email\'' test

    test('should change editing to \'firstname\'', () => {
      userPage.changeEdit('firstname', undefined);
      expect(userPage.editing).toMatch('firstname');
    }); // end 'should change editing to \'firstname\'' test

    test('should change editing to \'lastname\'', () => {
      userPage.changeEdit('lastname', undefined);
      expect(userPage.editing).toMatch('lastname');
    }); // end 'should change editing to \'lastname\'' test

    test('should stop editing', () => {
      userPage.changeEdit('email', null);
      expect(userPage.editing).toMatch('');
    }); // end 'should stop editing' test

    test('should submit an update', () => {
      const _mockUser = mockUser();
      const onUpdateSpy = jest.spyOn(userPage, 'updateForm');
      userPage.onUpdate();

      const updateReq = httpMock.expectOne(`${baseURL}/${apiVersion}/users/profile`);
      expect(updateReq.request.method).toMatch('PATCH');
      updateReq.flush({
        email: _mockUser.email,
        firstname: _mockUser.firstname,
        lastname: _mockUser.lastname
      });

      fixture.detectChanges();
      expect(onUpdateSpy).toHaveBeenCalled();
    }); // end 'should submit an update' test

  }); // end 'Page with user' section


  describe('Page without user', () => {
    let userPage: UserPage;
    let fixture: ComponentFixture<UserPage>;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          UserPage
        ],
        imports: [
          IonicModule.forRoot(UserPage),
          IonicStorageModule.forRoot(),
          HttpClientTestingModule
        ],
        providers: [
          UserProvider,
          { provide: NavController, useValue: {} },
          { provide: ProcessProvider, useValue: {} },
          { provide: RecipeProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: ModalProvider, useValue: {} },
          { provide: ToastProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock }
        ]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(UserPage);
      userPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should init default form', () => {
      expect(userPage.userForm.controls.email.value).toMatch('');
    }); // end 'should init default form' test

    test('should have no new updated values', () => {
      expect(userPage.hasValuesToUpdate()).toBe(false);
    }); // end 'should have no new updated values' test

    test('should be logged out', () => {
      expect(userPage.isLoggedIn()).toBe(false);
    }); // end 'should be logged out' test

  }); // end 'Page without user' section


  describe('Utility actions', () => {
    let userPage: UserPage;
    let fixture: ComponentFixture<UserPage>;
    let injector: TestBed;
    let modalService: ModalProvider;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          UserPage
        ],
        imports: [
          IonicModule.forRoot(UserPage),
          IonicStorageModule.forRoot(),
          HttpClientTestingModule,
          FormsModule,
          ReactiveFormsModule
        ],
        providers: [
          UserProvider,
          ModalProvider,
          { provide: NavController, useValue: NavMock },
          { provide: ProcessProvider, useValue: {} },
          { provide: RecipeProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: ToastProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock },
          { provide: ModalController, useClass: ModalControllerMock }
        ]
      })
      .compileComponents();
    }));

    beforeEach(async(() => {
      injector = getTestBed();
      modalService = injector.get(ModalProvider);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(UserPage);
      userPage = fixture.componentInstance;
    });

    test('should be in editing for field', () => {
      const field = 'firstname';
      userPage.editing = field;
      fixture.detectChanges();
      expect(userPage.isEditing(field)).toBe(true);
    }); // end 'should be in editing for field' test

    test('should not be in editing for field', () => {
      const field = 'email';
      userPage.editing = '';
      fixture.detectChanges();
      expect(userPage.isEditing(field)).toBe(false);
    }); // end 'should not be in editing for field' test

    test('should map new values to original values', () => {
      const newValues = {
        email: 'new-email',
        firstname: 'new-firstname',
        lastname: 'new-lastname'
      };
      userPage.mapOriginalValues(newValues);
      fixture.detectChanges();
      expect(userPage.originalValues.email).toMatch(newValues.email);
      expect(userPage.originalValues.firstname).toMatch(newValues.firstname);
      expect(userPage.originalValues.lastname).toMatch(newValues.lastname);
    }); // end 'should map new values to original values' test

    test('should open login modal', () => {
      fixture.detectChanges();
      const modalSpy = jest.spyOn(modalService, 'openLogin');
      userPage.openLogin();
      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open login modal' test

    test('should open signup modal', () => {
      fixture.detectChanges();
      const modalSpy = jest.spyOn(modalService, 'openSignup');
      userPage.openSignup();
      expect(modalSpy).toHaveBeenCalled();
    }); // end 'should open signup modal' test

    test('should update original values and reset form with values', () => {
      fixture.detectChanges();
      const newValues = {
        email: 'new-email',
        firstname: 'new-firstname',
        lastname: 'new-lastname'
      };
      userPage.updateForm(newValues);
      expect(userPage.originalValues.email).toMatch(newValues.email);
      expect(userPage.originalValues.firstname).toMatch(newValues.firstname);
      expect(userPage.originalValues.lastname).toMatch(newValues.lastname);
      expect(userPage.userForm.value.email).toMatch(newValues.email);
      expect(userPage.userForm.value.firstname).toMatch(newValues.firstname);
      expect(userPage.userForm.value.lastname).toMatch(newValues.lastname);
    }); // end 'should update original values and reset form with values' test

  }); // end 'Utility actions' section

});
