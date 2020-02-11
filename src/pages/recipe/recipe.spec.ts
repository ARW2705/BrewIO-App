/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, NavController, NavParams, Events, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { NavMock } from '../../../test-config/mocks-ionic';
import { NavParamsMock } from '../../../test-config/mocks-ionic';
import { ToastControllerMock } from '../../../test-config/mocks-ionic';
import { StorageMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { RecipePage } from './recipe';
import { RecipeMasterDetailPage } from '../recipe-master-detail/recipe-master-detail';
import { ProcessPage } from '../process/process';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessProvider } from '../../providers/process/process';
import { ToastProvider } from '../../providers/toast/toast';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';


describe('Recipe Page', () => {

  describe('Component creation', () => {
    let fixture: ComponentFixture<RecipePage>;
    let recipePage: RecipePage;
    let injector: TestBed;
    let httpMock: HttpTestingController;
    let recipeService: RecipeProvider;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipePage,
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipePage),
          HttpClientTestingModule
        ],
        providers: [
          UserProvider,
          RecipeProvider,
          ProcessProvider,
          ToastProvider,
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(async(() => {
      injector = getTestBed();
      recipeService = injector.get(RecipeProvider);
      httpMock = injector.get(HttpTestingController);
      recipeService.initializeRecipeMasterList();

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      recipeReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(RecipePage);
      recipePage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should create the component', () => {
      expect(recipePage).toBeDefined();
    }); // end 'should create the component' test

    test('should have a list of recipe masters', () => {
      expect(recipePage.masterRecipeList.length).toBe(2);
    }); // end 'should have a list of recipe masters' test

  }); // end 'Component creation' section

  describe('Navigation handling', () => {
    let fixture: ComponentFixture<RecipePage>;
    let recipePage: RecipePage;
    let injector: TestBed;
    let httpMock: HttpTestingController;
    let recipeService: RecipeProvider;
    let eventService: Events;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipePage,
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipePage),
          HttpClientTestingModule
        ],
        providers: [
          UserProvider,
          RecipeProvider,
          ToastProvider,
          Events,
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: ProcessProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(async(() => {
      injector = getTestBed();
      recipeService = injector.get(RecipeProvider);
      httpMock = injector.get(HttpTestingController);
      eventService = injector.get(Events);
      recipeService.initializeRecipeMasterList();

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      recipeReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(RecipePage);
      recipePage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should navigate to brewing process page with a recipe', done => {
      const _mockRecipeMaster = mockRecipeMasterActive();
      const navSpy = jest.spyOn(recipePage.navCtrl, 'push');
      eventService.subscribe('update-nav-header', data => {
        expect(data.dest).toMatch('process');
        expect(data.destType).toMatch('page');
        expect(data.destTitle).toMatch(_mockRecipeMaster.master);
        expect(data.origin).toMatch('mock-active-name');
        done();
      });
      recipePage.navToBrewProcess(_mockRecipeMaster);
      expect(navSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: _mockRecipeMaster,
          requestedUserId: _mockRecipeMaster.owner,
          selectedRecipeId: _mockRecipeMaster.master
        }
      );
    }); // end 'should navigate to brewing process page with a recipe' test

    test('should fail to navigate to brewing process page when missing a recipe', () => {
      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.master = 'expect-none';
      const toastSpy = jest.spyOn(recipePage.toastService, 'presentToast');
      recipePage.navToBrewProcess(_mockRecipeMaster);
      expect(toastSpy).toHaveBeenCalledWith(
        'Recipe missing a process guide!',
        2000
      );
    }); // end 'should fail to navigate to brewing process page when missing a recipe' test

    test('should navigate to recipe master details page for master at given index', done => {
      const _mockRecipeMaster = mockRecipeMasterInactive();
      const navSpy = jest.spyOn(recipePage.navCtrl, 'push');
      eventService.subscribe('update-nav-header', data => {
        expect(data.destType).toMatch('page');
        expect(data.destTitle).toMatch(_mockRecipeMaster.name);
        expect(data.origin).toMatch('mock-active-name');
        done();
      });
      recipePage.navToDetails(1);
      expect(navSpy).toHaveBeenCalledWith(
        RecipeMasterDetailPage,
        {
          masterId: _mockRecipeMaster._id
        }
      );
    }); // end 'should navigate to recipe master details page for master at given index' test

    test('should fail to navigate to the recipe master details page with an invalid index', () => {
      const toastSpy = jest.spyOn(recipePage.toastService, 'presentToast');
      recipePage.navToDetails(2);
      expect(toastSpy).toHaveBeenCalledWith(
        'Error: invalid Recipe Master list index',
        2000
      );
    }); // end 'should fail to navigate to the recipe master details page with an invalid index' test

    test('should navigate to the recipe form in creation mode', done => {
      const navSpy = jest.spyOn(recipePage.navCtrl, 'push');
      eventService.subscribe('update-nav-header', data => {
        expect(data.dest).toMatch('recipe-form');
        expect(data.destType).toMatch('page');
        expect(data.destTitle).toMatch('Create Recipe');
        expect(data.origin).toMatch('mock-active-name');
        done();
      });
      recipePage.navToRecipeForm();
      expect(navSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'master',
          mode: 'create'
        }
      );
    }); // end 'should navigate to the recipe form in creation mode' test

  }); // end 'Navigation handling' section

  describe('Utility methods', () => {
    let fixture: ComponentFixture<RecipePage>;
    let recipePage: RecipePage;
    let injector: TestBed;
    let httpMock: HttpTestingController;
    let recipeService: RecipeProvider;
    let userService: UserProvider;

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipePage,
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipePage),
          HttpClientTestingModule
        ],
        providers: [
          UserProvider,
          RecipeProvider,
          ProcessProvider,
          ToastProvider,
          Events,
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: Storage, useClass: StorageMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(async(() => {
      injector = getTestBed();
      recipeService = injector.get(RecipeProvider);
      userService = injector.get(UserProvider);
      httpMock = injector.get(HttpTestingController);
      recipeService.initializeRecipeMasterList();

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      recipeReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(RecipePage);
      recipePage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should delete a recipe master', done => {
      const recipeSpy = jest.spyOn(recipePage.recipeService, 'deleteRecipeMasterById');
      expect(recipePage.masterList.length).toBe(2);
      const _mockRecipeMaster = mockRecipeMasterInactive();

      recipePage.deleteMaster(_mockRecipeMaster);

      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalled();
        expect(recipePage.masterList.length).toBe(1);
        done();
      }, 1000);

      const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMaster._id}`);
      deleteReq.flush(_mockRecipeMaster);
    }); // end 'should delete a recipe master' test

    test('should fail to delete a recipe master if a batch is active', () => {
      const toastSpy = jest.spyOn(recipePage.toastService, 'presentToast');
      recipePage.deleteMaster(mockRecipeMasterActive());
      expect(toastSpy).toHaveBeenCalledWith(
        'Cannot delete a recipe master with a batch in progress',
        3000
      );
    }); // end 'should fail to delete a recipe master if a batch is active' test

    test('should toggle a recipe master at index to be expanded', () => {
      expect(recipePage.masterIndex).toBe(-1);
      recipePage.expandMaster(1);
      expect(recipePage.masterIndex).toBe(1);
      recipePage.expandMaster(1);
      expect(recipePage.masterIndex).toBe(-1);
    }); // end 'should toggle a recipe master at index to be expanded' test

    test('should check if user is logged in', () => {
      expect(recipePage.isLoggedIn()).toBe(false);
      const _mockUser = mockUser();
      userService.user$.next(_mockUser);
      expect(recipePage.isLoggedIn()).toBe(true);
    }); // end 'should check if user is logged in' test

    test('should compose the recipe master list with values from recipe set as the master', () => {
      recipePage.masterRecipeList = [];
      recipePage.mapMasterRecipes();
      expect(recipePage.masterRecipeList.length).toBe(2);
    }); // end 'should compose the recipe master list with values from recipe set as the master' test

    test('should mark given recipe master index as being expanded', () => {
      recipePage.masterIndex = 0;
      expect(recipePage.showExpandedMaster(0)).toBe(true);
      expect(recipePage.showExpandedMaster(1)).toBe(false);
      expect(recipePage.showExpandedMaster(2)).toBe(false);
    }); // end 'should mark given recipe master index as being expanded' test

  }); // end 'Utility methods' section

});