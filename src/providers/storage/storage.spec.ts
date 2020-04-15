/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Test configuration import */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockGrains } from '../../../test-config/mockmodels/mockGrains';
import { mockHops } from '../../../test-config/mockmodels/mockHops';
import { mockYeast } from '../../../test-config/mockmodels/mockYeast';
import { mockStyles } from '../../../test-config/mockmodels/mockStyles';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { StorageMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { User } from '../../shared/interfaces/user';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { LibraryStorage } from '../../shared/interfaces/library';

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
    const storeSpy = jest.spyOn(storageService.storage, 'set');
    const _mockBatch = mockBatch();
    storageService.setBatches([_mockBatch, _mockBatch])
      .subscribe((data: string) => {
        const parsed = JSON.parse(data);
        expect(storeSpy).toHaveBeenCalled();
        expect(parsed.length).toBe(2);
        expect(parsed[0]._id).toMatch(_mockBatch._id);
        expect(parsed[1]._id).toMatch(_mockBatch._id);
        done();
      });
  }); // end 'should store active batches' test

  test('should get stored active batches', done => {
    const _mockBatch = mockBatch();
    mockStorage.set('batch', JSON.stringify([_mockBatch]));
    storageService.getBatches()
      .subscribe((batches: Array<Batch>) => {
        expect(batches.length).toBe(1);
        expect(batches[0]).toStrictEqual(_mockBatch);
        done();
      });
  }); // end 'should get stored active batches' test

  test('should get key not found error with no batches in storage', done => {
    storageService.getBatches()
      .subscribe(
        (response: any) => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable) => {
          expect(error.error).toMatch('Active batch storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no batches in storage' test

  test('should get no data error with empty batches array in storage', done => {
    mockStorage.set('batch', JSON.stringify([]));
    storageService.getBatches()
      .subscribe(
        (response: any) => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable) => {
          expect(error.error).toMatch('No active batch data in storage');
          done();
        }
      );
  }); // end 'should get no data error with empty batches array in storage' test

  test('should get data not found error if active batches is null in storage', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getBatches()
      .subscribe(
        response => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        error => {
          expect(error.error).toMatch('Active batch data not found');
          done();
        }
      );
  }); // end 'should get data not found error if active batches is null in storage' test

  test('should remove all stored active batches', done => {
    mockStorage.set('batch', [mockBatch()]);
    const removeSpy = jest.spyOn(storageService.storage, 'remove');
    storageService.removeBatches();
    expect(removeSpy).toHaveBeenCalled();
    setTimeout(() => {
      mockStorage.get('batch')
        .then(response => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        })
        .catch(error => {
          expect(error).toMatch('Key not found');
          done();
        })
    }, 10);
  }); // end 'should remove all stored active batches' test

  test('should store ingredient libraries', done => {
    const storeSpy = jest.spyOn(storageService.storage, 'set');
    const _mockGrains = mockGrains();
    const _mockHops = mockHops();
    const _mockYeast = mockYeast();
    const _mockStyles = mockStyles();

    storageService.setLibrary({
      grains: _mockGrains,
      hops: _mockHops,
      yeast: _mockYeast,
      style: _mockStyles
    }).subscribe((data: any) => {
      const parsed = JSON.parse(data);
      expect(storeSpy).toHaveBeenCalled();
      expect(parsed.grains.length).toBe(_mockGrains.length);
      expect(parsed.hops.length).toBe(_mockHops.length);
      expect(parsed.yeast.length).toBe(_mockYeast.length);
      expect(parsed.style.length).toBe(_mockStyles.length);
      done();
    });
  }); // end 'should store ingredient libraries' test

  test('should get stored list of libraries', done => {
    const _mockGrains = mockGrains();
    const _mockHops = mockHops();
    const _mockYeast = mockYeast();
    const _mockStyles = mockStyles();

    mockStorage.set('library', JSON.stringify({
      grains: _mockGrains,
      hops: _mockHops,
      yeast: _mockYeast,
      style: _mockStyles
    }));

    storageService.getLibrary()
      .subscribe((library: LibraryStorage) => {
        expect(library.grains).toStrictEqual(_mockGrains);
        expect(library.hops).toStrictEqual(_mockHops);
        expect(library.yeast).toStrictEqual(_mockYeast);
        expect(library.style).toStrictEqual(_mockStyles);
        done();
      });
  }); // end 'should get stored list of libraries' test

  test('should get not found error with no library in storage', done => {
    storageService.getLibrary()
      .subscribe(
        (response: any) => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable) => {
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
        response => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        error => {
          expect(error.error).toMatch('Library data not found');
          done();
        }
      );
  }); // end 'should get data not found error if library is null in stored' test

  test('should get no data error with empty library in storage', done => {
    mockStorage.set('library', JSON.stringify({}));
    storageService.getLibrary()
      .subscribe(
        (response: any) => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable) => {
          expect(error.error).toMatch('No library data in storage');
          done();
        }
      );
  }); // end 'should get no data error with empty library in storage' test

  test('should store a list of recipe masters', done => {
    const storeSpy = jest.spyOn(storageService.storage, 'set');
    const _mockRecipeMasterActive = mockRecipeMasterActive();
    const _mockRecipeMasterInactive = mockRecipeMasterInactive();
    storageService.setRecipes([_mockRecipeMasterActive, _mockRecipeMasterInactive])
      .subscribe((data: string) => {
        const parsed = JSON.parse(data);
        expect(storeSpy).toHaveBeenCalled();
        expect(parsed.length).toBe(2);
        expect(parsed[0]._id).toMatch(_mockRecipeMasterActive._id);
        expect(parsed[1]._id).toMatch(_mockRecipeMasterInactive._id);
        done();
      });
  }); // end 'should store a list of recipe masters' test

  test('should get stored list of recipe masters', done => {
    const _mockRecipeMasterActive = mockRecipeMasterActive();
    const _mockRecipeMasterInactive = mockRecipeMasterInactive();
    mockStorage.set('recipe', JSON.stringify([_mockRecipeMasterActive, _mockRecipeMasterInactive]));
    storageService.getRecipes()
      .subscribe((recipeMasterList: Array<RecipeMaster>) => {
        expect(recipeMasterList.length).toBe(2);
        expect(recipeMasterList[0]).toStrictEqual(_mockRecipeMasterActive);
        expect(recipeMasterList[1]).toStrictEqual(_mockRecipeMasterInactive);
        done();
      });
  }); // end 'should get stored list of recipe masters' test

  test('should get not found error with no recipe masters in storage', done => {
    storageService.getRecipes()
      .subscribe(
        (response: any) => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable) => {
          expect(error.error).toMatch('Recipe storage error: Key not found');
          done();
        }
      );
  }); // end 'should get not found error with no recipe masters in storage' test

  test('should get no data error with empty recipe masters array in storage', done => {
    mockStorage.set('recipe', JSON.stringify([]));
    storageService.getRecipes()
      .subscribe(
        (response: any) => {
          console.log('Should not have a response', response);
          expect(true).toBe(false);
        },
        (error: ErrorObservable) => {
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
        response => {
          console.log('Should not have a reponse', response);
          expect(true).toBe(false);
        },
        error => {
          expect(error.error).toMatch('Recipe data not found');
          done();
        }
      );
  });

  test('should remove all stored recipe masters', done => {
    mockStorage.set('recipe', [mockRecipeMasterActive()]);
    const removeSpy = jest.spyOn(storageService.storage, 'remove');
    storageService.removeRecipes();
    expect(removeSpy).toHaveBeenCalled();
    setTimeout(() => {
      mockStorage.get('recipe')
        .then(response => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        })
        .catch(error => {
          expect(error).toMatch('Key not found');
          done();
        })
    }, 10);
  }); // end 'should remove all stored recipe masters' test

  test('should store a user', done => {
    const _mockUser = mockUser();
    const storeSpy = jest.spyOn(storageService.storage, 'set');
    storageService.setUser(_mockUser)
      .subscribe((data: string) => {
        expect(storeSpy).toHaveBeenCalled();
        expect(_mockUser._id).toMatch(JSON.parse(data)._id)
        done();
      });
  });

  test('should get stored user', done => {
    const _mockUser = mockUser();
    mockStorage.set('user', JSON.stringify(_mockUser));
    storageService.getUser()
      .subscribe(
        (user: User) => {
          expect(user).toBeDefined();
          expect(_mockUser._id).toMatch(user._id);
          done();
        });
  }); // end 'should get stored user' test

  test('should create an offline user', done => {
    storageService.getUser()
      .subscribe((user: any) => {
        expect(user).toBeDefined();
        expect(user._id).toMatch('offline');
        done();
      });
  }); // end 'should create an offline user' test

  test('should create an offline user if null is stored', done => {
    storageService.storage.get = jest
      .fn()
      .mockReturnValue(Promise.resolve(null));

    storageService.getUser()
      .subscribe((user: any) => {
        expect(user).toBeDefined();
        expect(user._id).toMatch('offline');
        done();
      });
  }); // end 'should create an offline user if null is stored' test

  test('should remove stored user', () => {
    const removeSpy = jest.spyOn(storageService.storage, 'remove');
    mockStorage.set('user', mockUser());
    storageService.removeUser();
    expect(removeSpy).toHaveBeenCalled();
  }); // end 'should remove stored user' test

});
