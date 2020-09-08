/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Test configuration import */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockGrains } from '../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../test-config/mockmodels/mockHops';
import { mockInventoryItem } from '../../../test-config/mockmodels/mockInventoryItem';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockStyles } from '../../../test-config/mockmodels/mockStyles';
import { mockSyncMetadata } from '../../../test-config/mockmodels/mockSyncMetadata';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockYeast } from '../../../test-config/mockmodels/mockYeast';
import { StorageMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { Grains } from '../../shared/interfaces/library';
import { Hops } from '../../shared/interfaces/library';
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { LibraryStorage } from '../../shared/interfaces/library';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Style } from '../../shared/interfaces/library';
import { SyncMetadata } from '../../shared/interfaces/sync';
import { User } from '../../shared/interfaces/user';
import { Yeast } from '../../shared/interfaces/library';

/* Provider imports */
import { StorageProvider } from './storage';


describe('Storage Service', () => {
  let injector: TestBed;
  let storageService: StorageProvider;
  let mockStorage: Storage;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [ ],
      providers: [
        StorageProvider,
        { provide: Storage, useClass: StorageMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    storageService = injector.get(StorageProvider);
    mockStorage = injector.get(Storage);
  });

  afterEach(() => {
    mockStorage.clear();
  });

  test('should store active batches', done => {
    const storeSpy: jest.SpyInstance = jest.spyOn(storageService.storage, 'set');

    const _mockBatch: Batch = mockBatch();

    storageService.setBatches(true, [_mockBatch, _mockBatch])
      .subscribe(
        (data: string): void => {
          const parsed: Batch[] = JSON.parse(data);
          expect(storeSpy).toHaveBeenCalled();
          expect(parsed.length).toBe(2);
          expect(parsed[0]._id).toMatch(_mockBatch._id);
          expect(parsed[1]._id).toMatch(_mockBatch._id);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should store active batches' test

  test('should get stored active batches', done => {
    const _mockBatch: Batch = mockBatch();

    mockStorage.set('active', JSON.stringify([_mockBatch]));

    storageService.getBatches(true)
      .subscribe(
        (batches: Batch[]): void => {
          expect(batches.length).toBe(1);
          expect(batches[0]).toStrictEqual(_mockBatch);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should get stored active batches' test

  test('should get key not found error with no batches in storage', done => {
    storageService.getBatches(true)
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error)
            .toMatch('Active batch storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no batches in storage' test

  test('should get no data error with empty batches array in storage', done => {
    mockStorage.set('active', JSON.stringify([]));

    storageService.getBatches(true)
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('No active batch data in storage');
          done();
        }
      );
  }); // end 'should get no data error with empty batches array in storage' test

  test('should get data not found error if active batches is null in storage', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getBatches(true)
      .subscribe(
        (response: any): void => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Active batch data not found');
          done();
        }
      );
  }); // end 'should get data not found error if active batches is null in storage' test

  test('should remove all stored active batches', done => {
    mockStorage.set('active', [mockBatch()]);

    const removeSpy: jest.SpyInstance = jest
      .spyOn(storageService.storage, 'remove');

    storageService.removeBatches(true);

    expect(removeSpy).toHaveBeenCalled();

    setTimeout(() => {
      mockStorage.get('active')
        .then((response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        })
        .catch((error: string): void => {
          expect(error).toMatch('Key not found');
          done();
        })
    }, 10);
  }); // end 'should remove all stored active batches' test

  test('should store inventory', done => {
    const storeSpy: jest.SpyInstance = jest.spyOn(storageService.storage, 'set');

    const _mockInventoryItem: InventoryItem = mockInventoryItem();

    storageService.setInventory([_mockInventoryItem, _mockInventoryItem])
      .subscribe(
        (data: string): void => {
          const parsed: InventoryItem[] = JSON.parse(data);
          expect(storeSpy).toHaveBeenCalled();
          expect(parsed.length).toBe(2);
          expect(parsed[0].cid).toMatch(_mockInventoryItem.cid);
          expect(parsed[1].cid).toMatch(_mockInventoryItem.cid);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should store inventory' test

  test('should get stored inventory', done => {
    const _mockInventoryItem: InventoryItem = mockInventoryItem();

    mockStorage.set('inventory', JSON.stringify([_mockInventoryItem]));

    storageService.getInventory()
      .subscribe(
        (items: InventoryItem[]): void => {
          expect(items.length).toBe(1);
          expect(items[0]).toStrictEqual(_mockInventoryItem);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should get stored inventory' test

  test('should get key not found error with no inventory items in storage', done => {
    storageService.getInventory()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Inventory storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no inventory items in storage' test

  test('should get no data error with empty inventory array in storage', done => {
    mockStorage.set('inventory', JSON.stringify([]));

    storageService.getInventory()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('No inventory data in storage');
          done();
        }
      );
  }); // end 'should get no data error with empty inventory array in storage' test


  test('should get data not found error if inventory is null in storage', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getInventory()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Inventory data not found');
          done();
        }
      );
  }); // end 'should get data not found error if inventory is null in storage' test


  test('should remove all stored inventory items', done => {
    mockStorage.set('inventory', [mockInventoryItem()]);

    const removeSpy: jest.SpyInstance = jest
      .spyOn(storageService.storage, 'remove');

    storageService.removeInventory();

    expect(removeSpy).toHaveBeenCalled();

    setTimeout(() => {
      mockStorage.get('inventory')
        .then((response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        })
        .catch((error: string): void => {
          expect(error).toMatch('Key not found');
          done();
        });
    }, 10);
  }); // end 'should remove all stored inventory items' test

  test('should store ingredient libraries', done => {
    const storeSpy: jest.SpyInstance = jest.spyOn(storageService.storage, 'set');
    const _mockGrains: Grains[] = mockGrains();
    const _mockHops: Hops[] = mockHops();
    const _mockYeast: Yeast[] = mockYeast();
    const _mockStyles: Style[] = mockStyles();

    storageService.setLibrary({
      grains: _mockGrains,
      hops: _mockHops,
      yeast: _mockYeast,
      style: _mockStyles
    }).subscribe(
      (data: string): void => {
        const parsed = JSON.parse(data);
        expect(storeSpy).toHaveBeenCalled();
        expect(parsed.grains.length).toBe(_mockGrains.length);
        expect(parsed.hops.length).toBe(_mockHops.length);
        expect(parsed.yeast.length).toBe(_mockYeast.length);
        expect(parsed.style.length).toBe(_mockStyles.length);
        done();
      },
      (error: any): void => {
        console.log('Should not get an error', error);
        expect(true).toBe(false);
      }
    );
  }); // end 'should store ingredient libraries' test

  test('should get stored list of libraries', done => {
    const _mockGrains: Grains[] = mockGrains();
    const _mockHops: Hops[] = mockHops();
    const _mockYeast: Yeast[] = mockYeast();
    const _mockStyles: Style[] = mockStyles();

    mockStorage.set(
      'library',
      JSON.stringify(
        {
          grains: _mockGrains,
          hops: _mockHops,
          yeast: _mockYeast,
          style: _mockStyles
        }
      )
    );

    storageService.getLibrary()
      .subscribe(
        (library: LibraryStorage): void => {
          expect(library.grains).toStrictEqual(_mockGrains);
          expect(library.hops).toStrictEqual(_mockHops);
          expect(library.yeast).toStrictEqual(_mockYeast);
          expect(library.style).toStrictEqual(_mockStyles);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should get stored list of libraries' test

  test('should get not found error with no library in storage', done => {
    storageService.getLibrary()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Library storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no library in storage' test

  test('should get data not found error if library is null in stored', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getLibrary()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Library data not found');
          done();
        }
      );
  }); // end 'should get data not found error if library is null in stored' test

  test('should get no data error with empty library in storage', done => {
    mockStorage.set('library', JSON.stringify({}));

    storageService.getLibrary()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('No library data in storage');
          done();
        }
      );
  }); // end 'should get no data error with empty library in storage' test

  test('should store a list of recipe masters', done => {
    const storeSpy: jest.SpyInstance = jest.spyOn(storageService.storage, 'set');

    const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
    const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

    storageService
      .setRecipes([_mockRecipeMasterActive, _mockRecipeMasterInactive])
      .subscribe(
        (data: string): void => {
          const parsed: RecipeMaster[] = JSON.parse(data);
          expect(storeSpy).toHaveBeenCalled();
          expect(parsed.length).toBe(2);
          expect(parsed[0]._id).toMatch(_mockRecipeMasterActive._id);
          expect(parsed[1]._id).toMatch(_mockRecipeMasterInactive._id);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should store a list of recipe masters' test

  test('should get stored list of recipe masters', done => {
    const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
    const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

    mockStorage.set(
      'recipe',
      JSON.stringify([_mockRecipeMasterActive, _mockRecipeMasterInactive])
    );

    storageService.getRecipes()
      .subscribe(
        (recipeMasterList: RecipeMaster[]): void => {
          expect(recipeMasterList.length).toBe(2);
          expect(recipeMasterList[0]).toStrictEqual(_mockRecipeMasterActive);
          expect(recipeMasterList[1]).toStrictEqual(_mockRecipeMasterInactive);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should get stored list of recipe masters' test

  test('should get not found error with no recipe masters in storage', done => {
    storageService.getRecipes()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Recipe storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no recipe masters in storage' test

  test('should get no data error with empty recipe masters array in storage', done => {
    mockStorage.set('recipe', JSON.stringify([]));

    storageService.getRecipes()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('No recipe data in storage');
          done();
        }
      );
  }); // end 'should get no data error with empty recipe masters array in storage' test

  test('should get data not found error if null is stored', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getRecipes()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Recipe data not found');
          done();
        }
      );
  });

  test('should remove all stored recipe masters', done => {
    mockStorage.set('recipe', [mockRecipeMasterActive()]);

    const removeSpy: jest.SpyInstance = jest
      .spyOn(storageService.storage, 'remove');

    storageService.removeRecipes();

    expect(removeSpy).toHaveBeenCalled();

    setTimeout(() => {
      mockStorage.get('recipe')
        .then((response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        })
        .catch((error: string): void => {
          expect(error).toMatch('Key not found');
          done();
        })
    }, 10);
  }); // end 'should remove all stored recipe masters' test

  test('should get stored sync flags', done => {
    mockStorage.set(
      'sync',
      JSON.stringify([
        mockSyncMetadata('create', '1', 'recipe'),
        mockSyncMetadata('delete', '2', 'batch')
      ])
    );

    storageService.getSyncFlags()
      .subscribe(
        (syncFlagList: SyncMetadata[]): void => {
          expect(syncFlagList.length).toBe(2);
          expect(syncFlagList[0].docId).toMatch('1');
          expect(syncFlagList[1].docType).toMatch('batch');
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should get stored sync flags' test

  test('should get not found error with no flags in storage', done => {
    storageService.getSyncFlags()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Sync flag storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no flags in storage' test

  test('should get data not found error with empty flags array in storage', done => {
    mockStorage.set('sync', JSON.stringify([]));

    storageService.getSyncFlags()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('No flags in storage');
          done();
        }
      );
  }); // end 'should get data not found error with empty flags array in storage' test

  test('should get data not found error if null is stored', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getSyncFlags()
      .subscribe(
        (response: any): void => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable): void => {
          expect(error.error).toMatch('Flags not found');
          done();
        }
      );
  }); // end 'should get data not found error if null is stored' test

  test('should remove all stored sync flags', done => {
    mockStorage.set('sync', [mockSyncMetadata('create', 'docId', 'docType')]);

    const removeSpy: jest.SpyInstance = jest
      .spyOn(storageService.storage, 'remove');

    storageService.removeSyncFlags();

    expect(removeSpy).toHaveBeenCalled();

    setTimeout(() => {
      mockStorage.get('sync')
        .then((response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        })
        .catch((error: string): void => {
          expect(error).toMatch('Key not found');
          done();
        })
    }, 10);
  }); // end 'should remove all stored sync flags' test

  test('should store a list of sync flags', done => {
    const storeSpy: jest.SpyInstance = jest.spyOn(storageService.storage, 'set');

    storageService.setSyncFlags([
      mockSyncMetadata('create', 'dId', 'dType'),
      mockSyncMetadata('update', 'otherId', 'otherType')
    ])
    .subscribe(
      (data: string): void => {
        const parsed = JSON.parse(data);
        expect(storeSpy).toHaveBeenCalled();
        expect(parsed.length).toBe(2);
        expect(parsed[0].docType).toMatch('dType');
        expect(parsed[1].docId).toMatch('otherId');
        done();
      },
      (error: any): void => {
        console.log('Should not get an error', error);
        expect(true).toBe(false);
      }
    );
  }); // end 'should store a list of sync flags' test

  test('should store a user', done => {
    const _mockUser: User = mockUser();

    const storeSpy: jest.SpyInstance = jest.spyOn(storageService.storage, 'set');

    storageService.setUser(_mockUser)
      .subscribe(
        (data: string): void => {
          expect(storeSpy).toHaveBeenCalled();
          expect(_mockUser._id).toMatch(JSON.parse(data)._id)
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should store a user' test

  test('should get stored user', done => {
    const _mockUser: User = mockUser();

    mockStorage.set('user', JSON.stringify(_mockUser));

    storageService.getUser()
      .subscribe(
        (user: User): void => {
          expect(user).toBeDefined();
          expect(_mockUser._id).toMatch(user._id);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should get stored user' test

  test('should create an offline user', done => {
    storageService.getUser()
      .subscribe(
        (user: User): void => {
          expect(user).toBeDefined();
          expect(user.cid).toMatch('offline');
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should create an offline user' test

  test('should create an offline user if null is stored', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getUser()
      .subscribe(
        (user: User): void => {
          expect(user).toBeDefined();
          expect(user.cid).toMatch('offline');
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should create an offline user if null is stored' test

  test('should remove stored user', () => {
    const removeSpy: jest.SpyInstance = jest
      .spyOn(storageService.storage, 'remove');

    mockStorage.set('user', mockUser());

    storageService.removeUser();
    
    expect(removeSpy).toHaveBeenCalled();
  }); // end 'should remove stored user' test

});
