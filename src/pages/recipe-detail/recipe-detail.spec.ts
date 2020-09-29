/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, ModalController, NavController, NavParams, Events, ItemSliding } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockRecipeVariantIncomplete } from '../../../test-config/mockmodels/mockRecipeVariantIncomplete';
import { ModalControllerMock, ModalMock, NavMock, NavParamsMock, EventsMock, RoundPipeMock, TruncatePipeMock, UnitConversionPipeMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Page imports */
import { RecipeDetailPage } from './recipe-detail';
import { ConfirmationPage } from '../confirmation/confirmation';
import { ProcessPage } from '../process/process';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';


describe('Recipe Details Page', () => {
  let injector: TestBed;
  let recipeService: RecipeProvider;
  let fixture: ComponentFixture<RecipeDetailPage>;
  let rmdPage: RecipeDetailPage;
  let modalCtrl: ModalController;
  let navCtrl: NavController;
  let eventService: Events;
  let toastService: ToastProvider;
  let originalNgOnInit: () => void;
  let originalNgOnDestroy: () => void;
  let originalDidLeave: () => void;
  const staticRecipeMaster: RecipeMaster = mockRecipeMasterActive();
  const staticRecipeVariant: RecipeVariant = mockRecipeVariantComplete();
  configureTestBed();

  beforeAll(async(() => {
    NavParamsMock.setParams('masterId', 'active');
  }));

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        RecipeDetailPage,
        ConfirmationPage,
        RoundPipeMock,
        TruncatePipeMock,
        UnitConversionPipeMock
      ],
      imports: [
        IonicModule.forRoot(RecipeDetailPage)
      ],
      providers: [
        { provide: Events, useClass: EventsMock },
        { provide: RecipeProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: ModalController, useClass: ModalControllerMock },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock }
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

    recipeService.getCombinedHopsSchedule = jest
      .fn()
      .mockImplementation(
        (input: any): any => {
          return input;
        }
      );

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeDetailPage);
    rmdPage = fixture.componentInstance;

    eventService = injector.get(Events);
    navCtrl = injector.get(NavController);

    recipeService.getRecipeMasterById = jest
      .fn()
      .mockReturnValue(
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
      );

    originalNgOnInit = rmdPage.ngOnInit;
    rmdPage.ngOnInit = jest
      .fn();
    originalNgOnDestroy = rmdPage.ngOnDestroy;
    rmdPage.ngOnDestroy = jest
      .fn();
    originalDidLeave = rmdPage.ionViewDidLeave;
    rmdPage.ionViewDidLeave = jest
      .fn();
  });

  describe('Component creation', () => {

    test('should create the component', () => {
      rmdPage.ngOnInit = originalNgOnInit;
      rmdPage.ngOnDestroy = originalNgOnDestroy;
      rmdPage.ionViewDidLeave = originalDidLeave;

      fixture.detectChanges();

      expect(rmdPage).toBeDefined();
    }); // end 'should create the component' test

    test('should close all sliding items on exit', () => {
      rmdPage.recipeMaster = staticRecipeMaster;
      rmdPage.displayVariantList = staticRecipeMaster.variants;
      rmdPage.ionViewDidLeave = originalDidLeave;

      fixture.detectChanges();

      const slideSpies: jest.SpyInstance[] = rmdPage
        .slidingItems
        .map((slidingItem: ItemSliding): jest.SpyInstance => {
          return jest.spyOn(slidingItem, 'close');
        });

      rmdPage.ionViewDidLeave();

      slideSpies.forEach(
        (slideSpy: jest.SpyInstance): void => {
          expect(slideSpy).toHaveBeenCalled();
        }
      );
    }); // end 'should close all sliding items on exit' test

    test('should have a stored master id', () => {
      fixture.detectChanges();

      expect(rmdPage.recipeMasterId).toMatch('active');
    }); // end 'should have a stored master id' test

    test('should close all sliding items on exit', () => {
      fixture.detectChanges();

      const slideSpies: jest.SpyInstance[] = rmdPage
        .slidingItems
        .map((slidingItem: ItemSliding): jest.SpyInstance => {
          return jest.spyOn(slidingItem, 'close');
        });

      rmdPage.ionViewDidLeave();

      slideSpies.forEach(
        (slideSpy: jest.SpyInstance): void => {
          expect(slideSpy).toHaveBeenCalled();
        }
      );
    }); // end 'should close all sliding items on exit' test

    test('should fail to load a recipe on init', () => {
      rmdPage.ngOnInit = originalNgOnInit;

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('recipe error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      fixture.detectChanges();

      expect(consoleSpy)
        .toHaveBeenCalledWith('Recipe detail page error: recipe error');
    }); // end 'should fail to load a recipe on init' test

  }); // end 'Component creation' section


  describe('Navigation actions', () => {

    test('should handle nav pop event by calling nav controller pop', () => {
      rmdPage.recipeMaster = staticRecipeMaster;

      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      rmdPage.headerNavPopEventHandler({origin: 'RecipeDetailPage'});

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe details page',
          destTitle: rmdPage.recipeMaster.name
        }
      );
    }); // end 'should handle nav pop event by calling nav controller pop' test

    test('should handle nav pop event by emitting update header', () => {
      rmdPage.recipeMaster = staticRecipeMaster;

      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      rmdPage.headerNavPopEventHandler({origin: 'RecipeDetailPage'});

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe details page',
          destTitle: rmdPage.recipeMaster.name
        }
      );
    }); // end 'should handle nav pop event by emitting update header' test

    test('should ignore header nav pop event if origin is not RecipeDetailPage', () => {
      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');
      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'pop');

      rmdPage.headerNavPopEventHandler({origin: 'IgnoreMe'});

      expect(eventSpy).not.toHaveBeenCalled();
      expect(navSpy).not.toHaveBeenCalled();
    }); // end 'should ignore header nav pop event if origin is not RecipeDetailPage' test

    test('should update header when navigating to process page with a recipe', () => {
      rmdPage.recipeMaster = staticRecipeMaster;

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(true);

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      fixture.detectChanges();

      rmdPage.navToBrewProcess(staticRecipeVariant);

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe details page',
          dest: 'process',
          destType: 'page',
          destTitle: staticRecipeVariant.variantName
        }
      );
    }); // end 'should update header when navigating to process page with a recipe' test

    test('should navigate to process page with a recipe', () => {
      rmdPage.recipeMaster = staticRecipeMaster;

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(true);

      fixture.detectChanges();

      const navCtrlSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

      rmdPage.navToBrewProcess(staticRecipeVariant);

      expect(navCtrlSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: rmdPage.recipeMaster,
          requestedUserId: rmdPage.recipeMaster.owner,
          selectedRecipeId: staticRecipeVariant.cid,
          origin: navCtrl.getActive().name
        }
      );
    }); // end 'should navigate to process page with a recipe' test

    test('should present toast stating the recipe is missing its process', () => {
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(false);

      const _mockRecipe: RecipeVariant = mockRecipeVariantIncomplete();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      rmdPage.navToBrewProcess(_mockRecipe);

      expect(toastSpy).toHaveBeenCalledWith(
        'Recipe missing a process guide!',
        2000,
        'toast-error'
      );
    }); // end 'should present toast stating the recipe is missing its process' test

    test('should navigate to recipe form to update the recipe master', () => {
      fixture.detectChanges();

      const navCtrlSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

      rmdPage.navToRecipeForm('master');

      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'master',
          masterData: rmdPage.recipeMaster,
          mode: 'update'
        }
      );
    }); // end 'should navigate to recipe form to update the recipe master' test

    test('should navigate to recipe form to update a recipe variant', () => {
      fixture.detectChanges();

      rmdPage.recipeMaster = staticRecipeMaster;

      const navCtrlSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

      rmdPage
        .navToRecipeForm(
          'variant',
          staticRecipeVariant,
          { data: 'some-extra-data' }
        );

      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'variant',
          additionalData: {data: 'some-extra-data'},
          masterData: rmdPage.recipeMaster,
          variantData: staticRecipeVariant,
          mode: 'update'
        }
      );
    }); // end 'should navigate to recipe form to update a recipe variant' test

    test('should navigate to recipe form to add a recipe variant', () => {
      fixture.detectChanges();

      const navCtrlSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

      rmdPage.navToRecipeForm('variant');

      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'variant',
          masterData: rmdPage.recipeMaster,
          mode: 'create'
        }
      );
    }); // end 'should navigate to recipe form to add a recipe variant' test

    test('should publish update header event on navigation to recipe form', () => {
      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      rmdPage.navToRecipeForm('master');

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe details page',
          dest: 'recipe-form',
          destType: 'page',
          destTitle: 'Update Recipe',
          origin: 'mock-active-name'
        }
      )
    }); // end 'should emit update header event on navigation to recipe form' test

    test('should get error message if form type is invalid', () => {
      fixture.detectChanges();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      rmdPage.navToRecipeForm('invalid');

      expect(toastSpy).toHaveBeenCalledWith(
        'Invalid form type detected',
        3000,
        'toast-error'
      );
    }); // end 'should get error message if form type is invalid' test

  }); // end 'Navigation actions' section


  describe('Modal methods', () => {

    beforeEach(() => {
      modalCtrl = injector.get(ModalController);
      rmdPage.displayVariantList = [
        staticRecipeVariant
      ];
    });

    test('should open confirmation modal', () => {
      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      fixture.detectChanges();

      rmdPage.confirmDelete(0);

      expect(modalSpy).toHaveBeenCalledWith(
        ConfirmationPage,
        {
          title: 'Variant',
          message: `Confirm deletion of "${staticRecipeVariant.variantName}" variant`,
          subMessage: 'This action cannot be reversed'
        }
      );
    }); // end 'should open confirmation modal' test

    test('should handle confirmation modal dismiss', () => {
      fixture.detectChanges();

      const _mockModal: ModalMock = new ModalMock();

      rmdPage.deleteRecipe = jest
        .fn();
      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      const deleteSpy: jest.SpyInstance = jest.spyOn(rmdPage, 'deleteRecipe');

      _mockModal._setCallBackData(true);

      rmdPage.confirmDelete(0);

      expect(deleteSpy.mock.calls[0][0]).toEqual(0);

      _mockModal._setCallBackData(false);

      rmdPage.confirmDelete(0);

      expect(deleteSpy.mock.calls.length).toEqual(1);
    }); // end 'should handle confirmation modal dismiss' test

  }); // end 'Modal methods' section


  describe('Deletion handling', () => {

    beforeEach(() => {
      rmdPage.displayVariantList = [
        staticRecipeVariant,
        staticRecipeVariant,
        staticRecipeVariant
      ];
      rmdPage.recipeMaster = mockRecipeMasterActive();
    });

    test('should delete a recipe master note', () => {
      rmdPage.recipeMaster.notes.push('a test note');

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(of({}));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeMasterById');

      fixture.detectChanges();

      rmdPage.deleteNote(0);

      expect(rmdPage.recipeMaster.notes.length).toBe(0);
      expect(patchSpy).toHaveBeenCalled();
    }); // end 'should delete a recipe master note' test

    test('should get an error trying to delete a note', () => {
      rmdPage.recipeMaster.notes.push('a test note');

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable(''));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeMasterById');

      fixture.detectChanges();

      rmdPage.deleteNote(0);

      expect(rmdPage.recipeMaster.notes.length).toBe(1);
      expect(patchSpy).toHaveBeenCalled();
    }); // end 'should get an error trying to delete a note' test

    test('should delete a recipe', () => {
      fixture.detectChanges();

      recipeService.deleteRecipeVariantById = jest
        .fn()
        .mockReturnValue(of({}));

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.variants.splice(0, 1);
      const _mockRecipe: RecipeVariant = mockRecipeVariantComplete();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      rmdPage.deleteRecipe(0);

      rmdPage.recipeMaster.variants.splice(0, 1);

      const foundDeleted: boolean = rmdPage
        .recipeMaster
        .variants
        .some((variant: RecipeVariant): boolean => {
          return variant._id == _mockRecipe._id;
        });
      expect(foundDeleted).toBe(false);
      expect(toastSpy).toHaveBeenCalledWith(
        'Recipe deleted!',
        1500
      );
    }); // end 'should delete a recipe' test

    test('should get error response trying to delete a recipe', () => {
      recipeService.deleteRecipeVariantById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('recipe deletion error'));

      fixture.detectChanges();

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      rmdPage.deleteRecipe(0);

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Variant deletion error: recipe deletion error');
    }); // end 'should get error response trying to delete a recipe' test

  }); // end 'Deletion handling' section

  describe('Notes handling', () => {

    test('should mark a note to be expanded', () => {
      fixture.detectChanges();

      expect(rmdPage.noteIndex).toBe(-1);

      rmdPage.expandNote(0);

      expect(rmdPage.noteIndex).toBe(0);

      rmdPage.expandNote(0);

      expect(rmdPage.noteIndex).toBe(-1);
    }); // end 'should mark a note to be expanded' test

    test('should toggle notes display', () => {
      fixture.detectChanges();

      expect(rmdPage.showNotes).toBe(false);
      expect(rmdPage.showNotesIcon).toMatch('arrow-down');

      rmdPage.expandNoteMain();

      expect(rmdPage.showNotes).toBe(true);
      expect(rmdPage.showNotesIcon).toMatch('arrow-up');

      rmdPage.expandNoteMain();

      expect(rmdPage.showNotes).toBe(false);
      expect(rmdPage.showNotesIcon).toMatch('arrow-down');
    }); // end 'should toggle notes display test

    test('should navigate to note form with the note at given index', () => {
      fixture.detectChanges();

      const noteSpy: jest.SpyInstance = jest.spyOn(rmdPage, 'navToRecipeForm');

      rmdPage.updateNote(1);

      expect(noteSpy).toHaveBeenCalledWith(
        'master',
        null,
        { noteIndex: 1 }
      );
    }); // end 'should navigate to note form with the note at given index' test

  }); // end 'Notes handling' section

  describe('Recipe handling', () => {

    beforeEach(() => {
      rmdPage.recipeMaster = mockRecipeMasterActive();
    });

    test('should mark recipe at index to be expanded', () => {
      fixture.detectChanges();

      expect(rmdPage.recipeIndex).toBe(-1);

      rmdPage.expandRecipe(2);

      expect(rmdPage.recipeIndex).toBe(2);

      rmdPage.expandRecipe(2);

      expect(rmdPage.recipeIndex).toBe(-1);
    }); // end 'should mark recipe at index to be expanded' test

    test('should return recipe at given index is the master', () => {
      fixture.detectChanges();

      expect(rmdPage.isMaster(0)).toBe(true);
      expect(rmdPage.isMaster(1)).toBe(false);
    }); // end 'should return recipe at given index is the master' test

    test('should toggle the recipe master isPublic property', () => {
      fixture.detectChanges();

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.isPublic = false;

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeMaster));

      const recipeSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeMasterById');

      expect(rmdPage.recipeMaster.isPublic).toBe(true);

      rmdPage.setPublic();

      expect(recipeSpy)
        .toHaveBeenCalledWith(rmdPage.recipeMaster._id, { isPublic: false });
      expect(rmdPage.recipeMaster.isPublic).toBe(false);
    }); // end 'should toggle the recipe master isPublic property' test

    test('should get error response trying to set isPublic property', () => {
      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new ErrorObservable('error setting recipe master public property')
        );

      fixture.detectChanges();

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      rmdPage.setPublic();

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('error setting recipe master public property');
    }); // end 'should get error response trying to set isPublic property' test

    test('should add a recipe to favorites', () => {
      fixture.detectChanges();

      const _mockRecipeResponse: RecipeVariant = mockRecipeVariantIncomplete();
      _mockRecipeResponse.isFavorite = true;

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeResponse));

      const recipeSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      rmdPage.recipeMaster.variants[1].isFavorite = false;

      const _mockRecipe: RecipeVariant = mockRecipeVariantIncomplete();
      _mockRecipe.isFavorite = false;

      rmdPage.toggleFavorite(_mockRecipe);

      expect(recipeSpy).toHaveBeenCalledWith(
        rmdPage.recipeMaster._id,
        _mockRecipe._id,
        { isFavorite: true }
      );
      expect(toastSpy).toHaveBeenCalledWith(
        'Added to favorites',
        1500,
        'bottom',
        'toast-fav'
      );
    }); // end 'should add a recipe to favorites' test

    test('should remove a recipe from favorites', () => {
      fixture.detectChanges();

      const _mockRecipeResponse: RecipeVariant = mockRecipeVariantIncomplete();
      _mockRecipeResponse.isFavorite = false;

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeResponse));

      const recipeSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      rmdPage.recipeMaster.variants[1].isFavorite = true;

      const _mockRecipe: RecipeVariant = mockRecipeVariantIncomplete();
      _mockRecipe.isFavorite = true;

      rmdPage.toggleFavorite(_mockRecipe);

      expect(recipeSpy).toHaveBeenCalledWith(
        rmdPage.recipeMaster._id,
        _mockRecipe._id,
        { isFavorite: false }
      );
      expect(toastSpy).toHaveBeenCalledWith(
        'Removed from favorites',
        1500,
        'bottom',
        'toast-fav'
      );
    }); // end 'should remove a recipe from favorites' test

    test('should fail to toggle a recipe\'s isFavorite property', () => {
      fixture.detectChanges();

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error'));

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      rmdPage.toggleFavorite(mockRecipeVariantIncomplete())

      expect(toastSpy).toHaveBeenCalledWith(
        'Unable to add to favorites',
        1500,
        'toast-error'
      );
    }); // end 'should fail to toggle a recipe\'s isFavorite property' test

  }); // end 'Recipe handling' section

});
