/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavParams, ViewController } from 'ionic-angular';
import { FormGroup, FormControl } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
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
import { InventoryItem } from '../../../shared/interfaces/inventory-item';
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
  let viewCtrl: ViewController;
  const staticMockBatch: Batch = mockBatch();
  const staticMockItem: InventoryItem = mockInventoryItem();
  const staticStyleLibrary: Style[] = mockStyles();
  let originalNgOnInit: any;
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
    libraryService = injector.get(LibraryProvider);
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryFormPage);
    inventoryPage = fixture.componentInstance;

    viewCtrl = injector.get(ViewController);
    libraryService.getStyleLibrary = jest
      .fn()
      .mockReturnValue(of(staticStyleLibrary));

    originalNgOnInit = inventoryPage.ngOnInit;
    inventoryPage.ngOnInit = jest
      .fn();
  });

  test('should create the component with generic form controls', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', {});

    inventoryPage.ngOnInit = originalNgOnInit;

    const genericSpy: jest.SpyInstance = jest
      .spyOn(inventoryPage, 'initFormGeneric');

    fixture.detectChanges();

    expect(inventoryPage).toBeDefined();
    expect(genericSpy).toHaveBeenCalled();
  }); // end 'should create the component with generic form controls' test

  test('should create the component with form controls for a provided batch', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', { batch: staticMockBatch });

    inventoryPage.ngOnInit = originalNgOnInit;

    inventoryPage.initFormWithBatch = jest
      .fn();

    const batchSpy: jest.SpyInstance = jest
      .spyOn(inventoryPage, 'initFormWithBatch');

    fixture.detectChanges();

    expect(inventoryPage).toBeDefined();
    expect(batchSpy).toHaveBeenCalled();
  }); // end 'should create the component with form controls for a provided batch' test

  test('should create the component with form controls for a provided item', () => {
    NavParamsMock.setParams('isRequired', false);
    NavParamsMock.setParams('options', { item: staticMockItem });

    inventoryPage.ngOnInit = originalNgOnInit;

    inventoryPage.initFormWithItem = jest
      .fn();

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

    inventoryPage.ngOnInit = originalNgOnInit;

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
    expect(inventoryPage.compareWithFn(o1a, undefined)).toBe(false);
  }); // end 'should compare objects for equality' test

  test('should convert numeric fields from strings to numbers', () => {
    inventoryPage.batch = staticMockBatch;

    inventoryPage.inventoryForm = new FormGroup({
      currentQuantity: new FormControl('10'),
      initialQuantity: new FormControl('20'),
      itemABV: new FormControl('5'),
      itemIBU: new FormControl('20'),
      itemSRM: new FormControl('10'),
      description: new FormControl(''),
      stockType: new FormControl('')
    });

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
    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    fixture.detectChanges();

    inventoryPage.dismiss();

    expect(dismissSpy.mock.calls[0].length).toEqual(0);
  }); // end 'should dismiss the form with no data' test

  test('should init form with a batch', () => {
    fixture.detectChanges();

    inventoryPage.initFormWithBatch();

    expect(inventoryPage.inventoryForm.value).toStrictEqual({
      description: '',
      initialQuantity: '',
      stockType: ''
    });
  }); // end 'should init form with a batch' test

  test('should init generic form', () => {
    fixture.detectChanges();

    inventoryPage.initFormGeneric();

    expect(inventoryPage.inventoryForm.value).toStrictEqual({
      description: '',
      initialQuantity: null,
      itemABV: null,
      itemIBU: null,
      itemName: '',
      itemSRM: null,
      itemStyleId: null,
      itemSubname: '',
      sourceType: '',
      stockType: '',
      supplierName: '',
      supplierURL: ''
    });
  }); // end 'should init generic form' test

  test('should init form with an item', () => {
    const _mockItem: InventoryItem = staticMockItem;
    inventoryPage.item = _mockItem;
    inventoryPage.styles = staticStyleLibrary;

    fixture.detectChanges();

    inventoryPage.initFormWithItem();

    expect(inventoryPage.inventoryForm.value).toStrictEqual({
      currentQuantity: _mockItem.currentQuantity,
      description: _mockItem.description,
      initialQuantity: _mockItem.initialQuantity,
      itemABV: _mockItem.itemABV,
      itemName: _mockItem.itemName,
      itemStyleId: staticStyleLibrary[0],
      sourceType: _mockItem.sourceType,
      stockType: _mockItem.stockType,
      supplierName: _mockItem.supplierName,
      itemIBU: _mockItem.optionalItemData.itemIBU,
      itemSRM: _mockItem.optionalItemData.itemSRM,
      itemSubname: _mockItem.optionalItemData.itemSubname,
      originalRecipeId: _mockItem.optionalItemData.originalRecipeId,
      packagingDate: _mockItem.optionalItemData.packagingDate,
      supplierURL: _mockItem.optionalItemData.supplierURL,
      supplierLabelImageURL: _mockItem.optionalItemData.supplierLabelImageURL,
      itemLabelImageURL: _mockItem.optionalItemData.itemLabelImageURL
    });
  }); // end 'should init form with an item' test

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
    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    const _mockStyle: Style = staticStyleLibrary[0];
    inventoryPage.styleSelection = _mockStyle;

    inventoryPage.inventoryForm = new FormGroup({
      initialQuantity: new FormControl('5'),
      itemABV: new FormControl('5'),
      itemIBU: new FormControl('20'),
      itemName: new FormControl('item-name'),
      itemSRM: new FormControl('10'),
      itemStyleId: new FormControl(_mockStyle),
      sourceType: new FormControl('third'),
      stockType: new FormControl('keg'),
      supplierName: new FormControl('supplier'),
      description: new FormControl(''),
    });

    fixture.detectChanges();

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
      sourceType: 'third',
      stockType: 'keg',
      supplierName: 'supplier'
    });
  }); // end 'should submit the form' test

  test('should submit the form using provided batch\'s style selection', () => {
    const _mockBatch: Batch = staticMockBatch;
    const _mockStyle: Style = staticStyleLibrary[0];
    _mockBatch.annotations.styleId = _mockStyle._id;
    inventoryPage.styles = staticStyleLibrary;

    const dismissSpy: jest.SpyInstance = jest.spyOn(viewCtrl, 'dismiss');

    inventoryPage.batch = _mockBatch;

    inventoryPage.inventoryForm = new FormGroup({
      description: new FormControl(''),
      initialQuantity: new FormControl(5),
      itemStyleId: new FormControl(_mockStyle._id),
      itemStyleName: new FormControl(_mockStyle.name),
      stockType: new FormControl('keg')
    })

    fixture.detectChanges();

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
