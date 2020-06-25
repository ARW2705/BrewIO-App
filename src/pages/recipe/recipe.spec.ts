/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, NavController, Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { NavMock, SortPipeMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';

/* Page imports */
import { RecipePage } from './recipe';
import { RecipeDetailPage } from '../recipe-detail/recipe-detail';
import { ProcessPage } from '../process/process';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';

/* Provider imports */
import { UserProvider } from '../../providers/user/user';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';


describe('Recipe Page', () => {
  let fixture: ComponentFixture<RecipePage>;
  let recipePage: RecipePage;
  let injector: TestBed;
  let recipeService: RecipeProvider;
  let eventService: Events;
  let toastService: ToastProvider;
  let userService: UserProvider;
  let navCtrl: NavController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        RecipePage,
        RecipeDetailPage,
        ProcessPage,
        RecipeFormPage,
        SortPipeMock
      ],
      imports: [
        IonicModule.forRoot(RecipePage)
      ],
      providers: [
        { provide: RecipeProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: NavController, useClass: NavMock },
        { provide: UserProvider, useValue: {} }
      ],
      schemas: [
        NO_ERRORS_SCHEMA
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    recipeService = injector.get(RecipeProvider);
    toastService = injector.get(ToastProvider);
    userService = injector.get(UserProvider);
    eventService = injector.get(Events);
    navCtrl = injector.get(NavController);

    navCtrl.push = jest
      .fn();
  }));

  beforeEach(async(() => {
    recipeService.getMasterList = jest
      .fn()
      .mockReturnValue(
        new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>(
          [
            new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
            new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
          ]
        )
      );
    userService.isLoggedIn = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipePage);
    recipePage = fixture.componentInstance;
  });

  describe('Component creation', () => {
    test('should create the component', () => {
      fixture.detectChanges();

      expect(recipePage).toBeDefined();
    }); // end 'should create the component' test

    test('should have a list of recipe masters', () => {
      fixture.detectChanges();

      expect(recipePage.masterList.length).toBe(2);
    }); // end 'should have a list of recipe masters' test

  }); // end 'Component creation' section

  describe('Navigation handling', () => {

    test('should navigate to brewing process page with a recipe', () => {
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(true);

      const _mockRecipeMaster = mockRecipeMasterActive();

      const navSpy = jest.spyOn(recipePage.navCtrl, 'push');

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
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(false);

      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.master = 'expect-none';

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      recipePage.navToBrewProcess(_mockRecipeMaster);

      expect(toastSpy).toHaveBeenCalledWith(
        'Recipe missing a process guide!',
        2000
      );
    }); // end 'should fail to navigate to brewing process page when missing a recipe' test

    test('should navigate to recipe master details page for master at given index', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();

      const navSpy = jest.spyOn(recipePage.navCtrl, 'push');

      recipePage.navToDetails(1);

      expect(navSpy).toHaveBeenCalledWith(
        RecipeDetailPage,
        {
          masterId: _mockRecipeMaster._id
        }
      );
    }); // end 'should navigate to recipe master details page for master at given index' test

    test('should fail to navigate to the recipe master details page with an invalid index', () => {
      fixture.detectChanges();

      const toastSpy = jest.spyOn(recipePage.toastService, 'presentToast');

      recipePage.navToDetails(2);

      expect(toastSpy.mock.calls[0][0]).toMatch('Error: invalid Recipe Master list index');
      expect(toastSpy.mock.calls[0][1]).toBe(2000);
    }); // end 'should fail to navigate to the recipe master details page with an invalid index' test

    test('should navigate to the recipe form in creation mode', () => {
      fixture.detectChanges();

      const navSpy = jest.spyOn(recipePage.navCtrl, 'push');

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
    test('should delete a recipe master', done => {
      fixture.detectChanges();

      recipeService.deleteRecipeMasterById = jest
        .fn()
        .mockReturnValue(of({}));

      const recipeSpy = jest.spyOn(recipeService, 'deleteRecipeMasterById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipePage.deleteMaster(_mockRecipeMasterInactive);

      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalled();
        expect(toastSpy.mock.calls[0][0]).toMatch('Deleted Recipe');
        expect(toastSpy.mock.calls[0][1]).toBe(1000);
        done();
      }, 10);
    }); // end 'should delete a recipe master' test

    test('should fail to delete a recipe master if a batch is active', () => {
      fixture.detectChanges();

      const toastSpy = jest.spyOn(recipePage.toastService, 'presentToast');

      recipePage.deleteMaster(mockRecipeMasterActive());

      expect(toastSpy.mock.calls[0][0]).toMatch('Cannot delete a recipe master with a batch in progress');
      expect(toastSpy.mock.calls[0][1]).toBe(3000);
    }); // end 'should fail to delete a recipe master if a batch is active' test

    test('should display error feedback if a recipe master failed to be deleted', done => {
      fixture.detectChanges();

      recipeService.deleteRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('delete error'));

      const toastSpy = jest.spyOn(recipePage.toastService, 'presentToast');

      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.hasActiveBatch = false;

      recipePage.deleteMaster(_mockRecipeMaster);

      setTimeout(() => {
        expect(toastSpy.mock.calls[0][0]).toMatch('An error occured during recipe deletion');
        expect(toastSpy.mock.calls[0][1]).toBe(2000);
        done();
      }, 10);
    }); // end 'should display error feedback if a recipe master failed to be deleted' test

    test('should toggle a recipe master at index to be expanded', () => {
      fixture.detectChanges();

      expect(recipePage.masterIndex).toBe(-1);

      recipePage.expandMaster(1);

      expect(recipePage.masterIndex).toBe(1);

      recipePage.expandMaster(1);

      expect(recipePage.masterIndex).toBe(-1);
    }); // end 'should toggle a recipe master at index to be expanded' test

    test('should check if user is logged in', () => {
      fixture.detectChanges();

      // first value should be true
      expect(recipePage.isLoggedIn()).toBe(true);
      // second value should be false
      expect(recipePage.isLoggedIn()).toBe(false);
    }); // end 'should check if user is logged in' test

    test('should compose the recipe master list with values from recipe set as the master', () => {
      fixture.detectChanges();

      recipePage.mapMasterRecipes();

      expect(recipePage.masterList.length).toBe(2);
    }); // end 'should compose the recipe master list with values from recipe set as the master' test

    test('should mark given recipe master index as being expanded', () => {
      fixture.detectChanges();

      recipePage.masterIndex = 0;

      expect(recipePage.showExpandedMaster(0)).toBe(true);
      expect(recipePage.showExpandedMaster(1)).toBe(false);
      expect(recipePage.showExpandedMaster(2)).toBe(false);
    }); // end 'should mark given recipe master index as being expanded' test

  }); // end 'Utility methods' section

});
