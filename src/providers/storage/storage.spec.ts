/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicStorageModule } from '@ionic/storage';

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
import { mockProcessSchedule } from '../../../test-config/mockmodels/mockProcessSchedule';
import { StorageMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { User } from '../../shared/interfaces/user';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { LibraryCache } from '../../shared/interfaces/library';

/* Provider imports */
import { StorageProvider } from './storage';


describe('Storage Service', () => {
  let injector: TestBed;
  let storageService: StorageProvider;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      imports: [
        IonicStorageModule.forRoot()
      ],
      providers: [
        StorageProvider,
        { provide: Storage, useClass: StorageMock }
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    storageService = injector.get(StorageProvider);
  });

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
    }).subscribe((data: string) => {
      const parsed = JSON.parse(data);
      expect(storeSpy).toHaveBeenCalled();
      expect(parsed.grains.length).toBe(_mockGrains.length);
      expect(parsed.hops.length).toBe(_mockHops.length);
      expect(parsed.yeast.length).toBe(_mockYeast.length);
      expect(parsed.style.length).toBe(_mockStyles.length);
      done();
    });
  });

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
  });

  test('should get stored list of recipe masters', done => {
    const _mockRecipeMasterActive = mockRecipeMasterActive();
    const _mockRecipeMasterInactive = mockRecipeMasterInactive();
    const _mockStorage = new StorageMock();
    _mockStorage.set('recipes', [_mockRecipeMasterActive, _mockRecipeMasterInactive]);
    storageService.getRecipes()
      .subscribe((recipeMasterList: Array<RecipeMaster>) => {
        expect(recipeMasterList.length).toBe(2);
        expect(recipeMasterList[0]).toStrictEqual(_mockRecipeMasterActive);
        expect(recipeMasterList[1]).toStrictEqual(_mockRecipeMasterInactive);
        done();
      });
  });

  test('should remove all stored recipe masters', () => {
    const _mockStorage = new StorageMock();
    _mockStorage.set('recipes', [mockRecipeMasterActive()]);
    const removeSpy = jest.spyOn(storageService.storage, 'remove');
    storageService.removeRecipes();
    expect(removeSpy).toHaveBeenCalled();
  });

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
    const _mockStorage = new StorageMock();
    _mockStorage.set('user', _mockUser);
    storageService.getUser()
      .subscribe((user: User) => {
        expect(user).toBeDefined();
        expect(_mockUser._id).toMatch(user._id);
        done();
      });
  });

  test('should remove stored user', () => {
    const _mockStorage = new StorageMock();
    const removeSpy = jest.spyOn(storageService.storage, 'remove');
    _mockStorage.set('user', mockUser());
    storageService.removeUser();
    expect(removeSpy).toHaveBeenCalled();
  });

});
