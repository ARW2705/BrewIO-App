/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController, NavController, Events, ItemSliding } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import {
  CalculatePipeMock,
  ModalControllerMock,
  ModalMock,
  NavMock,
  RatioPipeMock,
  RoundPipeMock,
  SortPipeMock,
  TruncatePipeMock,
  UnitConversionPipeMock
} from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { User } from '../../shared/interfaces/user';

/* Page imports */
import { RecipePage } from './recipe';
import { ConfirmationPage } from '../confirmation/confirmation';
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
  let modalCtrl: ModalController;
  let navCtrl: NavController;
  let originalNgOnInit: () => void;
  let originalNgOnDestroy: () => void;
  let originalWillEnter: () => void;
  let originalDidLeave: () => void;
  const staticRecipeMaster: RecipeMaster = mockRecipeMasterActive();
  const staticRecipeVariant: RecipeVariant = mockRecipeVariantComplete();
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        CalculatePipeMock,
        ConfirmationPage,
        RecipePage,
        RatioPipeMock,
        RoundPipeMock,
        SortPipeMock,
        TruncatePipeMock,
        UnitConversionPipeMock
      ],
      imports: [
        IonicModule.forRoot(RecipePage)
      ],
      providers: [
        { provide: RecipeProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: ModalController, useClass: ModalControllerMock },
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

    eventService.publish = jest
      .fn();

    recipeService.getCombinedHopsSchedule = jest
      .fn()
      .mockImplementation(
        (input: any): any => {
          return input;
        }
      );

    toastService.presentToast = jest
      .fn();

    userService.getUser = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<User>(mockUser()));
    userService.isLoggedIn = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipePage);
    recipePage = fixture.componentInstance;
    navCtrl = injector.get(NavController);

    navCtrl.push = jest
      .fn();
    navCtrl.popToRoot = jest
      .fn();

    originalNgOnInit = recipePage.ngOnInit;
    recipePage.ngOnInit = jest
      .fn();
    originalNgOnDestroy = recipePage.ngOnDestroy;
    recipePage.ngOnDestroy = jest
      .fn();
    originalDidLeave = recipePage.ionViewDidLeave;
    recipePage.ionViewDidLeave = jest
      .fn();
    originalWillEnter = recipePage.ionViewWillEnter;
    recipePage.ionViewWillEnter = jest
      .fn();
  });

  describe('Component creation', () => {

    test('should create the component', () => {
      recipePage.ngOnInit = originalNgOnInit;
      recipePage.ngOnDestroy = originalNgOnDestroy;
      recipePage.ionViewDidLeave = originalDidLeave;
      recipePage.ionViewWillEnter = originalWillEnter;

      recipePage.mapMasterRecipes = jest
        .fn();
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>(
            [
              new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
              new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
            ]
          )
        );

      fixture.detectChanges();

      expect(recipePage).toBeDefined();
      expect(recipePage.masterList.length).toBe(2);
      expect(recipePage.isLoggedIn).toBe(true);
    }); // end 'should create the component' test

    test('should refresh pipe flag on enter', () => {
      recipePage.ionViewWillEnter = originalWillEnter;

      fixture.detectChanges();

      expect(recipePage.refreshPipes).toBe(false);

      recipePage.ionViewWillEnter();

      expect(recipePage.refreshPipes).toBe(true);
    }); // end 'should refresh pipe flag on enter' test

    test('should close all sliding items on exit', () => {
      recipePage.masterList = [
        staticRecipeMaster,
        staticRecipeMaster
      ];
      recipePage.variantList = [
        staticRecipeVariant,
        staticRecipeVariant
      ];
      recipePage.ionViewDidLeave = originalDidLeave;

      fixture.detectChanges();

      const slideSpies: jest.SpyInstance[] = recipePage
        .slidingItems
        .map((slidingItem: ItemSliding): jest.SpyInstance => {
          return jest.spyOn(slidingItem, 'close');
        });

      recipePage.ionViewDidLeave();

      slideSpies.forEach(
        (slideSpy: jest.SpyInstance): void => {
          expect(slideSpy).toHaveBeenCalled();
        }
      );
    }); // end 'should close all sliding items on exit' test

  }); // end 'Component creation' section

  describe('Navigation handling', () => {

    test('should handle a nav stack reset event', () => {
      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'popToRoot');

      fixture.detectChanges();

      recipePage.handleStackReset();

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle a nav stack reset event' test

    test('should navigate to brewing process page with a recipe', () => {
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(true);

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterActive();

      const navSpy: jest.SpyInstance = jest.spyOn(recipePage.navCtrl, 'push');

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

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.master = 'expect-none';

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      recipePage.navToBrewProcess(_mockRecipeMaster);

      expect(toastSpy).toHaveBeenCalledWith(
        'Recipe missing a process guide!',
        2000
      );
    }); // end 'should fail to navigate to brewing process page when missing a recipe' test

    test('should navigate to recipe master details page for master at given index', () => {
      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterInactive();

      recipePage.masterList = [
        _mockRecipeMaster,
        _mockRecipeMaster,
        _mockRecipeMaster
      ];

      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(recipePage.navCtrl, 'push');

      recipePage.navToDetails(1);

      expect(navSpy).toHaveBeenCalledWith(
        RecipeDetailPage,
        {
          masterId: _mockRecipeMaster._id
        }
      );
    }); // end 'should navigate to recipe master details page for master at given index' test

    test('should fail to navigate to the recipe master details page with an invalid index', () => {
      recipePage.masterList = [];

      fixture.detectChanges();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(recipePage.toastService, 'presentToast');

      recipePage.navToDetails(2);

      expect(toastSpy).toHaveBeenCalledWith(
        'Error: invalid Recipe Master list index',
        2000
      );
    }); // end 'should fail to navigate to the recipe master details page with an invalid index' test

    test('should navigate to the recipe form in creation mode', () => {
      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(recipePage.navCtrl, 'push');

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


  describe('Modal methods', () => {

    beforeEach(() => {
      modalCtrl = injector.get(ModalController);
      recipePage.masterList = [
        staticRecipeMaster
      ];
    });

    test('should open confirmation modal', () => {
      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      fixture.detectChanges();

      recipePage.confirmDelete(0);

      expect(modalSpy).toHaveBeenCalledWith(
        ConfirmationPage,
        {
          title: 'Recipe',
          message: `Confirm deletion of "${staticRecipeMaster.name}" and its variants`,
          subMessage: 'This action cannot be reversed'
        }
      );
    }); // end 'should open confirmation modal' test

    test('should handle confirmation modal dismiss', () => {
      fixture.detectChanges();

      const _mockModal: ModalMock = new ModalMock();

      recipePage.deleteMaster = jest
        .fn();
      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      const deleteSpy: jest.SpyInstance = jest.spyOn(recipePage, 'deleteMaster');

      _mockModal._setCallBackData(true);

      recipePage.confirmDelete(0);

      expect(deleteSpy.mock.calls[0][0]).toEqual(0);

      _mockModal._setCallBackData(false);

      recipePage.confirmDelete(0);

      expect(deleteSpy.mock.calls.length).toEqual(1);
    }); // end 'should handle confirmation modal dismiss' test

  }); // end 'Modal methods' section


  describe('Utility methods', () => {

    beforeEach(() => {
      recipePage.masterList = [
        staticRecipeMaster,
        staticRecipeMaster,
        staticRecipeMaster
      ];
    });

    test('should delete a recipe master', () => {
      fixture.detectChanges();

      recipeService.deleteRecipeMasterById = jest
        .fn()
        .mockReturnValue(of({}));

      const recipeSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'deleteRecipeMasterById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      recipePage.deleteMaster(1);

      expect(recipeSpy).toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalledWith(
        'Deleted Recipe',
        1000
      );
    }); // end 'should delete a recipe master' test

    test('should display error feedback if a recipe master failed to be deleted', () => {
      fixture.detectChanges();

      recipeService.deleteRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('delete error'));

      const toastSpy: jest.SpyInstance = jest
        .spyOn(recipePage.toastService, 'presentToast');

      recipePage.deleteMaster(0);

      expect(toastSpy).toHaveBeenCalledWith(
        'An error occured during recipe deletion',
        2000
      );
    }); // end 'should display error feedback if a recipe master failed to be deleted' test

    test('should toggle a recipe master at index to be expanded', () => {
      fixture.detectChanges();

      expect(recipePage.masterIndex).toBe(-1);

      recipePage.expandMaster(1);

      expect(recipePage.masterIndex).toBe(1);

      recipePage.expandMaster(1);

      expect(recipePage.masterIndex).toBe(-1);
    }); // end 'should toggle a recipe master at index to be expanded' test

    test('should compose the recipe master list with values from recipe set as the master', () => {
      fixture.detectChanges();

      recipePage.mapMasterRecipes();

      expect(recipePage.variantList.length).toBe(3);
    }); // end 'should compose the recipe master list with values from recipe set as the master' test

  }); // end 'Utility methods' section

});
