/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, ModalController, ActionSheetController, ToastController, Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Default imports */
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';

/* Utility imports */
import { stripSharedProperties } from '../../../shared/utility-functions/utilities';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockRecipeVariantComplete } from '../../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockStyles } from '../../../../test-config/mockmodels/mockStyles';
import { mockGrains } from '../../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../../test-config/mockmodels/mockYeast';
import { mockGrainBill } from '../../../../test-config/mockmodels/mockGrainBill';
import { mockHopsSchedule } from '../../../../test-config/mockmodels/mockHopsSchedule';
import { mockYeastGroup } from '../../../../test-config/mockmodels/mockYeastGroup';
import { mockOtherIngredient } from '../../../../test-config/mockmodels/mockOtherIngredient';
import { EventsMock, NavMock, NavParamsMock, ModalControllerMock, ActionSheetControllerMock, ToastControllerMock } from '../../../../test-config/mocks-ionic';

/* Page imports */
import { RecipeFormPage } from './recipe-form';
import { GeneralFormPage } from '../general-form/general-form';
import { ProcessFormPage } from '../process-form/process-form';
import { IngredientFormPage } from '../ingredient-form/ingredient-form';
import { NoteFormPage } from '../note-form/note-form';

/* Provider imports */
import { LibraryProvider } from '../../../providers/library/library';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { CalculationsProvider } from '../../../providers/calculations/calculations';
import { ToastProvider } from '../../../providers/toast/toast';
import { ActionSheetProvider } from '../../../providers/action-sheet/action-sheet';
import { ProcessHttpErrorProvider } from '../../../providers/process-http-error/process-http-error';
import { StorageProvider } from '../../../providers/storage/storage';
import { UserProvider } from '../../../providers/user/user';
import { ConnectionProvider } from '../../../providers/connection/connection';
import { PreferencesProvider } from '../../../providers/preferences/preferences';
import { ClientIdProvider } from '../../../providers/client-id/client-id';
import { SyncProvider } from '../../../providers/sync/sync';


describe('Recipe Form', () => {
  let fixture: ComponentFixture<RecipeFormPage>;
  let recipePage: RecipeFormPage;
  let injector: TestBed;
  let eventService: Events;
  let libraryService: LibraryProvider;
  let actionService: ActionSheetProvider;
  let clientIdService: ClientIdProvider;
  let calculator: CalculationsProvider;
  let recipeService: RecipeProvider;
  let toastService: ToastProvider;
  let modalCtrl: ModalController;
  let navCtrl: NavController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        RecipeFormPage
      ],
      imports: [
        IonicModule.forRoot(RecipeFormPage)
      ],
      providers: [
        { provide: LibraryProvider, useValue: {} },
        { provide: Events, useClass: EventsMock },
        { provide: SyncProvider, useValue: {} },
        { provide: ClientIdProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: ConnectionProvider, useValue: {} },
        { provide: CalculationsProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: ActionSheetProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ModalController, useClass: ModalControllerMock },
        { provide: ActionSheetController, useClass: ActionSheetControllerMock },
        { provide: ToastController, useClass: ToastControllerMock }
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    actionService = injector.get(ActionSheetProvider);
    libraryService = injector.get(LibraryProvider);
    clientIdService = injector.get(ClientIdProvider);
    calculator = injector.get(CalculationsProvider);
    recipeService = injector.get(RecipeProvider);
    toastService = injector.get(ToastProvider);

    calculator.calculateRecipeValues = jest
      .fn(variant => {
        variant.ABV = 5;
        variant.IBU = 10;
        variant.SRM = 20;
        return variant;
      });

    calculator.getIBU = jest
      .fn()
      .mockReturnValue(42);

    libraryService.getAllLibraries = jest
      .fn()
      .mockReturnValue(of([mockGrains(), mockHops(), mockYeast(), mockStyles()]));

    clientIdService.getNewId = jest
      .fn()
      .mockReturnValue(Date.now().toString());
  }));

  beforeEach(async(() => {
    eventService = injector.get(Events);
    navCtrl = injector.get(NavController);
    modalCtrl = injector.get(ModalController);

    actionService.openActionSheet = jest
      .fn();

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeFormPage);
    recipePage = fixture.componentInstance;
  });

  describe('Component creation', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    test('should create the component', done => {
      fixture.detectChanges();

      expect(recipePage).toBeDefined();

      setTimeout(() => {
        expect(recipePage.grainsLibrary).not.toBeNull();
        expect(recipePage.hopsLibrary).not.toBeNull();
        expect(recipePage.yeastLibrary).not.toBeNull();
        expect(recipePage.styleLibrary).not.toBeNull();
        done();
      }, 10);
    }); // end 'should create the component' test

    test('should configure form for new master creation', () => {
      fixture.detectChanges();

      recipePage.setFormTypeConfiguration(
        'master',
        'create',
        undefined,
        undefined,
        {noteIndex: 0}
      );

      expect(recipePage.formType).toMatch('master');
      expect(recipePage.formOptions).toStrictEqual({noteIndex: 0});
      expect(recipePage.mode).toMatch('create');
      expect(recipePage.docMethod).toMatch('create');
      expect(recipePage.master).toStrictEqual(defaultRecipeMaster());
      expect(recipePage.variant).toStrictEqual(defaultRecipeMaster().variants[0])
    }); // end 'should configure form for new master creation' test

    test('should configure form for master update', () => {
      fixture.detectChanges();

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      recipePage.setFormTypeConfiguration(
        'master',
        'update',
        _mockRecipeMasterActive,
        _mockRecipeVariantComplete,
        undefined
      );

      expect(recipePage.formType).toMatch('master');
      expect(recipePage.formOptions).toBeUndefined();
      expect(recipePage.mode).toMatch('update');
      expect(recipePage.docMethod).toMatch('update');
      expect(recipePage.master).toStrictEqual(_mockRecipeMasterActive);
      expect(recipePage.variant).toStrictEqual(_mockRecipeVariantComplete);
      expect(recipePage.title).toMatch(`Update ${_mockRecipeMasterActive.name}`);
    }); // end 'should configure form for master update' test

    test('should configure form for recipe creation', () => {
      fixture.detectChanges();

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      stripSharedProperties(_mockRecipeVariantComplete);

      _mockRecipeVariantComplete.variantName = '< Add Variant Name >';

      recipePage.setFormTypeConfiguration(
        'variant',
        'create',
        _mockRecipeMasterActive,
        undefined,
        undefined
      );

      expect(recipePage.formType).toMatch('variant');
      expect(recipePage.formOptions).toBeUndefined();
      expect(recipePage.mode).toMatch('create');
      expect(recipePage.docMethod).toMatch('create');
      expect(recipePage.master).toStrictEqual(_mockRecipeMasterActive);
      expect(recipePage.variant).toStrictEqual(_mockRecipeVariantComplete);
      expect(recipePage.title).toMatch(`Add Variant to ${_mockRecipeMasterActive.name}`)
    }); // end 'should configure form for recipe creation' test

    test('should configure form for recipe update', () => {
      fixture.detectChanges();

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      recipePage.setFormTypeConfiguration(
        'variant',
        'update',
        _mockRecipeMasterActive,
        _mockRecipeVariantComplete,
        undefined
      );

      expect(recipePage.formType).toMatch('variant');
      expect(recipePage.formOptions).toBeUndefined();
      expect(recipePage.mode).toMatch('update');
      expect(recipePage.docMethod).toMatch('update');
      expect(recipePage.master).toStrictEqual(_mockRecipeMasterActive);
      expect(recipePage.variant).toStrictEqual(_mockRecipeVariantComplete);
      expect(recipePage.title).toMatch(`Update ${_mockRecipeVariantComplete.variantName}`);
    }); // end 'should configure form for recipe update' test

  }); // end 'Component creation' section


  describe('Modal handlers', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    test('should open the general form modal for a recipe master in creation mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      const _mockStyles = mockStyles();

      recipePage.styleLibrary = _mockStyles;

      recipePage.openGeneralModal();

      expect(modalSpy.mock.calls[0][0]).toBe(GeneralFormPage);
      expect(modalSpy.mock.calls[0][1].formType).toMatch('master');
      expect(modalSpy.mock.calls[0][1].docMethod).toMatch('create');
      expect(modalSpy.mock.calls[0][1].styles).toStrictEqual(_mockStyles);
      expect(modalSpy.mock.calls[0][1].data).toBeNull();
    }); // end 'should open the general form modal for a recipe master in creation mode' test

    test('should open the general form modal for a recipe master in update mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');
      const _mockStyles = mockStyles();
      const _mockDefaultRecipeMaster = defaultRecipeMaster();
      const _mockDefaultRecipe = _mockDefaultRecipeMaster.variants[0];

      recipePage.styleLibrary = _mockStyles;
      recipePage.docMethod = 'update';
      recipePage.mode = 'update';

      recipePage.openGeneralModal();

      expect(modalSpy.mock.calls[0][0]).toBe(GeneralFormPage);
      expect(modalSpy.mock.calls[0][1].formType).toMatch('master');
      expect(modalSpy.mock.calls[0][1].docMethod).toMatch('update');
      expect(modalSpy.mock.calls[0][1].styles).toStrictEqual(_mockStyles);
      expect(modalSpy.mock.calls[0][1].data).toStrictEqual({
        name: _mockDefaultRecipeMaster.name,
        style: _mockDefaultRecipeMaster.style,
        brewingType: _mockDefaultRecipe.brewingType,
        mashDuration: _mockDefaultRecipe.mashDuration,
        boilDuration: _mockDefaultRecipe.boilDuration,
        batchVolume: _mockDefaultRecipe.batchVolume,
        boilVolume: _mockDefaultRecipe.boilVolume,
        mashVolume: _mockDefaultRecipe.mashVolume,
        isFavorite: _mockDefaultRecipe.isFavorite,
        isMaster: _mockDefaultRecipe.isMaster
      });
    }); // end 'should open the general form modal for a recipe master in update mode' test

    test('should open the general form modal for a recipe in creation mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      const _mockDefaultRecipeMaster = defaultRecipeMaster();
      const _mockDefaultRecipe = _mockDefaultRecipeMaster.variants[0];
      recipePage.formType = 'variant';

      recipePage.openGeneralModal();

      expect(modalSpy).toHaveBeenCalledWith(
        GeneralFormPage,
        {
          formType: 'variant',
          docMethod: 'create',
          data: {
            style: _mockDefaultRecipeMaster.style,
            brewingType: _mockDefaultRecipe.brewingType,
            mashDuration: _mockDefaultRecipe.mashDuration,
            boilDuration: _mockDefaultRecipe.boilDuration,
            batchVolume: _mockDefaultRecipe.batchVolume,
            boilVolume: _mockDefaultRecipe.boilVolume,
            mashVolume: _mockDefaultRecipe.mashVolume,
            isFavorite: _mockDefaultRecipe.isFavorite,
            isMaster: _mockDefaultRecipe.isMaster
          }
        }
      );
    }); // end 'should open the general form modal for a recipe in creation mode' test

    test('should open the general form modal for a recipe in update mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.formType = 'variant';
      recipePage.docMethod = 'update';
      recipePage.mode = 'update';

      const _mockDefaultRecipeMaster = defaultRecipeMaster();
      const _mockDefaultRecipe = _mockDefaultRecipeMaster.variants[0];

      recipePage.openGeneralModal();

      expect(modalSpy).toHaveBeenCalledWith(
        GeneralFormPage,
        {
          formType: 'variant',
          docMethod: 'update',
          data: {
            variantName: _mockDefaultRecipe.variantName,
            style: _mockDefaultRecipeMaster.style,
            brewingType: _mockDefaultRecipe.brewingType,
            mashDuration: _mockDefaultRecipe.mashDuration,
            boilDuration: _mockDefaultRecipe.boilDuration,
            batchVolume: _mockDefaultRecipe.batchVolume,
            boilVolume: _mockDefaultRecipe.boilVolume,
            mashVolume: _mockDefaultRecipe.mashVolume,
            isFavorite: _mockDefaultRecipe.isFavorite,
            isMaster: _mockDefaultRecipe.isMaster
          }
        }
      )
    }); // end 'should open the general form modal for a recipe in update mode' test

    test('should open ingredient form modal', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      const _mockGrains = mockGrains();
      recipePage.grainsLibrary = _mockGrains;
      recipePage.openIngredientFormModal('grains', {updateObj: 1});

      expect(modalSpy.mock.calls[0][0]).toBe(IngredientFormPage);
      expect(modalSpy.mock.calls[0][1].data.ingredientType).toMatch('grains');
      expect(modalSpy.mock.calls[0][1].data.update).toStrictEqual({updateObj: 1});
      expect(modalSpy.mock.calls[0][1].data.library).toStrictEqual(_mockGrains);

      const _mockHops = mockHops();
      recipePage.hopsLibrary = _mockHops;
      recipePage.openIngredientFormModal('hops', {updateObj: 1});

      expect(modalSpy.mock.calls[1][0]).toBe(IngredientFormPage);
      expect(modalSpy.mock.calls[1][1].data.ingredientType).toMatch('hops');
      expect(modalSpy.mock.calls[1][1].data.update).toStrictEqual({updateObj: 1});
      expect(modalSpy.mock.calls[1][1].data.library).toStrictEqual(_mockHops);

      const _mockYeast = mockYeast();
      recipePage.yeastLibrary = _mockYeast;
      recipePage.openIngredientFormModal('yeast', {updateObj: 1});

      expect(modalSpy.mock.calls[2][0]).toBe(IngredientFormPage);
      expect(modalSpy.mock.calls[2][1].data.ingredientType).toMatch('yeast');
      expect(modalSpy.mock.calls[2][1].data.update).toStrictEqual({updateObj: 1});
      expect(modalSpy.mock.calls[2][1].data.library).toStrictEqual(_mockYeast);
    }); // end 'should open ingredient form modal' test

    test('should call open ingredient modal', () => {
      fixture.detectChanges();

      recipePage.openIngredientFormModal = jest.fn();

      const modalSpy = jest.spyOn(recipePage, 'openIngredientFormModal');

      const sheetSpy = jest.spyOn(actionService, 'openActionSheet');

      recipePage.openIngredientActionSheet();

      const handlers = sheetSpy.mock.calls[0][1].map(button => button.handler);
      handlers.forEach(handler => handler());

      const modalCalls = modalSpy.mock.calls;
      expect(modalCalls[0][0]).toMatch('grains');
      expect(modalCalls[1][0]).toMatch('hops');
      expect(modalCalls[2][0]).toMatch('yeast');
      expect(modalCalls[3][0]).toMatch('otherIngredients');
    }); // end 'should call open ingredient modal' test

    test('should open note form modal for a recipe in creation mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.openNoteModal('variant');

      expect(modalSpy).toHaveBeenCalledWith(
        NoteFormPage,
        {
          noteType: 'variant',
          formMethod: 'create',
          toUpdate: ''
        }
      );
    }); // end 'should open note form modal for a recipe in creation mode' test

    test('should open note form modal for a recipe in update mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.master.notes.push('test note');

      recipePage.openNoteModal('variant', 0);

      expect(modalSpy).toHaveBeenCalledWith(
        NoteFormPage,
        {
          noteType: 'variant',
          formMethod: 'update',
          toUpdate: 'test note'
        }
      );
    }); // end 'should open note form modal for a recipe in update mode' test

    test('should open note form modal for a batch in creation mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.openNoteModal('batch');

      expect(modalSpy).toHaveBeenCalledWith(
        NoteFormPage,
        {
          noteType: 'batch',
          formMethod: 'create',
          toUpdate: ''
        }
      );
    }); // end 'should open note form modal for a batch in creation mode' test

    test('should open note form modal for a batch in update mode', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.variant.notes.push('test note');

      recipePage.openNoteModal('batch', 0);

      expect(modalSpy).toHaveBeenCalledWith(
        NoteFormPage,
        {
          noteType: 'batch',
          formMethod: 'update',
          toUpdate: 'test note'
        }
      );
    }); // end 'should open note form modal for a batch in update mode' test

    test('should open process form modal for a new process', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.openProcessModal('manual');

      expect(modalSpy).toHaveBeenCalledWith(
        ProcessFormPage,
        {
          processType: 'manual',
          update: undefined,
          formMode: 'create'
        }
      );

    }); // end 'should open process form modal for a new process' test

    test('should open process form modal to update a process', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(modalCtrl, 'create');

      recipePage.openProcessModal('manual', {type: 'manual'});

      expect(modalSpy).toHaveBeenCalledWith(
        ProcessFormPage,
        {
          processType: 'manual',
          update: {type: 'manual'},
          formMode: 'update'
        }
      );
    }); // end 'should open process form modal to update a process' test

  }); // end 'Modal handlers' section


  describe('Action sheet handlers', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(RecipeFormPage);
      recipePage = fixture.componentInstance;
    });

    test('should open ingredient selection action sheet', () => {
      fixture.detectChanges();

      const sheetSpy = jest.spyOn(actionService, 'openActionSheet');

      recipePage.openIngredientActionSheet();

      expect(sheetSpy.mock.calls[0][0]).toMatch('Select an Ingredient');
      expect(sheetSpy.mock.calls[0][1].length).toBe(4);
      expect(sheetSpy.mock.calls[0][1][0].text).toMatch('Grains');
    }); // end 'should open ingredient selection action sheet' test

    test('should open process selection action sheet', () => {
      fixture.detectChanges();

      const sheetSpy = jest.spyOn(actionService, 'openActionSheet');

      recipePage.openProcessActionSheet();

      expect(sheetSpy.mock.calls[0][0]).toMatch('Add a process step');
      expect(sheetSpy.mock.calls[0][1].length).toBe(3);
      expect(sheetSpy.mock.calls[0][1][0].text).toMatch('Manual');
      expect(typeof sheetSpy.mock.calls[0][1][0].handler).toMatch('function');
    }); // end 'should open process selection action sheet' test

    test('should call open process modal', () => {
      fixture.detectChanges();

      recipePage.openProcessModal = jest
        .fn();

      const modalSpy = jest.spyOn(recipePage, 'openProcessModal');
      const sheetSpy = jest.spyOn(actionService, 'openActionSheet');

      recipePage.openProcessActionSheet();

      const handlers = sheetSpy.mock.calls[0][1].map(button => button.handler);
      handlers.forEach(handler => handler());

      const modalCalls = modalSpy.mock.calls;
      expect(modalCalls[0][0]).toMatch('manual');
      expect(modalCalls[1][0]).toMatch('timer');
      expect(modalCalls[2][0]).toMatch('calendar');
    }); // end 'should call open process modal' test

  }); // end 'Action sheet handlers' section


  describe('Form auto-generated values', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(RecipeFormPage);
      recipePage = fixture.componentInstance;
    });

    test('should auto-add boil and mash processes', () => {
      fixture.detectChanges();

      recipePage.variant.processSchedule = [];

      recipePage.autoSetBoilMashDuration({
        mashDuration: 90,
        boilDuration: 60
      });

      expect(recipePage.variant.processSchedule.length).toBe(2);
      expect(recipePage.variant.processSchedule[0].name).toMatch('Mash');
      expect(recipePage.variant.processSchedule[1].name).toMatch('Boil');
    }); // end 'should auto-add boil and mash processes' test

    test('should not add boil and/or mash processes if they already exist', () => {
      fixture.detectChanges();

      recipePage.variant.processSchedule = [];

      recipePage.variant.processSchedule.push({
        _id: '',
        cid: '',
        type: 'timer',
        name: 'Mash',
        description: 'Mash grains',
        duration: 60,
        concurrent: false,
        splitInterval: 1
      });
      recipePage.variant.processSchedule.push({
        _id: '',
        cid: '',
        type: 'timer',
        name: 'Boil',
        description: 'Boil wort',
        duration: 60,
        concurrent: true,
        splitInterval: 1
      });

      recipePage.autoSetBoilMashDuration({});

      expect(recipePage.variant.processSchedule.length).toBe(2);
    }); // end 'should not add boil and/or mash processes if they already exist' test

    test('should add a hops addition timer and adjust concurrent timers accordingly', () => {
      fixture.detectChanges();

      recipePage.variant.processSchedule = [
        {
          _id: '',
          cid: '',
          type: 'timer',
          name: 'Boil',
          description: 'Boil wort',
          duration: 60,
          concurrent: true,
          splitInterval: 1
        }
      ];

      const _mockHopsSchedule = mockHopsSchedule();
      const _mockHopsInstance30 = _mockHopsSchedule[0];
      _mockHopsInstance30.addAt = 30;
      recipePage.variant.hops.push(_mockHopsInstance30);

      const _mockHopsInstance45 = _mockHopsSchedule[1];
      _mockHopsInstance45.addAt = 45;
      recipePage.variant.hops.push(_mockHopsInstance45);

      const _mockHopsToSortBefore = _mockHopsSchedule[2];
      _mockHopsToSortBefore.addAt = 20;
      recipePage.variant.hops.push(_mockHopsToSortBefore);

      const _mockHopsToSortAfter = _mockHopsSchedule[3];
      _mockHopsToSortAfter.addAt = 15;
      _mockHopsToSortAfter.dryHop = false;
      recipePage.variant.hops.push(_mockHopsToSortAfter);

      const _additionalHops = mockHopsSchedule();
      const _mockHopsSame1 = _additionalHops[0];
      _mockHopsSame1.addAt = 10;
      recipePage.variant.hops.push(_mockHopsSame1);

      const _mockHopsSame2 = _additionalHops[1];
      _mockHopsSame2.addAt = 10;
      recipePage.variant.hops.push(_mockHopsSame2);

      // make a pre-existing hops timer to clear
      recipePage.variant.processSchedule.push({
        _id: '',
        cid: '',
        type: 'timer',
        name: 'Add x hops',
        concurrent: true,
        description: 'Hops addition: x oz',
        duration: 0
      });

      recipePage.autoSetHopsAddition();

      const schedule = recipePage.variant.processSchedule;

      expect(schedule.length).toBeLessThan(8);
      expect(schedule[1].name).toMatch(`Add ${_mockHopsInstance45.hopsType.name} hops`);
      expect(schedule[2].description).toMatch(`Hops addition: ${_mockHopsInstance30.quantity} oz`);
      expect(schedule[3].description).toMatch(_mockHopsToSortBefore.quantity.toString());
      expect(schedule[4].description).toMatch(_mockHopsToSortAfter.quantity.toString());
      expect(schedule[5].name).toMatch(_mockHopsSame1.hopsType.name);
      expect(schedule[6].name).toMatch(_mockHopsSame2.hopsType.name);
    }); // end 'should add a hops addition timer and adjust concurrent timers accordingly' test

  }); // end 'Form auto-generated values' section


  describe('Recipe calculations', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'variant');
      NavParamsMock.setParams('mode', 'update');
      NavParamsMock.setParams('masterData', mockRecipeMasterActive());
      NavParamsMock.setParams('variantData', mockRecipeVariantComplete());
    }));

    test('should get the weight percentage of a given quantity', () => {
      fixture.detectChanges();
      expect(recipePage.getGristRatio(5)).toBe(40);
    }); // end 'should get the weight percentage of a given quantity' test

    test('should get time remaining of hops addition addAt time', () => {
      fixture.detectChanges();

      expect(recipePage.getHopsTimeRemaining(15)).toBe(45);
    }); // end 'should get time remaining of hops addition addAt time' test

    test('should get the IBU contribution of a particular hops addition instance', () => {
      fixture.detectChanges();

      // IBU value is mocked
      expect(recipePage.getIndividualIBU(mockHopsSchedule()[0])).toBe(42);
    }); // end 'should get the IBU contribution of a particular hops addition instance' test

    test('should get the total weight of grain bill', () => {
      fixture.detectChanges();

      expect(recipePage.getTotalGristWeight()).toBe(12.5);
    }); // end 'should get the total weight of grain bill' test

    test('should recalculate all recipe values', () => {
      fixture.detectChanges();

      const _mockRecipe = mockRecipeVariantComplete();
      _mockRecipe.grains.push({
        _id: '1',
        cid: 'a',
        grainType: mockGrains()[0],
        quantity: 2,
        mill: 1,
        notes: []
      });
      _mockRecipe.hops.push({
        _id: '1',
        cid: 'b',
        hopsType: mockHops()[2],
        quantity: 0.5,
        addAt: 20,
        dryHop: false,
        notes: []
      });
      recipePage.variant = _mockRecipe;

      recipePage.updateRecipeValues();

      // Using mocked values
      expect(recipePage.variant.ABV).toBe(5);
      expect(recipePage.variant.IBU).toBe(10);
      expect(recipePage.variant.SRM).toBe(20);
    }); // end 'should recalculate all recipe values' test

  }); // end 'Recipe calculations' section


  describe('Form handling', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    test('should create a submission payload for a new master', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];

      const payload = recipePage.constructPayload();

      expect(payload.master.name).toMatch(_mockRecipeMaster.name);
      expect(payload.master.style).toStrictEqual(mockStyles()[0]);
      expect(payload.variant).toStrictEqual(_mockRecipeMaster.variants[0]);
    }); // end 'should create a submission payload for a new master' test

    test('should update a recipe master', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster;
      recipePage.docMethod = 'update';

      const payload = recipePage.constructPayload();

      expect(payload).toStrictEqual({
        name: _mockRecipeMaster.name,
        style: _mockRecipeMaster.style,
        notes: _mockRecipeMaster.notes,
        isPublic: _mockRecipeMaster.isPublic
      });
    }); // end 'should update a recipe master' test

    test('should create a new recipe for a master', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];
      recipePage.formType = 'variant';

      const payload = recipePage.constructPayload();

      expect(payload).toStrictEqual(mockRecipeVariantComplete());
    }); // end 'should create a new recipe for a master' test

    test('should handle additional form options', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(recipePage, 'openNoteModal');

      recipePage.handleFormOptions({noteIndex: 1});

      expect(modalSpy).toHaveBeenCalledWith('variant', 1);
    }); // end 'should handle additional form options' test

    test('should handle missing additional form options', () => {
      fixture.detectChanges();

      const modalSpy = jest.spyOn(recipePage, 'openNoteModal');

      recipePage.handleFormOptions(null);

      expect(modalSpy).not.toHaveBeenCalled();
    }); // end 'should handle missing additional form options' test

    test('should submit the form for a new recipe master creation', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(of({}));

      const formSpy = jest.spyOn(recipePage, 'submitCreationPost');

      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];
      recipePage.formType = 'master';

      recipePage.onSubmit();

      expect(formSpy.mock.calls[0][0]).toStrictEqual({
        master: {
          name: _mockRecipeMaster.name,
          style: _mockRecipeMaster.style,
          notes: _mockRecipeMaster.notes,
          isPublic: true
        },
        variant: _mockRecipeMaster.variants[0]
      });
      expect(formSpy.mock.calls[0][1]).toMatch('Master Create Successful!');
    }); // end 'should submit the form for a new recipe master creation' test

    test('should submit the form for an update', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster
      recipePage.docMethod = 'update';

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(Observable.of(_mockRecipeMaster));

      const formSpy = jest.spyOn(recipePage, 'submitPatchUpdate');

      recipePage.onSubmit();

      expect(formSpy.mock.calls[0][0]).toStrictEqual({
        name: _mockRecipeMaster.name,
        style: _mockRecipeMaster.style,
        notes: _mockRecipeMaster.notes,
        isPublic: _mockRecipeMaster.isPublic
      });
      expect(formSpy.mock.calls[0][1]).toMatch('Master Update Successful!');
    }); // end 'should submit the form for an update' test

    test('should submit a recipe master creation post', done => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(of(_mockRecipeMaster));

      const postSpy = jest.spyOn(recipeService, 'postRecipeMaster');
      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const eventSpy = jest.spyOn(eventService, 'publish');

      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];
      const payload = {
        master: {
          name: _mockRecipeMaster.name,
          style: _mockRecipeMaster.style,
          notes: _mockRecipeMaster.notes,
          isPublic: true
        },
        variant: _mockRecipeMaster.variants[0]
      };
      const message = 'Test message';

      recipePage.submitCreationPost(payload, message);

      setTimeout(() => {
        expect(postSpy.mock.calls[0][0]).toStrictEqual(payload);
        expect(toastSpy).toHaveBeenCalledWith(message);
        expect(eventSpy.mock.calls[0][0]).toMatch('update-nav-header');
        expect(eventSpy.mock.calls[0][1]).toStrictEqual({caller: 'recipe form page', other: 'form-submit-complete'});
        done();
      }, 10);
    }); // end 'should submit a recipe master creation post' test

    test('should get an error submitting a recipe master creation post', done => {
      fixture.detectChanges();

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Client Validation Error: Missing User ID'));

      const postSpy = jest.spyOn(recipeService, 'postRecipeMaster');
      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const _mockRecipeMaster = mockRecipeMasterInactive();

      recipePage.submitCreationPost({master: _mockRecipeMaster, variant: _mockRecipeMaster.variants[0]}, '');

      setTimeout(() => {
        const postCall = postSpy.mock.calls[0][0];
        expect(postCall.master._id).toMatch(_mockRecipeMaster._id);
        expect(postCall.variant._id).toMatch(_mockRecipeMaster.variants[0]._id);
        expect(toastSpy).toHaveBeenCalledWith('Client Validation Error: Missing User ID');
        done();
      }, 10);
    }); // end 'should get an error submitting a recipe master creation post' test

    test('should get an error response after submitting a recipe master creation post', done => {
      fixture.detectChanges();

      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const eventSpy = jest.spyOn(eventService, 'publish');

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Non-client error'));

      recipePage.submitCreationPost({}, '');

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith('Non-client error');
        const eventCalls = eventSpy.mock.calls[0];
        expect(eventCalls[0]).toMatch('update-nav-header');
        expect(eventCalls[1]).toStrictEqual({
          caller: 'recipe form page',
          other: 'form-submit-complete'
        });
        done();
      }, 10);
    }); // end 'should get an error response after submitting a recipe master creation post' test

    test('should submit a recipe creation post', done => {
      fixture.detectChanges();

      recipeService.postRecipeToMasterById = jest
        .fn()
        .mockReturnValue(of(mockRecipeVariantComplete()));

      recipeService.addSyncFlag = jest
        .fn();

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('1');

      const postSpy = jest.spyOn(recipeService, 'postRecipeToMasterById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const eventSpy = jest.spyOn(eventService, 'publish');

      const _mockRecipeMaster = mockRecipeMasterInactive();
      const _mockRecipe = _mockRecipeMaster.variants[0];
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipe;
      recipePage.formType = 'variant';

      const message = 'Test message';

      recipePage.submitCreationPost(_mockRecipe, message);

      setTimeout(() => {
        expect(postSpy.mock.calls[0][0]).toMatch(_mockRecipeMaster._id);
        expect(postSpy.mock.calls[0][1]).toStrictEqual(_mockRecipe);
        expect(toastSpy).toHaveBeenCalledWith(message);
        expect(eventSpy.mock.calls[0][0]).toMatch('update-nav-header');
        expect(eventSpy.mock.calls[0][1]).toStrictEqual({caller: 'recipe form page', other: 'form-submit-complete'});
        done();
      }, 10);
    }); // end 'should submit a recipe creation post' test

    test('should get an error submitting a recipe creation post', done => {
      fixture.detectChanges();

      recipeService.postRecipeToMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Invalid Recipe'));

      const postSpy = jest.spyOn(recipeService, 'postRecipeToMasterById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      const _mockRecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];
      recipePage.formType = 'variant';

      recipePage.submitCreationPost({}, '');

      setTimeout(() => {
        expect(postSpy.mock.calls[0][0]).toMatch(_mockRecipeMaster._id);
        expect(postSpy.mock.calls[0][1]).toStrictEqual({});
        expect(toastSpy).toHaveBeenCalledWith('<400> Invalid Recipe');
        done();
      }, 10);
    }); // end 'should get an error submitting a recipe creation post' test

    test('should submit an update for a recipe master', done => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(Observable.of(_mockRecipeMaster));

      const patchSpy = jest.spyOn(recipeService, 'patchRecipeMasterById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const eventSpy = jest.spyOn(eventService, 'publish');

      const message = 'Test update';
      const payload = {
        name: _mockRecipeMaster.name,
        style: _mockRecipeMaster.style,
        notes: _mockRecipeMaster.notes,
        isPublic: _mockRecipeMaster.isPublic
      };
      recipePage.master = _mockRecipeMaster;
      recipePage.formType = 'master';
      recipePage.docMethod = 'update';

      recipePage.submitPatchUpdate(payload, message);

      setTimeout(() => {
        expect(patchSpy.mock.calls[0][0]).toMatch(_mockRecipeMaster._id);
        expect(patchSpy.mock.calls[0][1]).toStrictEqual(payload);
        expect(toastSpy).toHaveBeenCalledWith(message);
        expect(eventSpy.mock.calls[0][0]).toMatch('update-nav-header');
        expect(eventSpy.mock.calls[0][1]).toStrictEqual({caller: 'recipe form page', other: 'form-submit-complete'});
        done();
      }, 10);
    }); // end 'should submit an update for a recipe master' test

    test('should get an error submitting an update for a recipe master', done => {
      fixture.detectChanges();

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Invalid Recipe'));

      const patchSpy = jest.spyOn(recipeService, 'patchRecipeMasterById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      const _mockRecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];
      recipePage.formType = 'master';
      recipePage.docMethod = 'update';

      recipePage.submitPatchUpdate({}, '');

      setTimeout(() => {
        expect(patchSpy.mock.calls[0][0]).toMatch(_mockRecipeMaster._id);
        expect(patchSpy.mock.calls[0][1]).toStrictEqual({});
        expect(toastSpy).toHaveBeenCalledWith('<400> Invalid Recipe');
        done();
      }, 10);
    }); // end 'should get an error submitting an update for a recipe master' test

    test('should submit an update for a recipe', done => {
      fixture.detectChanges();

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(Observable.of(mockRecipeVariantComplete()));

      const patchSpy = jest.spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const eventSpy = jest.spyOn(eventService, 'publish');

      const _mockRecipeMaster = mockRecipeMasterInactive();
      const _mockRecipe = _mockRecipeMaster.variants[0];
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipe;
      recipePage.formType = 'variant';
      recipePage.docMethod = 'update';
      const message = 'Test message';

      recipePage.submitPatchUpdate(_mockRecipe, message);

      setTimeout(() => {
        expect(patchSpy.mock.calls[0][0]).toMatch(_mockRecipeMaster._id);
        expect(patchSpy.mock.calls[0][1]).toMatch(_mockRecipe._id);
        expect(patchSpy.mock.calls[0][2]).toStrictEqual(_mockRecipe);
        expect(toastSpy).toHaveBeenCalledWith(message);
        expect(eventSpy.mock.calls[0][0]).toMatch('update-nav-header');
        expect(eventSpy.mock.calls[0][1]).toStrictEqual({caller: 'recipe form page', other: 'form-submit-complete'});
        done();
      }, 10);
    }); // end 'should submit an update for a recipe' test

    test('should get an error submitting an update for a recipe', done => {
      fixture.detectChanges();

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Invalid Recipe'));

      const patchSpy = jest.spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy = jest.spyOn(toastService, 'presentToast');

      const _mockRecipeMaster = mockRecipeMasterInactive();
      const _mockRecipe = _mockRecipeMaster.variants[0];
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipe;
      recipePage.formType = 'variant';
      recipePage.docMethod = 'update';

      recipePage.submitPatchUpdate({}, '');

      setTimeout(() => {
        expect(patchSpy.mock.calls[0][0]).toMatch(_mockRecipeMaster._id);
        expect(patchSpy.mock.calls[0][1]).toMatch(_mockRecipe._id);
        expect(toastSpy).toHaveBeenCalledWith('<400> Invalid Recipe');
        done();
      }, 10);
    }); // end 'should get an error submitting an update for a recipe' test

  }); // end 'Form handling' section


  describe('Ingredient List', () => {
    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    beforeEach(() => {
      const _mockRecipeMaster = mockRecipeMasterInactive();
      const _mockRecipe = _mockRecipeMaster.variants[0];
      recipePage.master = _mockRecipeMaster;
      recipePage.variant = _mockRecipe;
    });

    test('should sort grains by quantity', () => {
      fixture.detectChanges();

      const _mockGrainBill = mockGrainBill();
      recipePage.variant.grains = [_mockGrainBill[2], _mockGrainBill[0], _mockGrainBill[1]];

      expect(recipePage.variant.grains).not.toStrictEqual(_mockGrainBill);

      recipePage.sortIngredients('grains');

      expect(recipePage.variant.grains).toStrictEqual(_mockGrainBill);
    }); // end 'should sort grains by quantity' test

    test('should sort hops by addition timing', () => {
      fixture.detectChanges();

      const _mockHopsSchedule = mockHopsSchedule();
      const testSchedule = [_mockHopsSchedule[2], _mockHopsSchedule[0], _mockHopsSchedule[1]];
      recipePage.variant.hops = testSchedule;

      expect(recipePage.variant.hops).not.toStrictEqual(_mockHopsSchedule);

      recipePage.sortIngredients('hops');

      expect(recipePage.variant.hops).toStrictEqual(testSchedule);
    }); // end 'should sort hops by addition timing' test

    test('should sort yeast by quantity', () => {
      fixture.detectChanges();

      const _mockYeastGroup = mockYeastGroup();
      _mockYeastGroup[0].quantity = 0.5;

      recipePage.variant.yeast = [_mockYeastGroup[0], _mockYeastGroup[1]];

      expect(recipePage.variant.yeast).not.toStrictEqual(mockYeastGroup());

      recipePage.sortIngredients('yeast');

      expect(recipePage.variant.yeast).toStrictEqual([_mockYeastGroup[1], _mockYeastGroup[0]]);
    }); // end 'should sort yeast by quantity' test

    test('should not change orders', () => {
      fixture.detectChanges();

      const _mockGrainBill = mockGrainBill();
      _mockGrainBill[0].quantity = 1;
      _mockGrainBill[1].quantity = 1;
      const testBill = [_mockGrainBill[1], _mockGrainBill[0]];
      recipePage.variant.grains = testBill;

      recipePage.sortIngredients('grains');

      expect(recipePage.variant.grains[0]).toStrictEqual(testBill[0]);
      expect(recipePage.variant.grains[1]).toStrictEqual(testBill[1]);

      const _mockHopsSchedule = mockHopsSchedule();
      _mockHopsSchedule[0].addAt = 60;
      _mockHopsSchedule[1].addAt = 60;
      const testSchedule = [_mockHopsSchedule[1], _mockHopsSchedule[0]];
      recipePage.variant.hops = testSchedule;

      recipePage.sortIngredients('hops');

      expect(recipePage.variant.hops[0]).toStrictEqual(testSchedule[0]);
      expect(recipePage.variant.hops[1]).toStrictEqual(testSchedule[1]);

      const _mockYeastGroup = mockYeastGroup();
      _mockYeastGroup[0].quantity = 1;
      _mockYeastGroup[1].quantity = 1;

      const testGroup = [_mockYeastGroup[1], _mockYeastGroup[0]];
      recipePage.variant.yeast = testGroup;

      recipePage.sortIngredients('yeast');

      expect(recipePage.variant.yeast[0]).toStrictEqual(testGroup[0]);
      expect(recipePage.variant.yeast[1]).toStrictEqual(testGroup[1]);
    }); // end 'should not change orders' test

    test('should add grains instance in grain bill', () => {
      fixture.detectChanges();

      const _mockGrainAddition = mockGrainBill()[0];
      _mockGrainAddition.quantity = 15;

      expect(recipePage.variant.grains.length).toBe(3);

      recipePage.updateIngredientList(_mockGrainAddition, 'grains');

      expect(recipePage.variant.grains.length).toBe(4);
      expect(recipePage.variant.grains[0]).toStrictEqual(_mockGrainAddition);
    }); // end 'should add grains instance in grain bill' test

    test('should update grains instance in grain bill', () => {
      fixture.detectChanges();

      const _mockGrainUpdate = mockGrainBill()[0];
      _mockGrainUpdate.mill = 0.25;

      recipePage.updateIngredientList(_mockGrainUpdate, 'grains', _mockGrainUpdate);

      expect(recipePage.variant.grains[0].mill).toBe(0.25);
    }); // end 'should update grains instance in grain bill' test

    test('should delete grains instance from grain bill', () => {
      fixture.detectChanges();

      const _mockGrainsToDelete = mockGrainBill()[0];

      recipePage.updateIngredientList(undefined, 'grains', _mockGrainsToDelete, true);

      expect(recipePage.variant.grains.length).toBe(2);
      expect(recipePage.variant.grains[0]).not.toStrictEqual(_mockGrainsToDelete);
    }); // end 'should delete grains instance from grain bill' test

    test('should add hops instance to schedule', () => {
      fixture.detectChanges();

      const _mockHopsAddition = mockHopsSchedule()[0];
      _mockHopsAddition.addAt = 61;

      expect(recipePage.variant.hops.length).toBe(4);

      recipePage.updateIngredientList(_mockHopsAddition, 'hops');

      expect(recipePage.variant.hops.length).toBe(5);
      expect(recipePage.variant.hops[0]).toStrictEqual(_mockHopsAddition);
    }); // end 'should add hops instance to schedule' test

    test('should update hops instance in schedule', () => {
      fixture.detectChanges();

      const _mockHopsUpdate = mockHopsSchedule()[0];
      _mockHopsUpdate.quantity = 1.5;

      recipePage.updateIngredientList(_mockHopsUpdate, 'hops', _mockHopsUpdate);

      expect(recipePage.variant.hops[0].quantity).toBe(1.5);
    }); // end 'should update hops instance in schedule' test

    test('should delete hops instance from schedule', () => {
      fixture.detectChanges();

      const _mockHopsToDelete = mockHopsSchedule()[0];

      recipePage.updateIngredientList(undefined, 'hops', _mockHopsToDelete, true);

      expect(recipePage.variant.hops.length).toBe(3);
      expect(recipePage.variant.hops[0]).not.toStrictEqual(_mockHopsToDelete);
    }); // end 'should delete hops instance from schedule' test

    test('should add yeast instance to group', () => {
      fixture.detectChanges();

      const _mockYeastAddition = mockYeastGroup()[0];
      _mockYeastAddition.quantity = 1.5;

      expect(recipePage.variant.yeast.length).toBe(2);

      recipePage.updateIngredientList(_mockYeastAddition, 'yeast');

      expect(recipePage.variant.yeast.length).toBe(3);
      expect(recipePage.variant.yeast[0]).toStrictEqual(_mockYeastAddition);
    }); // end 'should add yeast instance to group' test

    test('should update yeast instance in group', () => {
      fixture.detectChanges();

      const _mockHopsUpdate = mockYeastGroup()[0];
      _mockHopsUpdate.quantity = 1.5;

      recipePage.updateIngredientList(_mockHopsUpdate, 'yeast', _mockHopsUpdate);

      expect(recipePage.variant.yeast[0].quantity).toBe(1.5);
    }); // end 'should update yeast instance in group' test

    test('should delete yeast instance from group', () => {
      fixture.detectChanges();

      const _mockHopsUpdate = mockYeastGroup()[0];

      recipePage.updateIngredientList(undefined, 'yeast', _mockHopsUpdate, true);

      expect(recipePage.variant.yeast.length).toBe(1);
      expect(recipePage.variant.yeast[0]).not.toStrictEqual(_mockHopsUpdate);
    }); // end 'should delete yeast instance from group' test

    test('should add an \'other\' ingredient instance to list', () => {
      fixture.detectChanges();

      const _mockOtherIngredient = mockOtherIngredient()[0];

      expect(recipePage.variant.otherIngredients.length).toBe(0);

      recipePage.updateIngredientList(_mockOtherIngredient, 'otherIngredients');

      expect(recipePage.variant.otherIngredients.length).toBe(1);
    }); // end 'should add an \'other\' ingredient instance to list' test

    test('should update yeast instance in group', () => {
      fixture.detectChanges();

      const _mockOtherIngredient = mockOtherIngredient()[0];

      recipePage.variant.otherIngredients.push(_mockOtherIngredient);

      const _mockOtherIngredientUpdate = mockOtherIngredient()[0];

      _mockOtherIngredientUpdate.name = 'updated-name';

      recipePage.updateIngredientList(_mockOtherIngredientUpdate, 'otherIngredients', _mockOtherIngredient);

      expect(recipePage.variant.otherIngredients[0].name).toMatch('updated-name');
    }); // end 'should update yeast instance in group' test

    test('should delete yeast instance from group', () => {
      fixture.detectChanges();

      const _mockOtherIngredient = mockOtherIngredient()[0];

      recipePage.variant.otherIngredients.push(_mockOtherIngredient);
      recipePage.updateIngredientList(undefined, 'otherIngredients', _mockOtherIngredient, true);

      expect(recipePage.variant.otherIngredients.length).toBe(0);
    }); // end 'should delete yeast instance from group' test

    test('should not update an ingredient with an unknown type', () => {
      fixture.detectChanges();

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      recipePage.updateIngredientList({}, 'unknown');

      const toastCalls = toastSpy.mock.calls[0];

      expect(toastCalls[0]).toMatch('Unknown ingredient type \'unknown\'');
      expect(toastCalls[1]).toBe(2000);
      expect(toastCalls[2]).toMatch('middle');
    }); // end 'should not update an ingredient with an unknown type' test

  }); // end 'Ingredient List' section

  describe('Other functions', () => {

    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    test('should handle nav pop event', () => {
      fixture.detectChanges();

      const navSpy = jest.spyOn(navCtrl, 'pop');

      recipePage.headerNavPopEventHandler();

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle nav pop event' test

    test('should check if recipe is valid (denoted by a style being selected)', () => {
      fixture.detectChanges();

      expect(recipePage.isRecipeValid()).toBe(false);

      recipePage.master = mockRecipeMasterInactive();

      expect(recipePage.isRecipeValid()).toBe(true);
    }); // end 'should check if recipe is valid (denoted by a style being selected)' test

    test('should map updated recipe master and recipe values', () => {
      fixture.detectChanges();

      const _mockRecipeMaster = mockRecipeMasterInactive();
      const _mockRecipeMasterUpdate = mockRecipeMasterInactive();

      _mockRecipeMasterUpdate.name = 'update-master';
      _mockRecipeMasterUpdate.isPublic = false;
      _mockRecipeMasterUpdate.owner = 'update-owner';
      recipePage.master = _mockRecipeMaster;

      expect(recipePage.master).not.toStrictEqual(_mockRecipeMasterUpdate);

      recipePage.updateDisplay(_mockRecipeMasterUpdate);

      expect(recipePage.master).toStrictEqual(_mockRecipeMasterUpdate);

      const _mockRecipe = mockRecipeVariantComplete();
      const _mockRecipeUpdate = mockRecipeVariantComplete();

      _mockRecipeUpdate.mashDuration = 90;
      _mockRecipeUpdate.boilDuration = 90;
      recipePage.variant = _mockRecipe;

      expect(recipePage.variant).not.toStrictEqual(_mockRecipeUpdate);

      recipePage.updateDisplay(_mockRecipeUpdate);

      expect(recipePage.variant).toStrictEqual(_mockRecipeUpdate);
    }); // end 'should map updated recipe master and recipe values' test

  }); // end 'Other functions' section

});
