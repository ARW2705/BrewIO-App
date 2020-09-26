/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';
import { SRM_HEX_CHART } from '../../shared/constants/srm-hex-chart';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { mockInventoryItem, mockOptionalItemData } from '../../../test-config/mockmodels/mockInventoryItem';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockStyles } from '../../../test-config/mockmodels/mockStyles';
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Interface imports*/
import { Author } from '../../shared/interfaces/author';
import { Batch } from '../../shared/interfaces/batch';
import { InventoryItem, OptionalItemData } from '../../shared/interfaces/inventory-item';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Style } from '../../shared/interfaces/library';

/* Provider imports */
import { InventoryProvider } from './inventory';
import { ClientIdProvider } from '../client-id/client-id';
import { ConnectionProvider } from '../connection/connection';
import { LibraryProvider } from '../library/library';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { ProcessProvider } from '../process/process';
import { RecipeProvider } from '../recipe/recipe';
import { StorageProvider } from '../storage/storage';
import { SyncProvider } from '../sync/sync';
import { UserProvider } from '../user/user';


describe('Inventory Service', () => {
  let injector: TestBed;
  let inventoryService: InventoryProvider;
  let httpMock: HttpTestingController;
  let clientIdService: ClientIdProvider;
  let connectionService: ConnectionProvider;
  let libraryService: LibraryProvider;
  let processService: ProcessProvider;
  let processHttpError: ProcessHttpErrorProvider;
  let recipeService: RecipeProvider;
  let storage: StorageProvider;
  let sync: SyncProvider;
  let userService: UserProvider;
  const staticItem: InventoryItem = mockInventoryItem();
  const staticBatch: Batch = mockBatch();
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        InventoryProvider,
        { provide: ClientIdProvider, useValue: {} },
        { provide: ConnectionProvider, useValue: {} },
        { provide: LibraryProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: ProcessProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: SyncProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: Events, useClass: EventsMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    inventoryService = injector.get(InventoryProvider);
    httpMock = injector.get(HttpTestingController);
    clientIdService = injector.get(ClientIdProvider);
    connectionService = injector.get(ConnectionProvider);
    libraryService = injector.get(LibraryProvider);
    processService = injector.get(ProcessProvider);
    processHttpError = injector.get(ProcessHttpErrorProvider);
    recipeService = injector.get(RecipeProvider);
    storage = injector.get(StorageProvider);
    sync = injector.get(SyncProvider);
    userService = injector.get(UserProvider);

    sync.addSyncFlag = jest.fn();
    storage.setInventory = jest.fn();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Action methods', () => {

    beforeEach(() => {
      inventoryService.inventory$ = new BehaviorSubject<InventoryItem[]>(
        [ staticItem ]
      );
    });

    afterEach(() => {
      inventoryService.inventory$.next([]);
    });

    test('should format a new item to be added [online]', done => {
      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('0123456789012');
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      inventoryService.mapOptionalData = jest
        .fn();
      inventoryService.addItemToList = jest
        .fn()
        .mockImplementation((item: InventoryItem) => {
          return of(item);
        });

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.currentQuantity = 5;
      _mockInventoryItem.optionalItemData = {};

      const newItemValues: object = {
        supplierName: _mockInventoryItem.supplierName,
        stockType: _mockInventoryItem.stockType,
        initialQuantity: _mockInventoryItem.initialQuantity,
        description: _mockInventoryItem.description,
        itemStyleId: _mockInventoryItem.itemStyleId,
        itemStyleName: _mockInventoryItem.itemStyleName,
        itemName: _mockInventoryItem.itemName,
        itemABV: _mockInventoryItem.itemABV,
        sourceType: _mockInventoryItem.sourceType
      };

      inventoryService.addItem(newItemValues)
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toStrictEqual(_mockInventoryItem);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const postReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/inventory`);
      expect(postReq.request.method).toMatch('POST');
      postReq.flush(_mockInventoryItem);
    }); // end 'should format a new item to be added [online]' test

    test('should format a new item to be added [offline]', done => {
      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('0123456789012');
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(false);
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);
      inventoryService.mapOptionalData = jest
        .fn();
      inventoryService.addItemToList = jest
        .fn()
        .mockImplementation((item: InventoryItem) => {
          return of(item);
        });

      const addSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'addSyncFlag');

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.currentQuantity = 5;
      _mockInventoryItem.optionalItemData = {};

      const newItemValues: object = {
        supplierName: _mockInventoryItem.supplierName,
        stockType: _mockInventoryItem.stockType,
        initialQuantity: _mockInventoryItem.initialQuantity,
        description: _mockInventoryItem.description,
        itemStyleId: _mockInventoryItem.itemStyleId,
        itemStyleName: _mockInventoryItem.itemStyleName,
        itemName: _mockInventoryItem.itemName,
        itemABV: _mockInventoryItem.itemABV,
        sourceType: _mockInventoryItem.sourceType
      };

      inventoryService.addItem(newItemValues)
        .subscribe(
          (response: InventoryItem): void => {
            expect(Date.parse(response.createdAt)).not.toBeNaN();
            delete response.createdAt;
            expect(response).toStrictEqual(_mockInventoryItem);
            expect(addSpy).toHaveBeenCalledWith(
              'create',
              '0123456789012'
            );
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should format a new item to be added [offline]' test

    test('should get error response formatting a new item to be added [online]', done => {
      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('0123456789012');
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      inventoryService.mapOptionalData = jest
        .fn();
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Bad Request'));

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.currentQuantity = 5;
      _mockInventoryItem.optionalItemData = {};

      const newItemValues: object = {
        supplierName: _mockInventoryItem.supplierName,
        stockType: _mockInventoryItem.stockType,
        initialQuantity: _mockInventoryItem.initialQuantity,
        description: _mockInventoryItem.description,
        itemStyleId: _mockInventoryItem.itemStyleId,
        itemStyleName: _mockInventoryItem.itemStyleName,
        itemName: _mockInventoryItem.itemName,
        itemABV: _mockInventoryItem.itemABV,
        sourceType: _mockInventoryItem.sourceType
      };

      inventoryService.addItem(newItemValues)
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<400> Bad Request');
            done();
          }
        );

      const postReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/inventory`);
      expect(postReq.request.method).toMatch('POST');
      postReq.flush(null, mockErrorResponse(400, 'Bad Request'));
    }); // end 'should get error response formatting a new item to be added [online]' test

    test('should add a new item to the inventory list', done => {
      inventoryService.updateInventoryStorage = jest
        .fn();
      inventoryService.getInventoryList = jest
        .fn()
        .mockReturnValue(inventoryService.inventory$);

      const updateSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');

      expect(inventoryService.inventory$.value.length).toEqual(1);

      inventoryService.addItemToList(staticItem)
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toStrictEqual(staticItem);
            expect(inventoryService.inventory$.value.length).toEqual(2);
            expect(updateSpy).toHaveBeenCalled();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should add a new item to the inventory list' test

    test('should generate a new item from a given batch', done => {
      const _mockRecipe: RecipeMaster = mockRecipeMasterActive();
      const _mockStyle: Style = mockStyles()[0];

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.currentQuantity = _mockInventoryItem.initialQuantity;

      const _mockBatch: Batch = mockBatch();
      _mockBatch.contextInfo.recipeMasterName = _mockRecipe.name;
      _mockBatch.contextInfo.recipeVariantName
        = _mockRecipe.variants[0].variantName;
      _mockBatch.annotations.styleId = _mockStyle._id;
      _mockBatch.annotations.measuredValues.ABV = _mockInventoryItem.itemABV;
      _mockBatch.annotations.measuredValues.IBU
        = _mockInventoryItem.optionalItemData.itemIBU;
      _mockBatch.annotations.measuredValues.SRM
        = _mockInventoryItem.optionalItemData.itemSRM;
      _mockBatch.annotations['packagingDate'] = 'mockDate';

      const _mockAuthor: Author = {
        username: _mockInventoryItem.supplierName,
        labelImageURL: _mockInventoryItem.optionalItemData.itemLabelImageURL,
        userImageURL: _mockInventoryItem.optionalItemData.supplierLabelImageURL
      };

      const newItemValues: object = {
        supplierName: _mockInventoryItem.supplierName,
        stockType: _mockInventoryItem.stockType,
        initialQuantity: _mockInventoryItem.initialQuantity,
        description: _mockInventoryItem.description,
        itemStyleId: _mockStyle._id,
        itemStyleName: _mockStyle.name,
        itemName: _mockInventoryItem.itemName,
        itemABV: _mockInventoryItem.itemABV,
        sourceType: _mockInventoryItem.sourceType
      };

      recipeService.getPublicAuthorByRecipeId = jest
        .fn()
        .mockReturnValue(of(_mockAuthor));
      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(of(_mockRecipe));
      libraryService.getStyleById = jest
        .fn()
        .mockReturnValue(of(_mockStyle));
      inventoryService.addItem = jest
        .fn()
        .mockImplementation(
          (item: InventoryItem): Observable<InventoryItem> => {
            return of(item);
          }
        );

      inventoryService.generateItemFromBatch(_mockBatch, newItemValues)
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toStrictEqual({
              supplierName: _mockAuthor.username,
              supplierLabelImage: _mockAuthor.labelImageURL,
              stockType: newItemValues['stockType'],
              initialQuantity: newItemValues['initialQuantity'],
              currentQuantity: newItemValues['initialQuantity'],
              description: newItemValues['description'],
              itemName: _mockBatch.contextInfo.recipeMasterName,
              itemSubname: _mockBatch.contextInfo.recipeVariantName,
              itemStyleId: _mockBatch.annotations.styleId,
              itemStyleName: _mockStyle.name,
              itemABV: _mockBatch.annotations.measuredValues.ABV,
              itemIBU: _mockBatch.annotations.measuredValues.IBU,
              itemSRM: _mockBatch.annotations.measuredValues.SRM,
              itemLabelImage: _mockBatch.contextInfo.recipeImageURL,
              batchId: _mockBatch.cid,
              originalRecipeId: _mockRecipe._id,
              sourceType: 'other',
              packagingDate: 'mockDate'
            });
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should generate a new item from a given batch' test

    test('should get the inventory list', () => {
      expect(inventoryService.getInventoryList())
        .toBe(inventoryService.inventory$);
    }); // end 'should get the inventory list' test

    test('should get an item by its id', () => {
      expect(inventoryService.getItemById(staticItem.cid))
        .toStrictEqual(staticItem);

      expect(inventoryService.getItemById('none')).toBeUndefined();
    }); // end 'should get an item by its id' test

    test('should initialize the inventory [online]', done => {
      inventoryService.inventory$.next([]);

      storage.getInventory = jest
        .fn()
        .mockReturnValue(of([]));
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      inventoryService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of(true));
      inventoryService.updateInventoryStorage = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');

      inventoryService.initializeInventory();

      setTimeout(() => {
        expect(inventoryService.inventory$.value.length).toEqual(2);
        expect(updateSpy).toHaveBeenCalled();
        done();
      }, 10);

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/inventory`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush([staticItem, staticItem]);
    }); // end 'should initialize the inventory [online]' test

    test('should initialize the inventory [offline]', done => {
      inventoryService.inventory$.next([]);

      storage.getInventory = jest
        .fn()
        .mockReturnValue(of([staticItem, staticItem]));
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(false);
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);
      inventoryService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of(true));
      inventoryService.updateInventoryStorage = jest
        .fn();

      inventoryService.initializeInventory();

      setTimeout(() => {
        expect(inventoryService.inventory$.value.length).toEqual(2);
        done();
      }, 10);
    }); // end 'should initialize the inventory [offline]' test

    test('should fail to initialize the inventory due to error response', done => {
      storage.getInventory = jest
        .fn()
        .mockReturnValue(of([]));

      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      inventoryService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of(true));

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Bad Request'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryService.initializeInventory();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('Initialization error: <400> Bad Request');
        done();
      }, 10);

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/inventory`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(null, mockErrorResponse(400, 'Bad Request'));
    }); // end 'should fail to initialize the inventory due to error response' test

    test('should fail to initialize the inventory from storage', done => {
      inventoryService.inventory$.next([]);

      storage.getInventory = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Storage error'));
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(false);
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);
      inventoryService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of(true));
      inventoryService.updateInventoryStorage = jest
        .fn();

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryService.initializeInventory();

      setTimeout(() => {
        expect(inventoryService.inventory$.value.length).toEqual(0);
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('Storage error: awaiting data from server');
        done();
      }, 10);
    }); // end 'should fail to initialize the inventory from storage' test

    test('should map optional data to an inventory item', () => {
      inventoryService.getSRMColor = jest
        .fn();

      inventoryService.getRemainingColor = jest
        .fn();

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.optionalItemData = {};

      const _mockOptionalItemDataResult: OptionalItemData = mockOptionalItemData();
      _mockOptionalItemDataResult.remainingColor = undefined;
      _mockOptionalItemDataResult.srmColor = undefined;
      _mockOptionalItemDataResult.supplierLabelImageURL = 'missing';
      _mockOptionalItemDataResult.itemLabelImageURL = 'missing';

      const _mockOptionalItemDataInput: OptionalItemData = mockOptionalItemData();
      _mockOptionalItemDataInput['ignoreProp'] = '';
      _mockOptionalItemDataInput.supplierLabelImageURL = undefined;
      _mockOptionalItemDataInput.itemLabelImageURL = undefined;

      inventoryService
        .mapOptionalData(_mockInventoryItem, _mockOptionalItemDataInput);

      expect(_mockInventoryItem.optionalItemData)
        .toStrictEqual(_mockOptionalItemDataResult);
    }); // end 'should map optional data to an inventory item' test

    test('should patch an item [online]', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      inventoryService.mapOptionalData = jest
        .fn();

      inventoryService.updateInventoryStorage = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem._id = 'serverId';

      inventoryService.inventory$.next([_mockInventoryItem]);

      inventoryService.patchItem(
        _mockInventoryItem._id,
        { itemName: _mockInventoryItem.itemName }
      )
      .subscribe(
        (response: InventoryItem): void => {
          expect(response).toStrictEqual(_mockInventoryItem);
          expect(updateSpy).toHaveBeenCalled();
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

      const patchReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/inventory/${_mockInventoryItem._id}`
        );
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_mockInventoryItem);
    }); // end 'should patch an item [online]' test

    test('should patch an item [offline]', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(false);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      inventoryService.mapOptionalData = jest
        .fn();

      inventoryService.updateInventoryStorage = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');
      const addSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'addSyncFlag');

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem._id = 'serverId';

      inventoryService.inventory$.next([_mockInventoryItem]);

      inventoryService.patchItem(_mockInventoryItem._id, {})
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toStrictEqual(_mockInventoryItem);
            expect(updateSpy).toHaveBeenCalled();
            expect(addSpy).toHaveBeenCalled();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should patch an item [offline]' test

    test('should call remove item when patching an item with 0 current quantity', done => {
      inventoryService.removeItem = jest
        .fn()
        .mockReturnValue(of(staticItem));

      const removeSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'removeItem');

      inventoryService.patchItem(staticItem.cid, { currentQuantity: 0 })
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toStrictEqual(staticItem);
            expect(removeSpy).toHaveBeenCalledWith(staticItem.cid);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should call remove item when patching an item with 0 current quantity' test

    test('should fail to patch an item due to error response [online]', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      inventoryService.mapOptionalData = jest
        .fn();

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Item Not Found'));

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem._id = 'serverId';

      inventoryService.inventory$.next([_mockInventoryItem]);

      inventoryService.patchItem(_mockInventoryItem._id, {})
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> Item Not Found');
            done();
          }
        );

      const patchReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/inventory/${_mockInventoryItem._id}`
        );
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(null, mockErrorResponse(404, 'Not Found'));
    }); // end 'should fail to patch an item due to error response [online]' test

    test('should remove an item [online]', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      inventoryService.updateInventoryStorage = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem._id = 'serverId';

      inventoryService.inventory$.next([_mockInventoryItem]);

      inventoryService.removeItem(_mockInventoryItem._id)
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toBeNull();
            expect(updateSpy).toHaveBeenCalled();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const deleteReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/inventory/${_mockInventoryItem._id}`
        );
      expect(deleteReq.request.method).toMatch('DELETE');
      deleteReq.flush(_mockInventoryItem);
    }); // end 'should remove an item [online]' test

    test('should remove an item [offline]', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(false);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      inventoryService.updateInventoryStorage = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');
      const addSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'addSyncFlag');

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem._id = 'serverId';

      inventoryService.inventory$.next([_mockInventoryItem]);

      inventoryService.removeItem(_mockInventoryItem._id)
        .subscribe(
          (response: InventoryItem): void => {
            expect(response).toBeNull();
            expect(updateSpy).toHaveBeenCalled();
            expect(addSpy).toHaveBeenCalledWith('delete', 'serverId');
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should remove an item [offline]' test

    test('should fail to remove an item due to error response [online]', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Item Not Found'));

      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem._id = 'serverId';

      inventoryService.inventory$.next([_mockInventoryItem]);

      inventoryService.removeItem(_mockInventoryItem._id)
        .subscribe(
          (response: any): void => {
            console.log('Should not get an response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> Item Not Found');
            done();
          }
        );

      const deleteReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/inventory/${_mockInventoryItem._id}`
        );
      expect(deleteReq.request.method).toMatch('DELETE');
      deleteReq.flush(null, mockErrorResponse(404, 'Not Found'));
    }); // end 'should fail to remove an item due to error response [online]' test

    test('should clear the inventory', () => {
      storage.removeInventory = jest
        .fn();

      const removeSpy: jest.SpyInstance = jest.spyOn(storage, 'removeInventory');

      inventoryService.clearInventory();

      expect(inventoryService.inventory$.value.length).toEqual(0);
      expect(removeSpy).toHaveBeenCalled();
    }); // end 'should clear the inventory' test

  }); // end 'Action methods' section


  describe('Sync operations', () => {

    beforeEach(() => {
      this.syncErrors = [];
    });

    test('should add a sync flag', () => {
      sync.addSyncFlag = jest
        .fn();

      const flagSpy: jest.SpyInstance = jest.spyOn(sync, 'addSyncFlag');

      inventoryService.addSyncFlag('create', 'id');

      expect(flagSpy).toHaveBeenCalledWith({
        method: 'create',
        docId: 'id',
        docType: 'inventory'
      });
    }); // end 'should add a sync flag' test

    test('should dimiss all sync errors', () => {
      recipeService.syncErrors = ['', '', ''];

      inventoryService.dismissAllErrors();

      expect(inventoryService.syncErrors.length).toBe(0);
    }); // end 'should dimiss all sync errors' test

    test('should dimiss sync error at index', () => {
      inventoryService.syncErrors = ['1', '2', '3'];

      inventoryService.dismissError(1);

      expect(inventoryService.syncErrors.length).toBe(2);
      expect(inventoryService.syncErrors[1]).toMatch('3');
    }); // end 'should dimiss sync error at index' test

    test('should throw error with invalid index', () => {
      inventoryService.syncErrors = ['1', '2', '3'];
      expect(() => {
        inventoryService.dismissError(3);
      })
      .toThrow('Invalid sync error index');

      expect(() => {
        inventoryService.dismissError(-1);
      })
      .toThrow('Invalid sync error index');
    }); // end 'should throw error with invalid index' test

    test('should process sync success responses', done => {
      const _mockUpdateItem: InventoryItem = mockInventoryItem();
      _mockUpdateItem.itemName = 'updatedName';
      const _mockMissingItem: InventoryItem = mockInventoryItem();
      _mockMissingItem.cid = 'missing';

      inventoryService.inventory$.next([staticItem]);

      inventoryService.processSyncSuccess([
        _mockUpdateItem,
        { isDeleted: true, data: staticItem },
        _mockMissingItem
      ]);

      setTimeout(() => {
        expect(inventoryService.inventory$.value[0])
          .toStrictEqual(_mockUpdateItem);
        expect(inventoryService.syncErrors[0])
          .toMatch(`Inventory item with id: ${_mockMissingItem.cid} not found`);
        done();
      }, 10);
    }); // end 'should process sync success responses' test

    test('should handle sync requests on connection', done => {
      const _mockItemDefaultId: InventoryItem = mockInventoryItem();
      const _mockItemServerId: InventoryItem = mockInventoryItem();
      _mockItemServerId._id = 'a01234567890123456789b';
      _mockItemServerId.optionalItemData.batchId = 'c9876543210d';

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.getBatchById = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(new BehaviorSubject<Batch>(staticBatch));

      inventoryService.updateInventoryStorage = jest
        .fn();

      sync.getSyncFlagsByType = jest
        .fn()
        .mockReturnValue([
          {
            method: 'create',
            docId: 'missingItem',
            docType: 'inventory'
          },
          {
            method: 'delete',
            docId: 'deletionId',
            docType: 'inventory'
          },
          {
            method: 'update',
            docId: 'missingBatch',
            docType: 'inventory'
          },
          {
            method: 'update',
            docId: 'missingServerId',
            docType: 'inventory'
          },
          {
            method: 'create',
            docId: 'createNew',
            docType: 'inventory'
          },
          {
            method: 'update',
            docId: 'updateWithServerId',
            docType: 'inventory'
          },
          {
            method: 'unknownFlag',
            docId: 'badFlag',
            docType: 'inventory'
          }
        ]);

      inventoryService.updateInventoryStorage = jest
        .fn();

      inventoryService.getItemById = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({ isDeleted: true, data: undefined })
        .mockReturnValueOnce(_mockItemDefaultId)
        .mockReturnValueOnce(_mockItemDefaultId)
        .mockReturnValueOnce(_mockItemDefaultId)
        .mockReturnValueOnce(_mockItemServerId)
        .mockReturnValueOnce(_mockItemServerId);

      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockItemDefaultId,
            _mockItemDefaultId,
            _mockItemServerId
          ],
          errors: [
            'Sync error: Inventory item with id \'errorId\' not found',
            'Sync error: Cannot get inventory batch\'s id',
            `Inventory item with id: ${_mockItemDefaultId.cid} is missing its server id`,
            `Sync error: Unknown sync flag method 'unknownFlag'`
          ]
        }));

      sync.postSync = jest
        .fn();
      sync.patchSync = jest
        .fn();
      sync.deleteSync = jest
        .fn();

      const syncSpy: jest.SpyInstance = jest.spyOn(sync, 'sync');
      const processSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'processSyncSuccess');

      inventoryService.syncOnConnection(false)
        .subscribe(
          (): void => {
            // Order of calls is top to bottom in the source code

            // Successes should return undefined due to methods being mocks
            // Expected success indicies are 1, 4, 5
            expect(syncSpy.mock.calls[0][1][1]).toBeUndefined();
            expect(syncSpy.mock.calls[0][1][4]).toBeUndefined();
            expect(syncSpy.mock.calls[0][1][5]).toBeUndefined();

            // Errors should have an error message
            // Expected error message indicies are 0, 2, 3, 6
            expect(syncSpy.mock.calls[0][1][0].error)
              .toMatch('Sync error: Inventory item with id \'missingItem\' not found');
            expect(syncSpy.mock.calls[0][1][2].error)
              .toMatch('Sync error: Cannot get inventory batch\'s id');
            expect(syncSpy.mock.calls[0][1][3].error)
              .toMatch(`Inventory item with id: ${_mockItemDefaultId.cid} is missing its server id`);
              expect(syncSpy.mock.calls[0][1][6].error)
                .toMatch(`Sync error: Unknown sync flag method 'unknownFlag'`);

            // Process successes should get three items
            expect(processSpy.mock.calls[0][0].length).toEqual(3);

            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should handle sync requests on connection' test

    test('should not perform a sync on reconnect if not logged in', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      inventoryService.syncOnConnection(false)
        .subscribe(
          (response: boolean): void => {
            expect(response).toBe(false);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should not perform a sync on reconnect if not logged in' test

    test('should call sync on connection on reconnect', () => {
      inventoryService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of({}));

      const syncSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'syncOnConnection');

      inventoryService.syncOnReconnect();

      expect(syncSpy).toHaveBeenCalled();
    }); // end 'should call sync on connection on reconnect' test

    test('should get error response on unsuccessful sync on reconnect', done => {
      inventoryService.syncOnConnection = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Server error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryService.syncOnReconnect();

      setTimeout(() => {
        expect(consoleSpy)
          .toHaveBeenCalledWith('Server error: error on reconnect sync');
        done();
      }, 10);
    }); // end 'should get error response on unsuccessful sync on reconnect' test

    test('should handle sync on signup', () => {
      const _mockInventoryItem: InventoryItem = mockInventoryItem();
      _mockInventoryItem.optionalItemData.batchId = staticBatch._id;

      inventoryService.getInventoryList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<InventoryItem[]>([
            _mockInventoryItem,
            _mockInventoryItem,
            _mockInventoryItem
          ])
        );

      processService.getBatchById = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(new BehaviorSubject<Batch>(staticBatch))
        .mockReturnValueOnce(new BehaviorSubject<Batch>(staticBatch));

      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockInventoryItem,
            _mockInventoryItem
          ],
          errors: [
            `Batch with id ${_mockInventoryItem.optionalItemData.batchId} not found`
          ]
        }));

      inventoryService.processSyncSuccess = jest
        .fn();
      inventoryService.updateInventoryStorage = jest
        .fn();

      const syncSpy: jest.SpyInstance = jest.spyOn(sync, 'sync');
      const processSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'processSyncSuccess');
      const storeSpy: jest.SpyInstance = jest
        .spyOn(inventoryService, 'updateInventoryStorage');

      inventoryService.syncOnSignup();

      expect(syncSpy.mock.calls[0][1][0].error)
        .toMatch(`Batch with id ${_mockInventoryItem.optionalItemData.batchId} not found`)
      expect(syncSpy.mock.calls[0][1][1]).toBeUndefined();
      expect(syncSpy.mock.calls[0][1][2]).toBeUndefined();

      expect(processSpy.mock.calls[0][0].length).toEqual(2);
      expect(storeSpy).toHaveBeenCalled();
    }); // end 'should handle sync on signup' test

  }); // end 'Sync operations' section

  describe('Storage operations', () => {

    test('should update inventory storage', done => {
      storage.setInventory = jest
        .fn()
        .mockReturnValue(of({}));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryService.updateInventoryStorage();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('stored inventory');
        done();
      }, 10);
    }); // end 'should update inventory storage' test

    test('should fail to update inventory storage due to error response', done => {
      storage.setInventory = jest
        .fn()
        .mockReturnValue(new ErrorObservable('storage error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      inventoryService.updateInventoryStorage();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('inventory store error: storage error');
        done();
      }, 10);
    }); // end 'should fail to update inventory storage due to error response' test

  }); // end 'Storage operations' section


  describe('Other operations', () => {

    test('should set remaining color value', () => {
      const _mockItem: InventoryItem = mockInventoryItem();
      _mockItem.initialQuantity = 10;

      _mockItem.currentQuantity = 8;
      expect(inventoryService.getRemainingColor(_mockItem)).toMatch('#f4f4f4');

      _mockItem.currentQuantity = 5;
      expect(inventoryService.getRemainingColor(_mockItem)).toMatch('#ff9649');

      _mockItem.currentQuantity = 2;
      expect(inventoryService.getRemainingColor(_mockItem)).toMatch('#fd4855');
    }); // end 'should set remaining color value' test

    test('should set SRM color value', () => {
      const _mockItem: InventoryItem = mockInventoryItem();

      _mockItem.optionalItemData.itemSRM = 20;
      expect(inventoryService.getSRMColor(_mockItem)).toMatch(SRM_HEX_CHART[20]);

      _mockItem.optionalItemData.itemSRM = SRM_HEX_CHART.length;
      expect(inventoryService.getSRMColor(_mockItem)).toMatch('#140303');

      _mockItem.optionalItemData.itemSRM = undefined;
      expect(inventoryService.getSRMColor(_mockItem)).toMatch('#f4f4f4');
    }); // end 'should set SRM color value' test

  }); // end 'Other operations' section

});
