/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, Events, ToastController } from 'ionic-angular';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { mockRecipeIncomplete } from '../../../test-config/mockmodels/mockRecipeIncomplete';
import { NavMock } from '../../../test-config/mocks-ionic';
import { NavParamsMock } from '../../../test-config/mocks-ionic';
import { ToastControllerMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { RecipeMasterDetailPage } from './recipe-master-detail';
import { ProcessPage } from '../process/process';
import { RecipeFormPage } from '../forms/recipe-form/recipe-form';

/* Provider imports */
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ProcessProvider } from '../../providers/process/process';
import { ToastProvider } from '../../providers/toast/toast';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';


describe('Recipe Master Details Page', () => {

  describe('Component creation', () => {
    let injector: TestBed;
    let httpMock: HttpTestingController;
    let recipeService: RecipeProvider;
    let fixture: ComponentFixture<RecipeMasterDetailPage>;
    let rmdPage: RecipeMasterDetailPage;

    beforeEach(async(() => {
      NavParamsMock.setParams('masterId', 'active');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipeMasterDetailPage
        ],
        imports: [
          IonicModule.forRoot(RecipeMasterDetailPage),
          HttpClientTestingModule
        ],
        providers: [
          RecipeProvider,
          ProcessProvider,
          Events,
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastProvider, useValue: {} },
          { provide: ProcessHttpErrorProvider, useValue: {} }
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
      fixture = TestBed.createComponent(RecipeMasterDetailPage);
      rmdPage = fixture.componentInstance;
    });

    test('should create the component', () => {
      fixture.detectChanges();
      expect(rmdPage).toBeDefined();
    });

    test('should have a stored master id', () => {
      fixture.detectChanges();
      expect(rmdPage.recipeMasterId).toMatch('active');
    })

  });

  describe('Navigation actions', () => {
    let fixture: ComponentFixture<RecipeMasterDetailPage>;
    let rmdPage: RecipeMasterDetailPage;
    let injector: TestBed;
    let eventService: Events;
    let recipeService: RecipeProvider;
    let httpMock: HttpTestingController;

    beforeEach(async(() => {
      NavParamsMock.setParams('masterId', 'active');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipeMasterDetailPage),
          HttpClientTestingModule
        ],
        providers: [
          RecipeProvider,
          ProcessProvider,
          Events,
          ToastProvider,
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ProcessHttpErrorProvider, useValue: {} }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      })
      .compileComponents();
    }));

    beforeEach(async(() => {
      injector = getTestBed();
      eventService = injector.get(Events);
      recipeService = injector.get(RecipeProvider);
      httpMock = injector.get(HttpTestingController);
      recipeService.initializeRecipeMasterList();

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
      recipeReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(RecipeMasterDetailPage);
      rmdPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should handle nav pop event by calling nav controller pop', () => {
      const navCtrlSpy = jest.spyOn(rmdPage.navCtrl, 'pop');
      rmdPage.headerNavPopEventHandler({origin: 'RecipePage'});
      expect(navCtrlSpy).toHaveBeenCalled();
    });

    test('should handle nav pop event by emitting update header', done => {
      eventService.subscribe('update-nav-header', data => {
        expect(data.destTitle).toMatch(rmdPage.recipeMaster.name);
        done();
      });
      rmdPage.headerNavPopEventHandler({origin: 'RecipeMasterDetailPage'});
    });

    test('should update header when navigating to process page with a recipe', done => {
      const _mockRecipe = mockRecipeComplete();
      eventService.subscribe('update-nav-header', data => {
        expect(data.dest).toMatch('process');
        expect(data.destType).toMatch('page');
        expect(data.destTitle).toMatch(_mockRecipe.variantName);
        expect(data.origin).toMatch(rmdPage.navCtrl.getActive().name);
        done();
      });
      rmdPage.navToBrewProcess(_mockRecipe);
    });

    test('should navigate to process page with a recipe', () => {
      const _mockRecipe = mockRecipeComplete();
      const navCtrlSpy = jest.spyOn(rmdPage.navCtrl, 'push');
      rmdPage.navToBrewProcess(_mockRecipe);
      expect(navCtrlSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: rmdPage.recipeMaster,
          requestedUserId: rmdPage.recipeMaster.owner,
          selectedRecipeId: _mockRecipe._id
        }
      );
    })

    test('should present toast stating the recipe is missing its process', () => {
      const _mockRecipe = mockRecipeIncomplete();
      const toastSpy = jest.spyOn(rmdPage.toastService, 'presentToast');
      rmdPage.navToBrewProcess(_mockRecipe);
      expect(toastSpy).toHaveBeenCalled();
    });

    test('should navigate to recipe form to update the recipe master', () => {
      const navCtrlSpy = jest.spyOn(rmdPage.navCtrl, 'push');
      rmdPage.navToRecipeForm('master');
      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'master',
          masterData: rmdPage.recipeMaster,
          mode: 'update'
        }
      );
    });

    test('should navigate to recipe form to update a recipe variant', () => {
      const _mockRecipe = mockRecipeComplete();
      const navCtrlSpy = jest.spyOn(rmdPage.navCtrl, 'push');
      rmdPage.navToRecipeForm('recipe', _mockRecipe, {data: 'some-extra-data'});
      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'recipe',
          additionalData: {data: 'some-extra-data'},
          masterData: rmdPage.recipeMaster,
          recipeData: _mockRecipe,
          mode: 'update'
        }
      );
    });

    test('should navigate to recipe form to add a recipe variant', () => {
      const navCtrlSpy = jest.spyOn(rmdPage.navCtrl, 'push');
      rmdPage.navToRecipeForm('recipe');
      expect(navCtrlSpy).toHaveBeenCalledWith(
        RecipeFormPage,
        {
          formType: 'recipe',
          masterData: rmdPage.recipeMaster,
          mode: 'create'
        }
      );
    });

    test('should emit update header event on navigation to recipe form', done => {
      eventService.subscribe('update-nav-header', data => {
        expect(data.dest).toMatch('recipe-form');
        expect(data.destType).toMatch('page');
        expect(data.destTitle).toMatch('Update Recipe');
        expect(data.origin).toMatch('mock-active-name');
        done();
      });
      rmdPage.navToRecipeForm('master');
    });

  });

  describe('Deletion handling', () => {
    let fixture: ComponentFixture<RecipeMasterDetailPage>;
    let rmdPage: RecipeMasterDetailPage;
    let injector: TestBed;
    let recipeService: RecipeProvider;
    let httpMock: HttpTestingController;

    beforeEach(async(() => {
      NavParamsMock.setParams('masterId', 'active');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipeMasterDetailPage),
          HttpClientTestingModule
        ],
        providers: [
          RecipeProvider,
          ProcessProvider,
          Events,
          ToastProvider,
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ProcessHttpErrorProvider, useValue: {} }
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
      fixture = TestBed.createComponent(RecipeMasterDetailPage);
      rmdPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should check if recipe is able to be deleted', () => {
      expect(rmdPage.canDelete()).toBe(true);
    });

    test('should delete a recipe master note', done => {
      rmdPage.recipeMaster.notes.push('a test note');
      const patchSpy = jest.spyOn(rmdPage.recipeService, 'patchRecipeMasterById');
      rmdPage.deleteNote(0);
      setTimeout(() => {
        expect(rmdPage.recipeMaster.notes.length).toBe(0);
        expect(patchSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    test('should delete a recipe', done => {
      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.recipes.splice(0, 1);
      const _mockRecipe = mockRecipeComplete();
      const toastSpy = jest.spyOn(rmdPage.toastService, 'presentToast');
      rmdPage.deleteRecipe(_mockRecipe);
      setTimeout(() => {
        const foundDeleted = rmdPage.recipeMaster.recipes.some(recipe => recipe._id == _mockRecipe._id);
        expect(foundDeleted).toBe(false);
        expect(toastSpy).toHaveBeenCalled();
        done();
      }, 200);

      const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${rmdPage.recipeMaster._id}/recipe/${_mockRecipe._id}`);
      deleteReq.flush(_mockRecipe);
    });

  }); // end 'Deletion handling' section

  describe('Notes handling', () => {
    let fixture: ComponentFixture<RecipeMasterDetailPage>;
    let rmdPage: RecipeMasterDetailPage;
    let injector: TestBed;
    let recipeService: RecipeProvider;
    let httpMock: HttpTestingController;

    beforeEach(async(() => {
      NavParamsMock.setParams('masterId', 'active');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipeMasterDetailPage),
          HttpClientTestingModule
        ],
        providers: [
          RecipeProvider,
          ProcessProvider,
          Events,
          ToastProvider,
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ProcessHttpErrorProvider, useValue: {} }
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
      fixture = TestBed.createComponent(RecipeMasterDetailPage);
      rmdPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should mark a note to be expanded', () => {
      expect(rmdPage.noteIndex).toBe(-1);
      rmdPage.expandNote(0);
      expect(rmdPage.noteIndex).toBe(0);
      rmdPage.expandNote(0);
      expect(rmdPage.noteIndex).toBe(-1);
    });

    test('should toggle notes display', () => {
      expect(rmdPage.showNotes).toBe(false);
      expect(rmdPage.showNotesIcon).toMatch('arrow-down');
      rmdPage.expandNoteMain();
      expect(rmdPage.showNotes).toBe(true);
      expect(rmdPage.showNotesIcon).toMatch('arrow-up');
    });

    test('should check if a note at a given index should be shown', () => {
      rmdPage.noteIndex = 2;
      expect(rmdPage.showExpandedNote(2)).toBe(true);
      expect(rmdPage.showExpandedNote(1)).toBe(false);
    });

    test('should navigate to note form with the note at given index', () => {
      const noteSpy = jest.spyOn(rmdPage, 'navToRecipeForm');
      rmdPage.updateNote(1);
      expect(noteSpy).toHaveBeenCalledWith(
        'master',
        null,
        { noteIndex: 1 }
      );
    });

  });

  describe('Recipe handling', () => {
    let fixture: ComponentFixture<RecipeMasterDetailPage>;
    let rmdPage: RecipeMasterDetailPage;
    let injector: TestBed;
    let eventService: Events;
    let recipeService: RecipeProvider;
    let httpMock: HttpTestingController;

    beforeEach(async(() => {
      NavParamsMock.setParams('masterId', 'active');
    }));

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          RecipeMasterDetailPage,
          ProcessPage,
          RecipeFormPage
        ],
        imports: [
          IonicModule.forRoot(RecipeMasterDetailPage),
          HttpClientTestingModule
        ],
        providers: [
          RecipeProvider,
          ProcessProvider,
          Events,
          ToastProvider,
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ProcessHttpErrorProvider, useValue: {} }
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
      fixture = TestBed.createComponent(RecipeMasterDetailPage);
      rmdPage = fixture.componentInstance;
      fixture.detectChanges();
    });

    test('should mark recipe at index to be expanded', () => {
      expect(rmdPage.recipeIndex).toBe(-1);
      rmdPage.expandRecipe(2);
      expect(rmdPage.recipeIndex).toBe(2);
      rmdPage.expandRecipe(2);
      expect(rmdPage.recipeIndex).toBe(-1);
    });

    test('should return recipe at given index is the master', () => {
      expect(rmdPage.isMaster(0)).toBe(true);
      expect(rmdPage.isMaster(1)).toBe(false);
    });

    test('should toggle the recipe master isPublic property', done => {
      const _mockRecipeMaster = mockRecipeMasterActive();
      _mockRecipeMaster.isPublic = false;
      const recipeSpy = jest.spyOn(rmdPage.recipeService, 'patchRecipeMasterById');

      expect(rmdPage.recipeMaster.isPublic).toBe(true);
      rmdPage.setPublic();
      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalledWith(rmdPage.recipeMaster._id, { isPublic: false });
        expect(rmdPage.recipeMaster.isPublic).toBe(false);
        done();
      }, 100);

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${rmdPage.recipeMaster._id}`);
      patchReq.flush(_mockRecipeMaster);
    });

    test('should check if recipe is selected for display', () => {
      rmdPage.recipeIndex = 2;
      expect(rmdPage.showExpandedRecipe(2)).toBe(true);
      expect(rmdPage.showExpandedRecipe(1)).toBe(false);
    });

    test('should toggle a recipe\'s isFavorite property', done => {
      const _mockRecipe = mockRecipeIncomplete();
      _mockRecipe.isFavorite = true;
      const recipeSpy = jest.spyOn(rmdPage.recipeService, 'patchRecipeById');
      const toastSpy = jest.spyOn(rmdPage.toastService, 'presentToast');

      rmdPage.toggleFavorite(rmdPage.recipeMaster.recipes[1]);
      setTimeout(() => {
        expect(recipeSpy).toHaveBeenCalledWith(
          rmdPage.recipeMaster._id,
          _mockRecipe._id,
          { isFavorite: true }
        );
        expect(toastSpy).toHaveBeenCalledWith(
          'Added to favorites',
          1000
        );
        expect(rmdPage.recipeMaster.recipes[1].isFavorite).toBe(true);
        done();
      }, 100);

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${rmdPage.recipeMaster._id}/recipe/${_mockRecipe._id}`);
      patchReq.flush(_mockRecipe);
    });

  });

});