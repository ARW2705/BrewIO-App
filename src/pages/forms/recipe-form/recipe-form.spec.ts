/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, ModalController, ActionSheetController, ToastController, Events } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Default imports */
import { defaultRecipeMaster } from '../../../shared/defaults/default-recipe-master';

/* Utility imports */
import { stripSharedProperties } from '../../../shared/utility-functions/strip-shared-properties';

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
import { mockRecipeMasterCreatePayload, mockRecipeMasterUpdatePayload } from '../../../../test-config/mockmodels/mockPayload';
import { EventsMock, NavMock, NavParamsMock, ModalControllerMock, ModalMock, ActionSheetControllerMock, ToastControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { ActionSheetButton } from '../../../shared/interfaces/action-sheet-buttons';
import { Grains } from '../../../shared/interfaces/library';
import { GrainBill } from '../../../shared/interfaces/grain-bill';
import { Hops } from '../../../shared/interfaces/library';
import { HopsSchedule } from '../../../shared/interfaces/hops-schedule';
import { OtherIngredients } from '../../../shared/interfaces/other-ingredients';
import { Process } from '../../../shared/interfaces/process';
import { RecipeMaster } from '../../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../../shared/interfaces/recipe-variant';
import { Style } from '../../../shared/interfaces/library';
import { Yeast } from '../../../shared/interfaces/library';
import { YeastBatch } from '../../../shared/interfaces/yeast-batch';

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
  let originalOnInit: any;
  let originalAfterViewInit: any;
  let originalOnDestroy: any;

  const staticRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
  const staticRecipeVariantComplete: RecipeVariant = mockRecipeVariantComplete();
  const staticDefaultRecipeMaster: RecipeMaster = defaultRecipeMaster();
  const staticDefaultRecipeVariant: RecipeVariant
    = staticDefaultRecipeMaster.variants[0];

  const staticGrainsLibrary: Grains[] = mockGrains();
  const staticHopsLibrary: Hops[] = mockHops();
  const staticYeastLibrary: Yeast[] = mockYeast();
  const staticStyleLibrary: Style[] = mockStyles();

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
      .fn()
      .mockImplementation(
        (variant: RecipeVariant): RecipeVariant => {
          variant.ABV = 5;
          variant.IBU = 10;
          variant.SRM = 20;
          return variant;
        }
      );

    calculator.getIBU = jest
      .fn()
      .mockReturnValue(42);

    const _mockGrains: Grains[] = mockGrains();
    const _mockHops: Hops[] = mockHops();
    const _mockYeast: Yeast[] = mockYeast();
    const _mockStyles: Style[] = mockStyles();
    libraryService.getAllLibraries = jest
      .fn()
      .mockReturnValue(of(
        [
          _mockGrains,
          _mockHops,
          _mockYeast,
          _mockStyles
        ]
      ));

    const now = Date.now().toString();
    clientIdService.getNewId = jest
      .fn()
      .mockReturnValue(now);

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecipeFormPage);
    recipePage = fixture.componentInstance;

    eventService = injector.get(Events);
    navCtrl = injector.get(NavController);
    modalCtrl = injector.get(ModalController);

    actionService.openActionSheet = jest
      .fn();

    toastService.presentToast = jest
      .fn();

    originalOnInit = recipePage.ngOnInit;
    recipePage.ngOnInit = jest
      .fn();

    originalAfterViewInit = recipePage.ngAfterViewInit;
    recipePage.ngAfterViewInit = jest
      .fn();

    originalOnDestroy = recipePage.ngOnDestroy;
    recipePage.ngOnDestroy = jest
      .fn();
  });

  describe('Component creation', () => {

    test('should create the component', () => {
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;

      recipePage.ngOnInit = originalOnInit;
      recipePage.ngAfterViewInit = originalAfterViewInit;
      recipePage.ngOnDestroy = originalOnDestroy;

      recipePage.setFormTypeConfiguration = jest
        .fn();
      recipePage.handleFormOptions = jest
        .fn();

      const setupSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'setFormTypeConfiguration');
      const optionSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'handleFormOptions');
      const librarySpy: jest.SpyInstance = jest
        .spyOn(libraryService, 'getAllLibraries');
      const subSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'subscribe');

      fixture.detectChanges();

      expect(recipePage).toBeDefined();
      expect(setupSpy).toHaveBeenCalled();
      expect(optionSpy).toHaveBeenCalled();
      expect(librarySpy).toHaveBeenCalled();
      expect(subSpy).toHaveBeenCalled();
    }); // end 'should create the component' test

    test('should configure form', () => {
      fixture.detectChanges();

      // new master creation
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
      expect(recipePage.master).toStrictEqual(staticDefaultRecipeMaster);
      expect(recipePage.variant).toStrictEqual(staticDefaultRecipeVariant);


      // master update
      recipePage.setFormTypeConfiguration(
        'master',
        'update',
        staticRecipeMasterActive,
        staticRecipeVariantComplete,
        undefined
      );

      expect(recipePage.formType).toMatch('master');
      expect(recipePage.formOptions).toBeUndefined();
      expect(recipePage.mode).toMatch('update');
      expect(recipePage.docMethod).toMatch('update');
      expect(recipePage.master).toStrictEqual(staticRecipeMasterActive);
      expect(recipePage.variant).toStrictEqual(staticRecipeVariantComplete);
      expect(recipePage.title).toMatch(`Update ${staticRecipeMasterActive.name}`);


      // new variant creation
      const _mockRecipeVariantComplete: RecipeVariant
        = mockRecipeVariantComplete();
      stripSharedProperties(_mockRecipeVariantComplete);

      _mockRecipeVariantComplete.variantName = '< Add Variant Name >';

      recipePage.setFormTypeConfiguration(
        'variant',
        'create',
        staticRecipeMasterActive,
        undefined,
        undefined
      );

      expect(recipePage.formType).toMatch('variant');
      expect(recipePage.formOptions).toBeUndefined();
      expect(recipePage.mode).toMatch('create');
      expect(recipePage.docMethod).toMatch('create');
      expect(recipePage.master).toStrictEqual(staticRecipeMasterActive);
      expect(recipePage.variant).toStrictEqual(_mockRecipeVariantComplete);
      expect(recipePage.title)
        .toMatch(`Add Variant to ${staticRecipeMasterActive.name}`);


      // variant update
      recipePage.setFormTypeConfiguration(
        'variant',
        'update',
        staticRecipeMasterActive,
        _mockRecipeVariantComplete,
        undefined
      );

      expect(recipePage.formType).toMatch('variant');
      expect(recipePage.formOptions).toBeUndefined();
      expect(recipePage.mode).toMatch('update');
      expect(recipePage.docMethod).toMatch('update');
      expect(recipePage.master).toStrictEqual(staticRecipeMasterActive);
      expect(recipePage.variant).toStrictEqual(_mockRecipeVariantComplete);
      expect(recipePage.title)
        .toMatch(`Update ${_mockRecipeVariantComplete.variantName}`);
    }); // end 'should configure form' test

  }); // end 'Component creation' section


  describe('Modal handlers', () => {

    beforeEach(() => {
      recipePage.grainsLibrary = staticGrainsLibrary;
      recipePage.hopsLibrary = staticHopsLibrary;
      recipePage.yeastLibrary = staticYeastLibrary;
      recipePage.styleLibrary = staticStyleLibrary;
    });

    test('should open the general form modal for a recipe master in creation mode', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.mode = 'create';
      recipePage.docMethod = 'create'
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      recipePage.openGeneralModal();

      expect(modalSpy.mock.calls[0][0]).toBe(GeneralFormPage);
      expect(modalSpy.mock.calls[0][1].formType).toMatch('master');
      expect(modalSpy.mock.calls[0][1].docMethod).toMatch('create');
      expect(modalSpy.mock.calls[0][1].styles).toStrictEqual(staticStyleLibrary);
      expect(modalSpy.mock.calls[0][1].data).toBeNull();
    }); // end 'should open the general form modal for a recipe master in creation mode' test

    test('should open the general form modal for a recipe master in update mode', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.mode = 'update';
      recipePage.docMethod = 'update'
      recipePage.master = mockRecipeMasterActive();
      recipePage.variant = mockRecipeVariantComplete();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      recipePage.openGeneralModal();

      expect(modalSpy.mock.calls[0][0]).toBe(GeneralFormPage);
      expect(modalSpy.mock.calls[0][1].formType).toMatch('master');
      expect(modalSpy.mock.calls[0][1].docMethod).toMatch('update');
      expect(modalSpy.mock.calls[0][1].styles).toStrictEqual(staticStyleLibrary);
      expect(modalSpy.mock.calls[0][1].data).toStrictEqual({
        name: staticRecipeMasterActive.name,
        style: staticRecipeMasterActive.style,
        brewingType: staticRecipeVariantComplete.brewingType,
        mashDuration: staticRecipeVariantComplete.mashDuration,
        boilDuration: staticRecipeVariantComplete.boilDuration,
        batchVolume: staticRecipeVariantComplete.batchVolume,
        boilVolume: staticRecipeVariantComplete.boilVolume,
        mashVolume: staticRecipeVariantComplete.mashVolume,
        isFavorite: staticRecipeVariantComplete.isFavorite,
        isMaster: staticRecipeVariantComplete.isMaster
      });
    }); // end 'should open the general form modal for a recipe master in update mode' test

    test('should open the general form modal for a recipe in creation mode', () => {
      fixture.detectChanges();

      recipePage.formType = 'variant';
      recipePage.mode = 'create';
      recipePage.docMethod = 'create'
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = mockRecipeVariantComplete();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      recipePage.openGeneralModal();

      expect(modalSpy).toHaveBeenCalledWith(
        GeneralFormPage,
        {
          formType: 'variant',
          docMethod: 'create',
          data: {
            style: staticRecipeMasterActive.style,
            brewingType: staticRecipeVariantComplete.brewingType,
            mashDuration: staticRecipeVariantComplete.mashDuration,
            boilDuration: staticRecipeVariantComplete.boilDuration,
            batchVolume: staticRecipeVariantComplete.batchVolume,
            boilVolume: staticRecipeVariantComplete.boilVolume,
            mashVolume: staticRecipeVariantComplete.mashVolume,
            isFavorite: staticRecipeVariantComplete.isFavorite,
            isMaster: staticRecipeVariantComplete.isMaster
          }
        }
      );
    }); // end 'should open the general form modal for a recipe in creation mode' test

    test('should open the general form modal for a recipe in update mode', () => {
      fixture.detectChanges();

      recipePage.formType = 'variant';
      recipePage.mode = 'update';
      recipePage.docMethod = 'update'
      recipePage.master = mockRecipeMasterActive();
      recipePage.variant = mockRecipeVariantComplete();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      recipePage.openGeneralModal();

      expect(modalSpy).toHaveBeenCalledWith(
        GeneralFormPage,
        {
          formType: 'variant',
          docMethod: 'update',
          data: {
            variantName: staticRecipeVariantComplete.variantName,
            style: staticRecipeMasterActive.style,
            brewingType: staticRecipeVariantComplete.brewingType,
            mashDuration: staticRecipeVariantComplete.mashDuration,
            boilDuration: staticRecipeVariantComplete.boilDuration,
            batchVolume: staticRecipeVariantComplete.batchVolume,
            boilVolume: staticRecipeVariantComplete.boilVolume,
            mashVolume: staticRecipeVariantComplete.mashVolume,
            isFavorite: staticRecipeVariantComplete.isFavorite,
            isMaster: staticRecipeVariantComplete.isMaster
          }
        }
      );
    }); // end 'should open the general form modal for a recipe in update mode' test

    test('should handle general modal dismiss', () => {
      fixture.detectChanges();

      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;

      const _mockModal: ModalMock = new ModalMock();
      const _mockData: object = { test: 'property' };

      recipePage.updateDisplay = jest
        .fn();
      recipePage.autoSetBoilMashDuration = jest
        .fn();
      calculator.calculateRecipeValues = jest
        .fn();
      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      const updateSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'updateDisplay');
      const calculateSpy: jest.SpyInstance = jest
        .spyOn(calculator, 'calculateRecipeValues');
      const autoSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'autoSetBoilMashDuration');
      const presentSpy: jest.SpyInstance = jest
        .spyOn(_mockModal, 'present');

      _mockModal._setCallBackData(_mockData);

      recipePage.openGeneralModal();

      expect(updateSpy).toHaveBeenCalledWith(_mockData);
      expect(calculateSpy).toHaveBeenCalledWith(staticRecipeVariantComplete);
      expect(autoSpy).toHaveBeenCalledWith(_mockData);
      expect(presentSpy).toHaveBeenCalledWith({ keyboardClose: false });
    }); // end 'should handle general modal dismiss' test

    test('should open ingredient form modal', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      // Grains selection
      recipePage.openIngredientFormModal('grains', {updateObj: 1});

      expect(modalSpy.mock.calls[0][0]).toBe(IngredientFormPage);
      expect(modalSpy.mock.calls[0][1].data.ingredientType).toMatch('grains');
      expect(modalSpy.mock.calls[0][1].data.update)
        .toStrictEqual({updateObj: 1});
      expect(modalSpy.mock.calls[0][1].data.library)
        .toStrictEqual(staticGrainsLibrary);

      // Hops selection
      recipePage.openIngredientFormModal('hops', {updateObj: 1});

      expect(modalSpy.mock.calls[1][0]).toBe(IngredientFormPage);
      expect(modalSpy.mock.calls[1][1].data.ingredientType).toMatch('hops');
      expect(modalSpy.mock.calls[1][1].data.update)
        .toStrictEqual({updateObj: 1});
      expect(modalSpy.mock.calls[1][1].data.library)
        .toStrictEqual(staticHopsLibrary);

      // Yeast selection
      recipePage.openIngredientFormModal('yeast', {updateObj: 1});

      expect(modalSpy.mock.calls[2][0]).toBe(IngredientFormPage);
      expect(modalSpy.mock.calls[2][1].data.ingredientType).toMatch('yeast');
      expect(modalSpy.mock.calls[2][1].data.update)
        .toStrictEqual({updateObj: 1});
      expect(modalSpy.mock.calls[2][1].data.library)
        .toStrictEqual(staticYeastLibrary);
    }); // end 'should open ingredient form modal' test

    test('should handle ingredient modal dismiss', () => {
      fixture.detectChanges();

      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;

      const _mockModal: ModalMock = new ModalMock();
      const _mockData: object = mockHopsSchedule()[0];

      recipePage.updateIngredientList = jest
        .fn();
      recipePage.autoSetHopsAddition = jest
        .fn();
      calculator.calculateRecipeValues = jest
        .fn();
      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      const updateSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'updateIngredientList');
      const calculateSpy: jest.SpyInstance = jest
        .spyOn(calculator, 'calculateRecipeValues');
      const autoSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'autoSetHopsAddition');
      const presentSpy: jest.SpyInstance = jest
        .spyOn(_mockModal, 'present');

      _mockModal._setCallBackData(_mockData);

      recipePage.openIngredientFormModal('hops');

      expect(updateSpy).toHaveBeenCalledWith(
        _mockData,
        'hops',
        undefined,
        undefined
      );
      expect(calculateSpy).toHaveBeenCalledWith(staticRecipeVariantComplete);
      expect(autoSpy).toHaveBeenCalledWith();
      expect(presentSpy).toHaveBeenCalledWith({ keyboardClose: false });
    }); // end 'should handle ingredient modal dismiss' test

    test('should call open ingredient modal', () => {
      fixture.detectChanges();

      recipePage.openIngredientFormModal = jest.fn();

      const modalSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'openIngredientFormModal');
      const sheetSpy: jest.SpyInstance = jest
        .spyOn(actionService, 'openActionSheet');

      recipePage.openIngredientActionSheet();

      const handlers: (() => void)[] = sheetSpy
        .mock
        .calls[0][1]
        .map((button: ActionSheetButton): (() => void) => button.handler);

      handlers.forEach((handler: () => void): void => handler());

      const modalCalls = modalSpy.mock.calls;
      expect(modalCalls[0][0]).toMatch('grains');
      expect(modalCalls[1][0]).toMatch('hops');
      expect(modalCalls[2][0]).toMatch('yeast');
      expect(modalCalls[3][0]).toMatch('otherIngredients');
    }); // end 'should call open ingredient modal' test

    test('should open note form modal for a recipe in creation mode', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

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

    test('should handle note modal dismiss', () => {
      fixture.detectChanges();

      recipePage.master = mockRecipeMasterActive();
      recipePage.variant = mockRecipeVariantComplete();

      const _mockModal: ModalMock = new ModalMock();

      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      const _mockCreateMaster: object = {
        method: 'create',
        note: 'test create master'
      };
      const _mockCreateVariant: object = {
        method: 'create',
        note: 'test create variant'
      };
      const _mockUpdateMaster: object = {
        method: 'update',
        note: 'test update variant'
      };
      const _mockUpdateVariant: object = {
        method: 'update',
        note: 'test update variant'
      };
      const _mockDeleteMaster: object = {
        method: 'delete'
      };
      const _mockDeleteVariant: object = {
        method: 'delete'
      };

      _mockModal._setCallBackData(_mockCreateMaster);
      recipePage.openNoteModal('master');
      expect(recipePage.master.notes[recipePage.master.notes.length - 1])
        .toMatch(_mockCreateMaster['note']);

      _mockModal._setCallBackData(_mockCreateVariant);
      recipePage.openNoteModal('variant');
      expect(recipePage.variant.notes[recipePage.variant.notes.length - 1])
        .toMatch(_mockCreateVariant['note']);

      _mockModal._setCallBackData(_mockUpdateMaster);
      recipePage.openNoteModal('master', recipePage.master.notes.length - 1);
      expect(recipePage.master.notes[recipePage.master.notes.length - 1])
        .toMatch(_mockUpdateMaster['note']);

      _mockModal._setCallBackData(_mockUpdateVariant);
      recipePage.openNoteModal('variant', recipePage.variant.notes.length - 1);
      expect(recipePage.variant.notes[recipePage.variant.notes.length - 1])
        .toMatch(_mockUpdateVariant['note']);

      _mockModal._setCallBackData(_mockDeleteMaster);
      recipePage.openNoteModal('master', recipePage.master.notes.length - 1);
      expect(recipePage.master.notes.length).toEqual(0);

      _mockModal._setCallBackData(_mockDeleteVariant);
      recipePage.openNoteModal('variant', recipePage.variant.notes.length - 1);
      expect(recipePage.variant.notes.length).toEqual(0);
    }); // end 'should handle note modal dismiss' test

    test('should open note form modal for a recipe master in update mode', () => {
      fixture.detectChanges();

      recipePage.master = mockRecipeMasterActive();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      recipePage.master.notes.push('test note');

      recipePage.openNoteModal('master', 0);

      expect(modalSpy).toHaveBeenCalledWith(
        NoteFormPage,
        {
          noteType: 'master',
          formMethod: 'update',
          toUpdate: 'test note'
        }
      );
    }); // end 'should open note form modal for a recipe master in update mode' test

    test('should open note form modal for a variant in creation mode', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      recipePage.openNoteModal('variant');

      expect(modalSpy).toHaveBeenCalledWith(
        NoteFormPage,
        {
          noteType: 'variant',
          formMethod: 'create',
          toUpdate: ''
        }
      );
    }); // end 'should open note form modal for a variant in creation mode' test

    test('should open note form modal for a variant in update mode', () => {
      recipePage.variant = mockRecipeVariantComplete();

      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

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
    }); // end 'should open note form modal for a variant in update mode' test

    test('should open process form modal for a new process', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

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

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

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

    test('should handle process form modal dismiss', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();
      recipePage.variant.processSchedule = [];

      const _mockModal: ModalMock = new ModalMock();
      const _mockAddProcess: object = {
        cid: '0',
        type: 'mock',
        name: 'add'
      };
      const _mockUpdateProcess: object = {
        update: {
          cid: '1',
          type: 'mock',
          name: 'update'
        }
      }
      const _mockDeleteProcess: object = {
        delete: true
      };

      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      _mockModal._setCallBackData(_mockAddProcess);
      recipePage.openProcessModal('manual');
      expect(recipePage.variant.processSchedule[0])
        .toStrictEqual(_mockAddProcess);

      _mockModal._setCallBackData(_mockUpdateProcess);
      recipePage.openProcessModal('manual', {}, 0);
      expect(recipePage.variant.processSchedule[0])
        .toStrictEqual(_mockUpdateProcess['update']);
      expect(recipePage.variant.processSchedule.length).toEqual(1);

      _mockModal._setCallBackData(_mockDeleteProcess);
      recipePage.openProcessModal('manual', {}, 0);
      expect(recipePage.variant.processSchedule.length).toEqual(0);
    }); // end 'should handle process form modal dismiss' test

  }); // end 'Modal handlers' section


  describe('Action sheet handlers', () => {

    test('should open ingredient selection action sheet', () => {
      fixture.detectChanges();

      const sheetSpy: jest.SpyInstance = jest
        .spyOn(actionService, 'openActionSheet');

      recipePage.openIngredientActionSheet();

      expect(sheetSpy.mock.calls[0][0]).toMatch('Select an Ingredient');
      expect(sheetSpy.mock.calls[0][1].length).toBe(4);
      expect(sheetSpy.mock.calls[0][1][0].text).toMatch('Grains');
    }); // end 'should open ingredient selection action sheet' test

    test('should open process selection action sheet', () => {
      fixture.detectChanges();

      const sheetSpy: jest.SpyInstance = jest
        .spyOn(actionService, 'openActionSheet');

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

      const modalSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'openProcessModal');
      const sheetSpy: jest.SpyInstance = jest
        .spyOn(actionService, 'openActionSheet');

      recipePage.openProcessActionSheet();

      const handlers: (() => void)[] = sheetSpy
        .mock
        .calls[0][1]
        .map((button: ActionSheetButton): (() => void) => button.handler);

      handlers.forEach((handler: () => void): void => handler());

      const modalCalls = modalSpy.mock.calls;
      expect(modalCalls[0][0]).toMatch('manual');
      expect(modalCalls[1][0]).toMatch('timer');
      expect(modalCalls[2][0]).toMatch('calendar');
    }); // end 'should call open process modal' test

  }); // end 'Action sheet handlers' section


  describe('Form auto-generated values', () => {

    beforeEach(() => {
      recipePage.variant = defaultRecipeMaster().variants[0];
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

      const _mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
      const _mockHopsInstance30: HopsSchedule = _mockHopsSchedule[0];
      _mockHopsInstance30.addAt = 30;
      recipePage.variant.hops.push(_mockHopsInstance30);

      const _mockHopsInstance45: HopsSchedule = _mockHopsSchedule[1];
      _mockHopsInstance45.addAt = 45;
      recipePage.variant.hops.push(_mockHopsInstance45);

      const _mockHopsToSortBefore: HopsSchedule = _mockHopsSchedule[2];
      _mockHopsToSortBefore.addAt = 20;
      recipePage.variant.hops.push(_mockHopsToSortBefore);

      const _mockHopsToSortAfter: HopsSchedule = _mockHopsSchedule[3];
      _mockHopsToSortAfter.addAt = 15;
      _mockHopsToSortAfter.dryHop = false;
      recipePage.variant.hops.push(_mockHopsToSortAfter);

      const _additionalHops: HopsSchedule[] = mockHopsSchedule();
      const _mockHopsSame1: HopsSchedule = _additionalHops[0];
      _mockHopsSame1.addAt = 10;
      recipePage.variant.hops.push(_mockHopsSame1);

      const _mockHopsSame2: HopsSchedule = _additionalHops[1];
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

      const schedule: Process[] = recipePage.variant.processSchedule;

      expect(schedule.length).toBeLessThan(8);
      expect(schedule[1].name)
        .toMatch(`Add ${_mockHopsInstance45.hopsType.name} hops`);
      expect(schedule[2].description)
        .toMatch(`Hops addition: ${_mockHopsInstance30.quantity} oz`);
      expect(schedule[3].description)
        .toMatch(_mockHopsToSortBefore.quantity.toString());
      expect(schedule[4].description)
        .toMatch(_mockHopsToSortAfter.quantity.toString());
      expect(schedule[5].name).toMatch(_mockHopsSame1.hopsType.name);
      expect(schedule[6].name).toMatch(_mockHopsSame2.hopsType.name);
    }); // end 'should add a hops addition timer and adjust concurrent timers accordingly' test

  }); // end 'Form auto-generated values' section


  describe('Recipe calculations', () => {

    beforeEach(() => {
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;
    });

    test('should get the weight percentage of a given quantity', () => {
      fixture.detectChanges();

      recipePage.getTotalGristWeight = jest
        .fn()
        .mockReturnValue(12.5);

      expect(recipePage.getGristRatio(5)).toEqual(40);
    }); // end 'should get the weight percentage of a given quantity' test

    test('should get time remaining of hops addition addAt time', () => {
      fixture.detectChanges();

      expect(recipePage.getHopsTimeRemaining(15)).toEqual(45);
    }); // end 'should get time remaining of hops addition addAt time' test

    test('should get the IBU contribution of a particular hops addition instance', () => {
      fixture.detectChanges();

      calculator.getIBU = jest
        .fn()
        .mockReturnValue(42);

      const calculateSpy: jest.SpyInstance = jest.spyOn(calculator, 'getIBU');

      const _mockHopsSchedule: HopsSchedule = mockHopsSchedule()[0];
      expect(recipePage.getIndividualIBU(_mockHopsSchedule)).toEqual(42);
      expect(calculateSpy).toHaveBeenCalledWith(
        _mockHopsSchedule.hopsType,
        _mockHopsSchedule,
        staticRecipeVariantComplete.originalGravity,
        staticRecipeVariantComplete.batchVolume,
        staticRecipeVariantComplete.boilVolume
      );
    }); // end 'should get the IBU contribution of a particular hops addition instance' test

    test('should get the total weight of grain bill', () => {
      fixture.detectChanges();

      expect(recipePage.getTotalGristWeight()).toEqual(12.5);
    }); // end 'should get the total weight of grain bill' test

    test('should call recalculate all recipe values', () => {
      fixture.detectChanges();

      calculator.calculateRecipeValues = jest
        .fn();

      const calculateSpy: jest.SpyInstance = jest
        .spyOn(calculator, 'calculateRecipeValues');

      recipePage.updateRecipeValues();

      expect(calculateSpy).toHaveBeenCalledWith(recipePage.variant);
    }); // end 'should call recalculate all recipe values' test

  }); // end 'Recipe calculations' section


  describe('Form handling', () => {

    beforeEach(() => {
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;
    });

    test('should create a submission payload for a new master', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.docMethod = 'create';

      const payload: object = recipePage.constructPayload();

      expect(payload['master']['name']).toMatch(staticRecipeMasterActive.name);
      expect(payload['master']['style']).toStrictEqual(staticStyleLibrary[0]);
      expect(payload['variant'])
        .toStrictEqual(staticRecipeMasterActive.variants[0]);
    }); // end 'should create a submission payload for a new master' test

    test('should update a recipe master', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.docMethod = 'update';

      const payload: object = recipePage.constructPayload();

      expect(payload).toStrictEqual({
        name: staticRecipeMasterActive.name,
        style: staticRecipeMasterActive.style,
        notes: staticRecipeMasterActive.notes,
        isPublic: staticRecipeMasterActive.isPublic
      });
    }); // end 'should update a recipe master' test

    test('should create a new recipe for a master', () => {
      fixture.detectChanges();

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterInactive();
      recipePage.master = _mockRecipeMaster
      recipePage.variant = _mockRecipeMaster.variants[0];
      recipePage.formType = 'variant';

      const payload: object = recipePage.constructPayload();

      expect(payload).toStrictEqual(mockRecipeVariantComplete());
    }); // end 'should create a new recipe for a master' test

    test('should handle additional form options', () => {
      fixture.detectChanges();

      recipePage.openNoteModal = jest
        .fn();

      const modalSpy: jest.SpyInstance = jest.spyOn(recipePage, 'openNoteModal');

      recipePage.handleFormOptions({noteIndex: 1});

      expect(modalSpy).toHaveBeenCalledWith('variant', 1);
    }); // end 'should handle additional form options' test

    test('should handle missing additional form options', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(recipePage, 'openNoteModal');

      recipePage.handleFormOptions(null);

      expect(modalSpy).not.toHaveBeenCalled();
    }); // end 'should handle missing additional form options' test

    test('should submit the form for a new recipe master creation', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.docMethod = 'create';

      const _mockPayload: object = mockRecipeMasterCreatePayload();

      recipePage.constructPayload = jest
        .fn()
        .mockReturnValue(_mockPayload);

      recipePage.submitCreationPost = jest
        .fn();

      const formSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'submitCreationPost');

      recipePage.onSubmit();

      expect(formSpy).toHaveBeenCalledWith(
        _mockPayload,
        'Master Create Successful!'
      );
    }); // end 'should submit the form for a new recipe master creation' test

    test('should submit the form for an update', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.docMethod = 'update';

      const _mockPayload: object = mockRecipeMasterUpdatePayload();

      recipePage.constructPayload = jest
        .fn()
        .mockReturnValue(_mockPayload);

      recipePage.submitPatchUpdate = jest
        .fn();

      const formSpy: jest.SpyInstance = jest
        .spyOn(recipePage, 'submitPatchUpdate');

      recipePage.onSubmit();

      expect(formSpy).toHaveBeenCalledWith(
        _mockPayload,
        'Master Update Successful!'
      );
    }); // end 'should submit the form for an update' test

    test('should submit a recipe master creation post', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';

      const _mockPayload: object = mockRecipeMasterCreatePayload();

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(of({}));

      const postSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'postRecipeMaster');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      const message: string = 'Test message';

      recipePage.submitCreationPost(_mockPayload, message);

      expect(postSpy).toHaveBeenCalledWith(_mockPayload);
      expect(toastSpy).toHaveBeenCalledWith(message);
      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe form page',
          other: 'form-submit-complete'
        }
      );
    }); // end 'should submit a recipe master creation post' test

    test('should get an error submitting a recipe master creation post', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(
          new ErrorObservable('Client Validation Error: Missing User ID')
        );

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      recipePage.submitCreationPost({}, '');

      expect(toastSpy)
        .toHaveBeenCalledWith('Client Validation Error: Missing User ID');
      expect(eventSpy).not.toHaveBeenCalled();
    }); // end 'should get an error submitting a recipe master creation post' test

    test('should get an error response after submitting a recipe master creation post', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';

      recipeService.postRecipeMaster = jest
        .fn()
        .mockReturnValue(
          new ErrorObservable('Non-client error')
        );

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      recipePage.submitCreationPost({}, '');

      expect(toastSpy).toHaveBeenCalledWith('Non-client error');
      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe form page',
          other: 'form-submit-complete'
        }
      );
    }); // end 'should get an error response after submitting a recipe master creation post' test

    test('should submit a recipe variant creation post', () => {
      fixture.detectChanges();

      recipePage.formType = 'variant';
      recipePage.master = staticRecipeMasterActive;

      const _mockPayload: object = mockRecipeVariantComplete();

      recipeService.postRecipeToMasterById = jest
        .fn()
        .mockReturnValue(of({}));

      const postSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'postRecipeToMasterById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      const message: string = 'Test message';

      recipePage.submitCreationPost(staticRecipeVariantComplete, message);

      expect(postSpy).toHaveBeenCalledWith(
        staticRecipeMasterActive._id,
        _mockPayload
      );
      expect(toastSpy).toHaveBeenCalledWith(message);
      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe form page',
          other: 'form-submit-complete'
        }
      );
    }); // end 'should submit a recipe variant creation post' test

    test('should get an error submitting a recipe variant creation post', () => {
      fixture.detectChanges();

      recipePage.formType = 'variant'
      recipePage.master = staticRecipeMasterActive;

      recipeService.postRecipeToMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Invalid Recipe'));

      const postSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'postRecipeToMasterById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      recipePage.submitCreationPost({}, '');

      expect(postSpy).toHaveBeenCalledWith(
        staticRecipeMasterActive._id,
        {}
      );
      expect(toastSpy).toHaveBeenCalledWith('<400> Invalid Recipe');
    }); // end 'should get an error submitting a recipe variant creation post' test

    test('should submit an update for a recipe master', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.master = staticRecipeMasterActive;

      const _mockPaylod: object = mockRecipeMasterUpdatePayload();

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(of({}));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeMasterById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      const message: string = 'Test message';

      recipePage.submitPatchUpdate(_mockPaylod, message);

      expect(patchSpy).toHaveBeenCalledWith(
        staticRecipeMasterActive._id,
        _mockPaylod
      );
      expect(toastSpy).toHaveBeenCalledWith(message);
      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe form page',
          other: 'form-submit-complete'
        }
      );
    }); // end 'should submit an update for a recipe master' test

    test('should get an error submitting an update for a recipe master', () => {
      fixture.detectChanges();

      recipePage.formType = 'master';
      recipePage.master = staticRecipeMasterActive;

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Invalid Recipe'));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeMasterById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      recipePage.submitPatchUpdate({}, '');

      expect(patchSpy).toHaveBeenCalledWith(
        staticRecipeMasterActive._id,
        {}
      );
      expect(toastSpy).toHaveBeenCalledWith('<400> Invalid Recipe');
    }); // end 'should get an error submitting an update for a recipe master' test

    test('should submit an update for a recipe variant', () => {
      fixture.detectChanges();

      recipePage.formType = 'variant';
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;

      const _mockPayload: object = staticRecipeVariantComplete;

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(of({}));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      const message: string = 'Test message';

      recipePage.submitPatchUpdate(_mockPayload, message);

      expect(patchSpy).toHaveBeenCalledWith(
        staticRecipeMasterActive._id,
        staticRecipeVariantComplete._id,
        _mockPayload
      );
      expect(toastSpy).toHaveBeenCalledWith(message);
      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'recipe form page',
          other: 'form-submit-complete'
        }
      );
    }); // end 'should submit an update for a recipe variant' test

    test('should get an error submitting an update for a recipe', () => {
      fixture.detectChanges();

      recipePage.formType = 'variant';
      recipePage.master = staticRecipeMasterActive;
      recipePage.variant = staticRecipeVariantComplete;

      recipeService.patchRecipeVariantById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Invalid Recipe'));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'patchRecipeVariantById');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      recipePage.submitPatchUpdate({}, '');

      expect(patchSpy).toHaveBeenCalledWith(
        staticRecipeMasterActive._id,
        staticRecipeVariantComplete._id,
        {}
      );
      expect(toastSpy).toHaveBeenCalledWith('<400> Invalid Recipe');
    }); // end 'should get an error submitting an update for a recipe' test

  }); // end 'Form handling' section


  describe('Ingredient List', () => {

    beforeAll(async(() => {
      NavParamsMock.setParams('formType', 'master');
      NavParamsMock.setParams('mode', 'create');
    }));

    beforeEach(() => {
      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterInactive();
      const _mockRecipeVariant: RecipeVariant = _mockRecipeMaster.variants[0];
      recipePage.master = _mockRecipeMaster;
      recipePage.variant = _mockRecipeVariant;
    });

    test('should sort grains by quantity', () => {
      fixture.detectChanges();

      const _mockGrainBill: GrainBill[] = mockGrainBill();
      recipePage.variant.grains = [
        _mockGrainBill[2],
        _mockGrainBill[0],
        _mockGrainBill[1]
      ];

      expect(recipePage.variant.grains).not.toStrictEqual(_mockGrainBill);

      recipePage.sortIngredients('grains');

      expect(recipePage.variant.grains).toStrictEqual(_mockGrainBill);
    }); // end 'should sort grains by quantity' test

    test('should sort hops by addition timing', () => {
      fixture.detectChanges();

      const _mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
      const testSchedule: HopsSchedule[] = [
        _mockHopsSchedule[2],
        _mockHopsSchedule[0],
        _mockHopsSchedule[1]
      ];
      recipePage.variant.hops = testSchedule;

      expect(recipePage.variant.hops).not.toStrictEqual(_mockHopsSchedule);

      recipePage.sortIngredients('hops');

      expect(recipePage.variant.hops).toStrictEqual(testSchedule);
    }); // end 'should sort hops by addition timing' test

    test('should sort yeast by quantity', () => {
      fixture.detectChanges();

      const _mockYeastGroup: YeastBatch[] = mockYeastGroup();
      _mockYeastGroup[0].quantity = 0.5;

      recipePage.variant.yeast = [_mockYeastGroup[0], _mockYeastGroup[1]];

      expect(recipePage.variant.yeast).not.toStrictEqual(mockYeastGroup());

      recipePage.sortIngredients('yeast');

      expect(recipePage.variant.yeast)
        .toStrictEqual(
          [
            _mockYeastGroup[1],
            _mockYeastGroup[0]
          ]
        );
    }); // end 'should sort yeast by quantity' test

    test('should not change orders', () => {
      fixture.detectChanges();

      const _mockGrainBill: GrainBill[] = mockGrainBill();
      _mockGrainBill[0].quantity = 1;
      _mockGrainBill[1].quantity = 1;

      const testBill: GrainBill[] = [_mockGrainBill[1], _mockGrainBill[0]];
      recipePage.variant.grains = testBill;

      recipePage.sortIngredients('grains');

      expect(recipePage.variant.grains[0]).toStrictEqual(testBill[0]);
      expect(recipePage.variant.grains[1]).toStrictEqual(testBill[1]);

      const _mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
      _mockHopsSchedule[0].addAt = 60;
      _mockHopsSchedule[1].addAt = 60;

      const testSchedule: HopsSchedule[] = [
        _mockHopsSchedule[1],
        _mockHopsSchedule[0]
      ];
      recipePage.variant.hops = testSchedule;

      recipePage.sortIngredients('hops');

      expect(recipePage.variant.hops[0]).toStrictEqual(testSchedule[0]);
      expect(recipePage.variant.hops[1]).toStrictEqual(testSchedule[1]);

      const _mockYeastGroup: YeastBatch[] = mockYeastGroup();
      _mockYeastGroup[0].quantity = 1;
      _mockYeastGroup[1].quantity = 1;

      const testGroup: YeastBatch[] = [_mockYeastGroup[1], _mockYeastGroup[0]];
      recipePage.variant.yeast = testGroup;

      recipePage.sortIngredients('yeast');

      expect(recipePage.variant.yeast[0]).toStrictEqual(testGroup[0]);
      expect(recipePage.variant.yeast[1]).toStrictEqual(testGroup[1]);
    }); // end 'should not change orders' test

    test('should add grains instance in grain bill', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockGrainAddition: GrainBill = mockGrainBill()[0];
      _mockGrainAddition.quantity = 15;

      expect(recipePage.variant.grains.length).toBe(3);

      recipePage.updateIngredientList(_mockGrainAddition, 'grains');

      expect(recipePage.variant.grains.length).toBe(4);
      expect(recipePage.variant.grains[0]).toStrictEqual(_mockGrainAddition);
    }); // end 'should add grains instance in grain bill' test

    test('should update grains instance in grain bill', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockGrainUpdate: GrainBill = mockGrainBill()[0];
      _mockGrainUpdate.mill = 0.25;

      recipePage.updateIngredientList(
        _mockGrainUpdate,
        'grains',
        _mockGrainUpdate
      );

      expect(recipePage.variant.grains[0].mill).toBe(0.25);
    }); // end 'should update grains instance in grain bill' test

    test('should delete grains instance from grain bill', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockGrainsToDelete: GrainBill = mockGrainBill()[0];

      recipePage
        .updateIngredientList(undefined, 'grains', _mockGrainsToDelete, true);

      expect(recipePage.variant.grains.length).toBe(2);
      expect(recipePage.variant.grains[0]).not.toStrictEqual(_mockGrainsToDelete);
    }); // end 'should delete grains instance from grain bill' test

    test('should add hops instance to schedule', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockHopsAddition: HopsSchedule = mockHopsSchedule()[0];
      _mockHopsAddition.addAt = 61;

      expect(recipePage.variant.hops.length).toBe(4);

      recipePage.updateIngredientList(_mockHopsAddition, 'hops');

      expect(recipePage.variant.hops.length).toBe(5);
      expect(recipePage.variant.hops[0]).toStrictEqual(_mockHopsAddition);
    }); // end 'should add hops instance to schedule' test

    test('should update hops instance in schedule', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockHopsUpdate: HopsSchedule = mockHopsSchedule()[0];
      _mockHopsUpdate.quantity = 1.5;

      recipePage.updateIngredientList(_mockHopsUpdate, 'hops', _mockHopsUpdate);

      expect(recipePage.variant.hops[0].quantity).toBe(1.5);
    }); // end 'should update hops instance in schedule' test

    test('should delete hops instance from schedule', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockHopsToDelete: HopsSchedule = mockHopsSchedule()[0];

      recipePage.updateIngredientList(undefined, 'hops', _mockHopsToDelete, true);

      expect(recipePage.variant.hops.length).toBe(3);
      expect(recipePage.variant.hops[0]).not.toStrictEqual(_mockHopsToDelete);
    }); // end 'should delete hops instance from schedule' test

    test('should add yeast instance to group', () => {
      fixture.detectChanges();

      const _mockYeastAddition: YeastBatch = mockYeastGroup()[0];
      _mockYeastAddition.quantity = 1.5;

      expect(recipePage.variant.yeast.length).toBe(2);

      recipePage.updateIngredientList(_mockYeastAddition, 'yeast');

      expect(recipePage.variant.yeast.length).toBe(3);
      expect(recipePage.variant.yeast[0]).toStrictEqual(_mockYeastAddition);
    }); // end 'should add yeast instance to group' test

    test('should update yeast instance in group', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockHopsUpdate: YeastBatch = mockYeastGroup()[0];
      _mockHopsUpdate.quantity = 1.5;

      recipePage.updateIngredientList(
        _mockHopsUpdate,
        'yeast',
        _mockHopsUpdate
      );

      expect(recipePage.variant.yeast[0].quantity).toBe(1.5);
    }); // end 'should update yeast instance in group' test

    test('should delete yeast instance from group', () => {
      fixture.detectChanges();

      recipePage.variant = mockRecipeVariantComplete();

      const _mockHopsUpdate: YeastBatch = mockYeastGroup()[0];

      recipePage.updateIngredientList(undefined, 'yeast', _mockHopsUpdate, true);

      expect(recipePage.variant.yeast.length).toBe(1);
      expect(recipePage.variant.yeast[0]).not.toStrictEqual(_mockHopsUpdate);
    }); // end 'should delete yeast instance from group' test

    test('should add an \'other\' ingredient instance to list', () => {
      fixture.detectChanges();

      const _mockOtherIngredient: OtherIngredients = mockOtherIngredient()[0];

      expect(recipePage.variant.otherIngredients.length).toBe(0);

      recipePage.updateIngredientList(_mockOtherIngredient, 'otherIngredients');

      expect(recipePage.variant.otherIngredients.length).toBe(1);
    }); // end 'should add an \'other\' ingredient instance to list' test

    test('should update yeast instance in group', () => {
      fixture.detectChanges();

      const _mockOtherIngredient: OtherIngredients = mockOtherIngredient()[0];

      recipePage.variant.otherIngredients.push(_mockOtherIngredient);

      const _mockOtherIngredientUpdate: OtherIngredients
        = mockOtherIngredient()[0];

      _mockOtherIngredientUpdate.name = 'updated-name';

      recipePage
        .updateIngredientList(
          _mockOtherIngredientUpdate,
          'otherIngredients',
          _mockOtherIngredient
        );

      expect(recipePage.variant.otherIngredients[0].name)
        .toMatch('updated-name');
    }); // end 'should update yeast instance in group' test

    test('should delete yeast instance from group', () => {
      fixture.detectChanges();

      const _mockOtherIngredient: OtherIngredients = mockOtherIngredient()[0];

      recipePage.variant.otherIngredients.push(_mockOtherIngredient);
      recipePage
        .updateIngredientList(
          undefined,
          'otherIngredients',
          _mockOtherIngredient,
          true
        );

      expect(recipePage.variant.otherIngredients.length).toBe(0);
    }); // end 'should delete yeast instance from group' test

    test('should not update an ingredient with an unknown type', () => {
      fixture.detectChanges();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      recipePage.updateIngredientList({}, 'unknown');

      const toastCalls: (string | number)[] = toastSpy.mock.calls[0];

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

      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'pop');

      recipePage.headerNavPopEventHandler({origin: 'RecipeDetailPage'});

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle nav pop event' test

    test('should check if recipe is valid (denoted by a style being selected)', () => {
      fixture.detectChanges();

      recipePage.master = staticDefaultRecipeMaster;

      expect(recipePage.isRecipeValid()).toBe(false);

      recipePage.master = mockRecipeMasterInactive();

      expect(recipePage.isRecipeValid()).toBe(true);
    }); // end 'should check if recipe is valid (denoted by a style being selected)' test

    test('should map updated recipe master and recipe values', () => {
      fixture.detectChanges();

      recipePage.master = mockRecipeMasterActive();
      recipePage.variant = mockRecipeVariantComplete();

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterInactive();
      const _mockRecipeMasterUpdate: RecipeMaster = mockRecipeMasterInactive();

      _mockRecipeMasterUpdate.name = 'update-master';
      _mockRecipeMasterUpdate.isPublic = false;
      _mockRecipeMasterUpdate.owner = 'update-owner';
      recipePage.master = _mockRecipeMaster;

      expect(recipePage.master).not.toStrictEqual(_mockRecipeMasterUpdate);

      recipePage.updateDisplay(_mockRecipeMasterUpdate);

      expect(recipePage.master).toStrictEqual(_mockRecipeMasterUpdate);

      const _mockRecipeVariant: RecipeVariant
        = mockRecipeVariantComplete();
      const _mockRecipeVariantUpdate: RecipeVariant
        = mockRecipeVariantComplete();

      _mockRecipeVariantUpdate.mashDuration = 90;
      _mockRecipeVariantUpdate.boilDuration = 90;
      recipePage.variant = _mockRecipeVariant;

      expect(recipePage.variant).not.toStrictEqual(_mockRecipeVariantUpdate);

      recipePage.updateDisplay(_mockRecipeVariantUpdate);

      expect(recipePage.variant).toStrictEqual(_mockRecipeVariantUpdate);
    }); // end 'should map updated recipe master and recipe values' test

  }); // end 'Other functions' section

});
