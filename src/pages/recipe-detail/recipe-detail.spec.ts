/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, Events } from 'ionic-angular';
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
import { NavMock, NavParamsMock, EventsMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';

/* Page imports */
import { RecipeDetailPage } from './recipe-detail';
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
  let navCtrl: NavController;
  let eventService: Events;
  let toastService: ToastProvider;
  configureTestBed();

  beforeAll(async(() => {
    NavParamsMock.setParams('masterId', 'active');
  }));

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        RecipeDetailPage
      ],
      imports: [
        IonicModule.forRoot(RecipeDetailPage)
      ],
      providers: [
        { provide: Events, useClass: EventsMock },
        { provide: RecipeProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
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

  beforeEach(async(() => {
    injector = getTestBed();
    recipeService = injector.get(RecipeProvider);
    eventService = injector.get(Events);
    toastService = injector.get(ToastProvider);
    navCtrl = injector.get(NavController);

    recipeService.getMasterById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()));

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeDetailPage);
    rmdPage = fixture.componentInstance;
  });

  describe('Component creation', () => {
    test('should create the component', () => {
      fixture.detectChanges();

      expect(rmdPage).toBeDefined();
    }); // end 'should create the component' test

    test('should have a stored master id', () => {
      fixture.detectChanges();

      expect(rmdPage.recipeMasterId).toMatch('active');
    }); // end 'should have a stored master id' test

  }); // end 'Component creation' section

  describe('Navigation actions', () => {
    test('should handle nav pop event by calling nav controller pop', () => {
      fixture.detectChanges();

      const navCtrlSpy = jest.spyOn(navCtrl, 'pop');

      rmdPage.headerNavPopEventHandler({origin: 'RecipePage'});

      expect(navCtrlSpy).toHaveBeenCalled();
    }); // end 'should handle nav pop event by calling nav controller pop' test

    test('should handle nav pop event by emitting update header', done => {
      fixture.detectChanges();

      const eventSpy = jest.spyOn(eventService, 'publish');

      rmdPage.headerNavPopEventHandler({origin: 'RecipeDetailPage'});

      setTimeout(() => {
        expect(eventSpy).toHaveBeenCalledWith(
          'update-nav-header',
          {
            caller: 'recipe details page',
            destTitle: rmdPage.recipeMaster.name
          }
        );
        done();
      }, 10);
    }); // end 'should handle nav pop event by emitting update header' test

    test('should ignore header nav pop event if origin is not RecipePage or RecipeDetailPage', () => {
      fixture.detectChanges();

      const eventSpy = jest.spyOn(eventService, 'publish');
      const navSpy = jest.spyOn(navCtrl, 'pop');

      rmdPage.headerNavPopEventHandler({origin: 'IgnoreMe'});

      expect(eventSpy).not.toHaveBeenCalled();
      expect(navSpy).not.toHaveBeenCalled();
    });

    test('should update header when navigating to process page with a recipe', done => {
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(true);

      const eventSpy = jest.spyOn(eventService, 'publish');

      const _mockRecipe = mockRecipeVariantComplete();

      rmdPage.navToBrewProcess(_mockRecipe);

      setTimeout(() => {
        expect(eventSpy).toHaveBeenCalledWith(
          'update-nav-header',
          {
            caller: 'recipe details page',
            dest: 'process',
            destType: 'page',
            destTitle: _mockRecipe.variantName,
            origin: navCtrl.getActive().name
          }
        );
        done();
      }, 10);
    }); // end 'should update header when navigating to process page with a recipe' test

    test('should navigate to process page with a recipe', () => {
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(true);

      const _mockRecipe = mockRecipeVariantComplete();

      const navCtrlSpy = jest.spyOn(navCtrl, 'push');

      rmdPage.navToBrewProcess(_mockRecipe);

      expect(navCtrlSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: rmdPage.recipeMaster,
          requestedUserId: rmdPage.recipeMaster.owner,
          selectedRecipeId: _mockRecipe.cid
        }
      );
    }); // end 'should navigate to process page with a recipe' test

    test('should present toast stating the recipe is missing its process', () => {
      fixture.detectChanges();

      recipeService.isRecipeProcessPresent = jest
        .fn()
        .mockReturnValue(false);

      const _mockRecipe = mockRecipeVariantIncomplete();

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      rmdPage.navToBrewProcess(_mockRecipe);

      expect(toastSpy).toHaveBeenCalledWith(
        'Recipe missing a process guide!',
        2000,
        'error-toast'
      );
    }); // end 'should present toast stating the recipe is missing its process' test

    test('should navigate to recipe form to update the recipe master', () => {
      fixture.detectChanges();

      const navCtrlSpy = jest.spyOn(navCtrl, 'push');

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

      const _mockRecipe = mockRecipeVariantComplete();

      const navCtrlSpy = jest.spyOn(navCtrl, 'push');

      rmdPage.navToRecipeForm('variant', _mockRecipe, {data: 'some-extra-data'});

      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'variant',
          additionalData: {data: 'some-extra-data'},
          masterData: rmdPage.recipeMaster,
          variantData: _mockRecipe,
          mode: 'update'
        }
      );
    }); // end 'should navigate to recipe form to update a recipe variant' test

    test('should navigate to recipe form to add a recipe variant', () => {
      fixture.detectChanges();

      const navCtrlSpy = jest.spyOn(navCtrl, 'push');

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

      const eventSpy = jest.spyOn(eventService, 'publish');

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

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      rmdPage.navToRecipeForm('invalid');

      expect(toastSpy).toHaveBeenCalledWith(
        'Invalid form type detected',
        3000,
        'error-toast'
      );
    }); // end 'should get error message if form type is invalid' test

  }); // end 'Navigation actions' section

  describe('Deletion handling', () => {
    test('should check if recipe is able to be deleted', () => {
      fixture.detectChanges();

      expect(rmdPage.canDelete()).toBe(true);
    }); // end 'should check if recipe is able to be deleted' test

    test('should delete a recipe master note', done => {
      fixture.detectChanges();

      rmdPage.recipeMaster.notes.push('a test note');

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(of({}))

      const patchSpy = jest.spyOn(recipeService, 'patchRecipeMasterById');

      rmdPage.deleteNote(0);

      setTimeout(() => {
        expect(rmdPage.recipeMaster.notes.length).toBe(0);
        expect(patchSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should delete a recipe master note' test

    test('should get an error trying to delete a note', done => {
      fixture.detectChanges();

      rmdPage.recipeMaster.notes.push('a test note');

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable(''));

      const patchSpy = jest.spyOn(recipeService, 'patchRecipeMasterById');

      rmdPage.deleteNote(0);

      setTimeout(() => {
        expect(rmdPage.recipeMaster.notes.length).toBe(1);
        expect(patchSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should get an error trying to delete a note' test

    test('should delete a recipe', done => {
      fixture.detectChanges();

      recipeService.deleteRecipeVariantById = jest
        .fn()
        .mockReturnValue(of({}));

      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.variants.splice(0, 1);
      const _mockRecipe = mockRecipeVariantComplete();

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      rmdPage.deleteRecipe(_mockRecipe);

      rmdPage.recipeMaster.variants.splice(0, 1);

      setTimeout(() => {
        const foundDeleted = rmdPage.recipeMaster.variants.some(variant => variant._id == _mockRecipe._id);
        expect(foundDeleted).toBe(false);
        expect(toastSpy).toHaveBeenCalledWith(
          'Recipe deleted!',
          1500
        );
        done();
      }, 200);
    }); // end 'should delete a recipe' test

    test('should get error response trying to delete a recipe', done => {
      recipeService.deleteRecipeVariantById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('recipe deletion error'));

      fixture.detectChanges();

      const consoleSpy = jest.spyOn(console, 'log');

      rmdPage.deleteRecipe(mockRecipeVariantComplete());

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('recipe deletion error');
        done();
      }, 10);
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

    test('should check if a note at a given index should be shown', () => {
      fixture.detectChanges();

      rmdPage.noteIndex = 2;

      expect(rmdPage.showExpandedNote(2)).toBe(true);
      expect(rmdPage.showExpandedNote(1)).toBe(false);
    }); // end 'should check if a note at a given index should be shown' test

    test('should navigate to note form with the note at given index', () => {
      fixture.detectChanges();

      const noteSpy = jest.spyOn(rmdPage, 'navToRecipeForm');

      rmdPage.updateNote(1);

      expect(noteSpy).toHaveBeenCalledWith(
        'master',
        null,
        { noteIndex: 1 }
      );
    }); // end 'should navigate to note form with the note at given index' test

  }); // end 'Notes handling' section

  describe('Recipe handling', () => {
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

    test('should toggle the recipe master isPublic property', done => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.isPublic = false;

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeMaster));

      const recipeSpy = jest.spyOn(recipeService, 'patchRecipeMasterById');

      expect(rmdPage.recipeMaster.isPublic).toBe(true);

      rmdPage.setPublic();

      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalledWith(rmdPage.recipeMaster._id, { isPublic: false });
        expect(rmdPage.recipeMaster.isPublic).toBe(false);
        done();
      }, 10);
    }); // end 'should toggle the recipe master isPublic property' test

    test('should get error response trying to set isPublic property', done => {
      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error setting recipe master public property'));

      fixture.detectChanges();

      const consoleSpy = jest.spyOn(console, 'log');

      rmdPage.setPublic();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('error setting recipe master public property');
        done();
      }, 10);
    }); // end 'should get error response trying to set isPublic property' test

    test('should check if recipe is selected for display', () => {
      fixture.detectChanges();

      rmdPage.recipeIndex = 2;

      expect(rmdPage.showExpandedRecipe(2)).toBe(true);
      expect(rmdPage.showExpandedRecipe(1)).toBe(false);
    }); // end 'should check if recipe is selected for display'

    test('should add a recipe to favorites', done => {
      fixture.detectChanges();

      const _mockRecipeResponse = mockRecipeVariantIncomplete();
      _mockRecipeResponse.isFavorite = true;

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeResponse));

      const recipeSpy = jest.spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      rmdPage.recipeMaster.variants[1].isFavorite = false;

      const _mockRecipe = mockRecipeVariantIncomplete();
      _mockRecipe.isFavorite = false;

      rmdPage.toggleFavorite(_mockRecipe);

      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalledWith(
          rmdPage.recipeMaster._id,
          _mockRecipe._id,
          { isFavorite: true }
        );
        expect(toastSpy).toHaveBeenCalledWith(
          'Added to favorites',
          1500
        );
        done();
      }, 10);
    }); // end 'should add a recipe to favorites' test

    test('should remove a recipe from favorites', done => {
      fixture.detectChanges();

      const _mockRecipeResponse = mockRecipeVariantIncomplete();
      _mockRecipeResponse.isFavorite = false;

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeResponse));

      const recipeSpy = jest.spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      rmdPage.recipeMaster.variants[1].isFavorite = true;

      const _mockRecipe = mockRecipeVariantIncomplete();
      _mockRecipe.isFavorite = true;

      rmdPage.toggleFavorite(_mockRecipe);

      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalledWith(
          rmdPage.recipeMaster._id,
          _mockRecipe._id,
          { isFavorite: false }
        );
        expect(toastSpy).toHaveBeenCalledWith(
          'Removed from favorites',
          1500
        );
        done();
      }, 10);
    }); // end 'should remove a recipe from favorites' test

    test('should fail to toggle a recipe\'s isFavorite property', done => {
      fixture.detectChanges();

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error'));

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      rmdPage.toggleFavorite(mockRecipeVariantIncomplete())

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith(
          'Unable to add to favorites',
          1500,
          'error-toast'
        )
        done();
      }, 10);
    }); // end 'should fail to toggle a recipe\'s isFavorite property' test

  }); // end 'Recipe handling' section

});
