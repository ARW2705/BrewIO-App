/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { IonicModule, ModalController, NavController, NavParams } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockInventoryItem } from '../../../test-config/mockmodels/mockInventoryItem';
import { NavMock, NavParamsMock, ModalControllerMock, ModalMock } from '../../../test-config/mocks-ionic';

/* Constant imports */
import { STOCK_TYPES } from '../../shared/constants/stock-types';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { InventoryItem } from '../../shared/interfaces/inventory-item';

/* Component imports */
import { InventoryComponent } from './inventory';

/* Page imports */
import { InventoryFormPage } from '../../pages/forms/inventory-form/inventory-form';
import { ProcessMeasurementsFormPage } from '../../pages/forms/process-measurements-form/process-measurements-form';

/* Provider imports */
import { InventoryProvider } from '../../providers/inventory/inventory';
import { ProcessProvider } from '../../providers/process/process';
import { ToastProvider } from '../../providers/toast/toast';

describe('Inventory Component', () => {
  let fixture: ComponentFixture<InventoryComponent>;
  let inventoryCmp: InventoryComponent;
  let injector: TestBed;
  let inventoryService: InventoryProvider;
  let processService: ProcessProvider;
  let toastService: ToastProvider;
  let navCtrl: NavController;
  let modalCtrl: ModalController;
  let originalOnInit: any;
  let originalOnDestroy: any;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        InventoryComponent
      ],
      imports: [
        IonicModule.forRoot(InventoryComponent)
      ],
      providers: [
        { provide: InventoryProvider, useValue: {} },
        { provide: ProcessProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ModalController, useClass: ModalControllerMock }
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
    inventoryService = injector.get(InventoryProvider);
    processService = injector.get(ProcessProvider);
    toastService = injector.get(ToastProvider);

    const _mockInventoryItem = mockInventoryItem();
    inventoryService.getInventoryList = jest
      .fn()
      .mockReturnValue(
        new BehaviorSubject<InventoryItem[]>([
          _mockInventoryItem,
          _mockInventoryItem,
          _mockInventoryItem
        ])
      );

    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InventoryComponent);
    inventoryCmp = fixture.componentInstance;

    navCtrl = injector.get(NavController);
    modalCtrl = injector.get(ModalController);

    NavParamsMock.setParams('onInit', false);

    originalOnInit = inventoryCmp.ngOnInit;
    inventoryCmp.ngOnInit = jest
      .fn();

    originalOnDestroy = inventoryCmp.ngOnDestroy;
    inventoryCmp.ngOnDestroy = jest
      .fn();
  });

  describe('Component creation', () => {

    test('should create the component', () => {
      fixture.detectChanges();

      expect(inventoryCmp).toBeDefined();
    }); // end 'should create the component' test

    test('should set nav stack and open measurement form on init', () => {
      inventoryCmp.ngOnInit = originalOnInit;
      inventoryCmp.ngOnDestroy = originalOnDestroy;

      NavParamsMock.setParams('onInit', true);
      NavParamsMock.setParams('sourceBatchId', 'batchId');

      navCtrl.remove = jest
        .fn();
      navCtrl.length = jest
        .fn()
        .mockReturnValue(3);
      inventoryCmp.loadInventoryList = jest
        .fn();
      inventoryCmp.openMeasurementFormModal = jest
        .fn();

      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'remove');
      const modalSpy: jest.SpyInstance = jest
        .spyOn(inventoryCmp, 'openMeasurementFormModal');

      inventoryCmp.ngOnInit();

      expect(navSpy).toHaveBeenCalledWith(1, 1);
      expect(modalSpy).toHaveBeenCalledWith('batchId');
    }); // end 'should set nav stack and open measurement form on init' test

  }); // end 'Component creation' section


  describe('Display operations', () => {

    test('should toggle item expansion', () => {
      fixture.detectChanges();

      expect(inventoryCmp.itemIndex).toEqual(-1);

      inventoryCmp.expandItem(2);

      expect(inventoryCmp.itemIndex).toEqual(2);

      inventoryCmp.expandItem(2);

      expect(inventoryCmp.itemIndex).toEqual(-1);
    }); // end 'should toggle item expansion' test

    test('should get formatted stock type text', () => {
      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.currentQuantity = 2;

      const discreteItem: string = inventoryCmp
        .getStockTypeDisplayText(_mockInventoryItem);

      expect(discreteItem).toMatch('2 Bottles');

      _mockInventoryItem.stockType = STOCK_TYPES[STOCK_TYPES.length - 1].name;
      const nonDiscreteItem: string = inventoryCmp
        .getStockTypeDisplayText(_mockInventoryItem);

      expect(nonDiscreteItem).toMatch('40% Keg')
    }); // end 'should get formatted stock type text' test

    test('should reset display list', () => {
      fixture.detectChanges();

      inventoryCmp.sortBySource = jest
        .fn();
      inventoryCmp.sortByRemaining = jest
        .fn();
      inventoryCmp.sortByAlphabetical = jest
        .fn();

      const sourceSpy: jest.SpyInstance = jest
        .spyOn(inventoryCmp, 'sortBySource');
      const remainingSpy: jest.SpyInstance = jest
        .spyOn(inventoryCmp, 'sortByRemaining');
      const alphaSpy: jest.SpyInstance = jest
        .spyOn(inventoryCmp, 'sortByAlphabetical');

      inventoryCmp.resetDisplayList();

      expect(alphaSpy).toHaveBeenCalled();
      expect(sourceSpy).not.toHaveBeenCalled();
      expect(remainingSpy).not.toHaveBeenCalled();

      inventoryCmp.sortBy = 'Source';
      inventoryCmp.resetDisplayList();

      expect(sourceSpy).toHaveBeenCalled();
      expect(remainingSpy).not.toHaveBeenCalled();

      inventoryCmp.sortBy = 'Remaining';
      inventoryCmp.resetDisplayList();

      expect(remainingSpy).toHaveBeenCalled();
    }); // end 'should reset display list' test

  }); // end 'Display operations' section


  describe('Inventory action operations', () => {

    test('should decrement item count', () => {
      inventoryService.patchItem = jest
        .fn()
        .mockReturnValue(of({}));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'patchItem');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      inventoryCmp.decrementCount(_mockInventoryItem);

      expect(patchSpy).toHaveBeenCalledWith(
        _mockInventoryItem.cid,
        {
          currentQuantity: _mockInventoryItem.currentQuantity - 1
        }
      );
      expect(toastSpy).toHaveBeenCalledWith(
        'Decreased Item Count',
        1500
      );
    }); // end 'should decrement item count' test

    test('should get an error when decreasing item count', () => {
      inventoryService.patchItem = jest
        .fn()
        .mockReturnValue(new ErrorObservable('patch error'));

      const patchSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'patchItem');
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      inventoryCmp.decrementCount(_mockInventoryItem);

      expect(patchSpy).toHaveBeenCalledWith(
        _mockInventoryItem.cid,
        {
          currentQuantity: _mockInventoryItem.currentQuantity - 1
        }
      );
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Count error: patch error');
    }); // end 'should get an error when decreasing item count' test

    test('should load the inventory list', () => {
      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.cid = '0000000000000';

      inventoryService.getInventoryList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<InventoryItem[]>([_mockInventoryItem])
        );
      inventoryCmp.resetDisplayList = jest
        .fn();

      const resetSpy: jest.SpyInstance = jest
        .spyOn(inventoryCmp, 'resetDisplayList');

      inventoryCmp.loadInventoryList();

      expect(resetSpy).toHaveBeenCalled();
      expect(inventoryCmp.displayList.length).toEqual(1);
      expect(inventoryCmp.displayList[0]).toStrictEqual(_mockInventoryItem);
    }); // end 'should load the inventory list' test

    test('should get an error loading the inventory list', () => {
      fixture.detectChanges();

      inventoryService.getInventoryList = jest
        .fn()
        .mockReturnValue(new ErrorObservable('inventory error'));
      inventoryCmp.resetDisplayList = jest
        .fn();

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryCmp.loadInventoryList();

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Error loading inventory: inventory error');
    }); // end 'should get an error loading the inventory list' test

    test('should call remove item', () => {
      fixture.detectChanges();

      inventoryService.removeItem = jest
        .fn()
        .mockReturnValue(of({}));

      const removeSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'removeItem');

      inventoryCmp.removeItem('itemId');

      expect(removeSpy).toHaveBeenCalledWith('itemId');
    }); // end 'should call remove item' test

    test('should get an error after calling remove item', () => {
      fixture.detectChanges();

      inventoryService.removeItem = jest
        .fn()
        .mockReturnValue(new ErrorObservable('remove error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryCmp.removeItem('itemId');

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Error removing item: remove error');
    }); // end 'should get an error after calling remove item' test

  }); // end 'Inventory action operations' section


  describe('Modals', () => {

    test('should open the inventory form modal', () => {
      fixture.detectChanges();

      const _mockModal: ModalMock = new ModalMock();
      const _mockInventoryItem: InventoryItem = mockInventoryItem();

      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      inventoryService.addItem = jest
        .fn()
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(new ErrorObservable('error adding item'));
      inventoryService.patchItem = jest
        .fn()
        .mockReturnValueOnce(of(_mockInventoryItem))
        .mockReturnValueOnce(new ErrorObservable('error updating item'));
      inventoryService.generateItemFromBatch = jest
        .fn()
        .mockReturnValueOnce(of(_mockInventoryItem))
        .mockReturnValueOnce(new ErrorObservable('error generating item'));

      // Top level modal method spies
      const createSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');
      const presentSpy: jest.SpyInstance = jest.spyOn(_mockModal, 'present');

      const addSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'addItem');
      const patchSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'patchItem');
      const genSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'generateItemFromBatch');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const consoleSpy: jest.SpyInstance = jest
        .spyOn(console, 'log');

      // Set modal data for onDidDismiss callback
      _mockModal._setCallBackData(_mockInventoryItem);

      // Test modal for new item - no item or batch given
      inventoryCmp.openInventoryFormModal({});

      expect(createSpy.mock.calls[0][0]).toStrictEqual(InventoryFormPage);
      expect(createSpy.mock.calls[0][1]).toStrictEqual(
        {
          options: {},
          isRequired: false
        }
      );
      expect(addSpy).toHaveBeenCalledWith(_mockInventoryItem);
      expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0])
        .toMatch('Added new item to inventory!');

      // Test for expected error
      inventoryCmp.openInventoryFormModal({});
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Inventory error: error adding item');

      /* ----------------------------------------------- */

      // Test modal for item update
      inventoryCmp.openInventoryFormModal({item: _mockInventoryItem});

      expect(createSpy.mock.calls[2][0]).toStrictEqual(InventoryFormPage);
      expect(createSpy.mock.calls[2][1]).toStrictEqual(
        {
          options: { item: _mockInventoryItem },
          isRequired: false
        }
      );
      expect(patchSpy).toHaveBeenCalledWith(
        _mockInventoryItem.cid,
        _mockInventoryItem
      );
      expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0])
        .toMatch('Updated item');

      // Test for expected error
      inventoryCmp.openInventoryFormModal({item: _mockInventoryItem});
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Inventory error: error updating item');

      /* ----------------------------------------------- */

      // Test modal for new item based on a batch
      const _mockBatch: Batch = mockBatch();
      inventoryCmp.openInventoryFormModal({batch: _mockBatch});

      expect(createSpy.mock.calls[4][0]).toStrictEqual(InventoryFormPage);
      expect(createSpy.mock.calls[4][1]).toStrictEqual(
        {
          options: { batch: _mockBatch },
          isRequired: true
        }
      );

      expect(genSpy).toHaveBeenCalledWith(
        _mockBatch,
        _mockInventoryItem
      );
      expect(toastSpy.mock.calls[toastSpy.mock.calls.length - 1][0])
        .toMatch('Added new item to inventory!');

      // Test for expected error
      inventoryCmp.openInventoryFormModal({batch: _mockBatch});
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Inventory error: error generating item');

      expect(presentSpy).toHaveBeenCalled();
    });

    test('should open measurements form modal', () => {
      fixture.detectChanges();

      const _mockBatch: Batch = mockBatch();
      const _mockModal: ModalMock = new ModalMock();

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));
      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);
      processService.patchMeasuredValues = jest
        .fn()
        .mockReturnValueOnce(of(_mockBatch))
        .mockReturnValueOnce(new ErrorObservable('error updating batch'));
      inventoryCmp.openInventoryFormModal = jest
        .fn();

      const createSpy: jest.SpyInstance = jest
        .spyOn(modalCtrl, 'create');
      const presentSpy: jest.SpyInstance = jest
        .spyOn(_mockModal, 'present');
      const patchSpy: jest.SpyInstance = jest
        .spyOn(processService, 'patchMeasuredValues');
      const formSpy: jest.SpyInstance = jest
        .spyOn(inventoryCmp, 'openInventoryFormModal');
      const consoleSpy: jest.SpyInstance = jest
        .spyOn(console, 'log');

      _mockModal._setCallBackData(_mockBatch);

      inventoryCmp.openMeasurementFormModal(_mockBatch.cid);

      expect(createSpy).toHaveBeenCalledWith(
        ProcessMeasurementsFormPage,
        {
          areAllRequired: true,
          batch: _mockBatch
        }
      );
      expect(patchSpy).toHaveBeenCalledWith(
        false,
        _mockBatch._id,
        _mockBatch
      )
      expect(formSpy).toHaveBeenCalledWith({ batch: _mockBatch });

      inventoryCmp.openMeasurementFormModal(_mockBatch.cid);

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Batch update error: error updating batch');

      expect(presentSpy).toHaveBeenCalled();
    }); // end 'should open measurements form modal' test

  }); // end 'Modals' section


  describe('Sorting', () => {

    test('should change sorting direction', () => {
      fixture.detectChanges();

      inventoryCmp.resetDisplayList = jest
        .fn();

      inventoryCmp.onDirectionChange(true);
      expect(inventoryCmp.isAscending).toBe(true);
      inventoryCmp.onDirectionChange(false);
      expect(inventoryCmp.isAscending).toBe(false);
    }); // end 'should change sorting direction' test

    test('should change sort by parameter', () => {
      fixture.detectChanges();

      inventoryCmp.resetDisplayList = jest
        .fn();

      inventoryCmp.onSortChange('alphabetical');
      expect(inventoryCmp.sortBy).toMatch('alphabetical');
      inventoryCmp.onSortChange('source');
      expect(inventoryCmp.sortBy).toMatch('source');
    }); // end 'should change sort by parameter' test

    test('should sort items alphabetically by name', () => {
      fixture.detectChanges();

      const _mockItem1: InventoryItem = mockInventoryItem();
      _mockItem1.itemName = 'Aname';
      const _mockItem2: InventoryItem = mockInventoryItem();
      _mockItem2.itemName = 'Bname';
      const _mockItem3: InventoryItem = mockInventoryItem();
      _mockItem3.itemName = 'Cname';

      inventoryCmp.displayList = [
        _mockItem2,
        _mockItem3,
        _mockItem1
      ];
      inventoryCmp.isAscending = true;

      inventoryCmp.sortByAlphabetical();

      expect(inventoryCmp.displayList[0].itemName).toMatch('Aname');
      expect(inventoryCmp.displayList[1].itemName).toMatch('Bname');
      expect(inventoryCmp.displayList[2].itemName).toMatch('Cname');

      inventoryCmp.isAscending = false;

      inventoryCmp.sortByAlphabetical();

      expect(inventoryCmp.displayList[0].itemName).toMatch('Cname');
      expect(inventoryCmp.displayList[1].itemName).toMatch('Bname');
      expect(inventoryCmp.displayList[2].itemName).toMatch('Aname');
    }); // end 'should sort items alphabetically by name' test

    test('should sort items by quantity remaining', () => {
      fixture.detectChanges();

      const _mockItem1: InventoryItem = mockInventoryItem();
      _mockItem1.currentQuantity = 5;
      const _mockItem2: InventoryItem = mockInventoryItem();
      _mockItem2.currentQuantity = 3;
      const _mockItem3: InventoryItem = mockInventoryItem();
      _mockItem3.currentQuantity = 1;

      inventoryCmp.displayList = [
        _mockItem2,
        _mockItem3,
        _mockItem1
      ];
      inventoryCmp.isAscending = true;

      inventoryCmp.sortByRemaining();

      expect(inventoryCmp.displayList[0].currentQuantity).toEqual(1);
      expect(inventoryCmp.displayList[1].currentQuantity).toEqual(3);
      expect(inventoryCmp.displayList[2].currentQuantity).toEqual(5);

      inventoryCmp.isAscending = false;

      inventoryCmp.sortByRemaining();

      expect(inventoryCmp.displayList[0].currentQuantity).toEqual(5);
      expect(inventoryCmp.displayList[1].currentQuantity).toEqual(3);
      expect(inventoryCmp.displayList[2].currentQuantity).toEqual(1);
    }); // end 'should sort items by quantity remaining' test

    test('should sort items by source type', () => {
      fixture.detectChanges();

      const _mockItem1: InventoryItem = mockInventoryItem();
      _mockItem1.sourceType = 'self';
      const _mockItem2: InventoryItem = mockInventoryItem();
      _mockItem2.sourceType = 'other';
      const _mockItem3: InventoryItem = mockInventoryItem();
      _mockItem3.sourceType = 'third';

      inventoryCmp.displayList = [
        _mockItem2,
        _mockItem3,
        _mockItem1
      ];

      // Ascending order is self -> other -> third
      inventoryCmp.isAscending = true;

      inventoryCmp.sortBySource();

      expect(inventoryCmp.displayList[0].sourceType).toMatch('self');
      expect(inventoryCmp.displayList[1].sourceType).toMatch('other');
      expect(inventoryCmp.displayList[2].sourceType).toMatch('third');

      inventoryCmp.isAscending = false;

      inventoryCmp.sortBySource();

      expect(inventoryCmp.displayList[0].sourceType).toMatch('third');
      expect(inventoryCmp.displayList[1].sourceType).toMatch('other');
      expect(inventoryCmp.displayList[2].sourceType).toMatch('self');
    }); // end 'should sort items by source type' test

  }); // end 'Sorting' section


  describe('Styling', () => {

    test('should get ABV color style', () => {
      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();

      _mockInventoryItem.itemABV = 0;
      expect(inventoryCmp.getABVStyle(_mockInventoryItem).color)
        .toMatch('#f4f4f4');
      _mockInventoryItem.itemABV = 6;
      expect(inventoryCmp.getABVStyle(_mockInventoryItem).color)
        .toMatch('#40e0cf');
      _mockInventoryItem.itemABV = 8;
      expect(inventoryCmp.getABVStyle(_mockInventoryItem).color)
        .toMatch('#ff9649');
      _mockInventoryItem.itemABV = 11;
      expect(inventoryCmp.getABVStyle(_mockInventoryItem).color)
        .toMatch('#fd4855');
    }); // end 'should get ABV color style' test

    test('should get IBU color style', () => {
      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();

      _mockInventoryItem.optionalItemData.itemIBU = 0;
      expect(inventoryCmp.getIBUStyle(_mockInventoryItem).color)
        .toMatch('#f4f4f4');
      _mockInventoryItem.optionalItemData.itemIBU = 21;
      expect(inventoryCmp.getIBUStyle(_mockInventoryItem).color)
        .toMatch('#9bc484');
      _mockInventoryItem.optionalItemData.itemIBU = 61;
      expect(inventoryCmp.getIBUStyle(_mockInventoryItem).color)
        .toMatch('#309400');
      _mockInventoryItem.optionalItemData.itemIBU = 101;
      expect(inventoryCmp.getIBUStyle(_mockInventoryItem).color)
        .toMatch('#161312');
    }); // end 'should get IBU color style' test

    test('should get quantity color style', () => {
      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.initialQuantity = 100;

      _mockInventoryItem.currentQuantity = 70;
      expect(inventoryCmp.getQuantityStyle(_mockInventoryItem).color)
        .toMatch('#f4f4f4');
      _mockInventoryItem.currentQuantity = 40;
      expect(inventoryCmp.getQuantityStyle(_mockInventoryItem).color)
        .toMatch('#ff9649');
      _mockInventoryItem.currentQuantity = 20;
      expect(inventoryCmp.getQuantityStyle(_mockInventoryItem).color)
        .toMatch('#fd4855');
    }); // end 'should get quantity color style' test

    test('should get SRM color style', () => {
      fixture.detectChanges();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();

      _mockInventoryItem.optionalItemData.itemSRM = 15;
      expect(inventoryCmp.getSRMStyle(_mockInventoryItem).color)
        .toMatch('#b65300');
      _mockInventoryItem.optionalItemData.itemSRM = 50;
      expect(inventoryCmp.getSRMStyle(_mockInventoryItem).color)
        .toMatch('#140303');
    }); // end 'should get SRM color style' test

  }); // end 'Styling' section

});
