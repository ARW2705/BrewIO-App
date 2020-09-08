/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../../test-config/mockmodels/mockBatch';
import { mockInventoryItem } from '../../../../test-config/mockmodels/mockInventoryItem';
import { mockStyles } from '../../../../test-config/mockmodels/mockStyles';
import { NavParamsMock, ViewControllerMock } from '../../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../../shared/interfaces/batch';
import { Style } from '../../../shared/interfaces/library';

/* Page imports */
import { InventoryFormPage } from './inventory-form';

/* Provider imports */
import { LibraryProvider } from '../../../providers/library/library';
import { RecipeProvider } from '../../../providers/recipe/recipe';
import { ToastProvider } from '../../../providers/toast/toast';
import { UserProvider } from '../../../providers/user/user';

describe('Inventory Form Page', () => {
  let fixture: ComponentFixture<InventoryFormPage>;
  let inventoryPage: InventoryFormPage;
  let injector: TestBed;
  let libraryService: LibraryProvider;
  let recipeService: RecipeProvider;
  let toastService: ToastProvider;
  let userService: UserProvider;
  let viewCtrl: ViewController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        InventoryFormPage
      ],
      imports: [
        IonicModule.forRoot(InventoryFormPage)
      ],
      providers: [
        { provide: LibraryProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: ViewController, useClass: ViewControllerMock },
        { provide: NavParams, useClass: NavParamsMock}
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeAll(async(() => {
    injector = getTestBed();
    libraryService = injector.get(LibraryProvider);
    recipeService = injector.get(RecipeProvider);
    toastService = injector.get(ToastProvider);
    userService = injector.get(UserProvider);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryFormPage);
    inventoryPage = fixture.componentInstance;

    viewCtrl = injector.get(ViewController);
    libraryService.getStyleLibrary = jest
      .fn()
      .mockReturnValue(of(mockStyles()));
  });

  test('should create the component with generic form controls', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', {});

    const genericSpy: jest.SpyInstance = jest
      .spyOn(inventoryPage, 'initFormGeneric');

    fixture.detectChanges();

    expect(inventoryPage).toBeDefined();
    expect(genericSpy).toHaveBeenCalled();
  }); // end 'should create the component with generic form controls' test

  test('should create the component with form controls for a provided batch', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', { batch: mockBatch() });

    const batchSpy: jest.SpyInstance = jest
      .spyOn(inventoryPage, 'initFormWithBatch');

    fixture.detectChanges();

    expect(inventoryPage).toBeDefined();
    expect(batchSpy).toHaveBeenCalled();
  }); // end 'should create the component with form controls for a provided batch' test

  test('should create the component with form controls for a provided item', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', { item: mockInventoryItem() });

    const itemSpy: jest.SpyInstance = jest
      .spyOn(inventoryPage, 'initFormWithItem');

    fixture.detectChanges();

    expect(inventoryPage).toBeDefined();
    expect(itemSpy).toHaveBeenCalled();
  }); // end 'should create the component with form controls for a provided item' test

  test('should get an error message from styles library', () => {
    libraryService.getStyleLibrary = jest
      .fn()
      .mockReturnValue(new ErrorObservable('library error'));

    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    fixture.detectChanges();

    expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
      .toMatch('Inventory form error: library error');
  }); // end 'should get an error message from styles library' test

  test('should compare objects for equality', () => {
    fixture.detectChanges();

    const o1a: object = { _id: 1 };
    const o1b: object = { _id: 1 };
    const o2:  object = { _id: 2 };

    expect(inventoryPage.compareWithFn(o1a, o1b)).toBe(true);
    expect(inventoryPage.compareWithFn(o1a, o2)).toBe(false);
  }); // end 'should compare objects for equality' test

  test('should convert numeric fields from strings to numbers', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', { item: mockInventoryItem() });

    fixture.detectChanges();

    const form: FormGroup = inventoryPage.inventoryForm;

    const hasField = (key: string) => {
      return inventoryPage.numericFieldKeys.some(
        (field: string): boolean => field === key
      );
    };

    // set numeric fields to string types as ion-input would do with a user input
    Object.keys(form.controls).forEach((key: string): void => {
      if (hasField(key)) {
        form.controls[key].setValue(form.controls[key].value.toString());
      }
    });

    const converted: object = inventoryPage.convertFormValuesToNumbers();

    Object.keys(converted).forEach((key: string): void => {
      if (hasField(key)) {
        expect(typeof converted[key]).toMatch('number');
      }
    });
  }); // end 'should convert numeric fields from strings to numbers' test

  test('should dismiss the form with no data', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', {});

    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    inventoryPage.dismiss();

    expect(dismissSpy.mock.calls[0].length).toEqual(0);
  }); // end 'should dismiss the form with no data' test

  test('should update the selected style', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', {});

    fixture.detectChanges();

    const _mockStyle: Style = mockStyles()[0];

    expect(inventoryPage.styleSelection).toBeUndefined();

    inventoryPage.onStyleSelection(_mockStyle);

    expect(inventoryPage.styleSelection).toBe(_mockStyle);
  }); // end 'should update the selected style' test

  test('should submit the form', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', {});

    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    const form: FormGroup = inventoryPage.inventoryForm;
    const _mockStyle: Style = mockStyles()[0];
    inventoryPage.styleSelection = _mockStyle;

    form.controls.initialQuantity.setValue('5');
    form.controls.itemABV.setValue('5');
    form.controls.itemIBU.setValue('20');
    form.controls.itemName.setValue('item-name');
    form.controls.itemSRM.setValue('10');
    form.controls.itemStyleId.setValue(_mockStyle);
    form.controls.sourceType.setValue('third');
    form.controls.stockType.setValue('keg');
    form.controls.supplierName.setValue('supplier');

    inventoryPage.onSubmit();

    expect(dismissSpy).toHaveBeenCalledWith({
      description: '',
      initialQuantity: 5,
      itemABV: 5,
      itemIBU: 20,
      itemName: 'item-name',
      itemSRM: 10,
      itemStyleId: _mockStyle._id,
      itemStyleName: _mockStyle.name,
      itemSubname: '',
      sourceType: 'third',
      stockType: 'keg',
      supplierName: 'supplier',
      supplierURL: '',
    });
  }); // end 'should submit the form' test

  test('should submit the form using provided batch\'s style selection', () => {
    const _mockBatch: Batch = mockBatch();
    const _mockStyle: Style = mockStyles()[0];
    _mockBatch.annotations.styleId = _mockStyle._id;

    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', { batch: _mockBatch });

    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    const form: FormGroup = inventoryPage.inventoryForm;

    form.controls.initialQuantity.setValue('5');
    form.controls.stockType.setValue('keg');

    inventoryPage.onSubmit();

    expect(dismissSpy).toHaveBeenCalledWith({
      description: '',
      initialQuantity: 5,
      itemStyleId: _mockStyle._id,
      itemStyleName: _mockStyle.name,
      stockType: 'keg'
    });
  }); // end 'should submit the form using provided batch\'s style selection' test

});
