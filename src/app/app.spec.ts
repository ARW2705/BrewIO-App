/* Module imports */
import { async, getTestBed, TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, Platform } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';

/* Test configuration imports */
import { configureTestBed } from '../../test-config/configureTestBed';

/* Mock imports */
import { NetworkMock, PlatformMockDev, StatusBarMock, SplashScreenMock, StorageMock } from '../../test-config/mocks-ionic';

/* Component imports */
import { MyApp } from './app.component';

/* Provider imports */
import { LibraryProvider } from '../providers/library/library';
import { UserProvider } from '../providers/user/user';
import { ProcessProvider } from '../providers/process/process';
import { RecipeProvider } from '../providers/recipe/recipe';
import { ProcessHttpErrorProvider } from '../providers/process-http-error/process-http-error';
import { StorageProvider } from '../providers/storage/storage';
import { ConnectionProvider } from '../providers/connection/connection';
import { PreferencesProvider } from '../providers/preferences/preferences';


describe('MyApp Component', () => {
  let fixture: ComponentFixture<MyApp>;
  let appComponent: MyApp;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [ MyApp ],
      imports: [
        IonicModule.forRoot(MyApp),
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        {
          provide: LibraryProvider,
          useValue: {
            fetchAllLibraries: function() {}
          }
        },
        {
          provide: UserProvider,
          useValue: {
            loadUserFromStorage: function() {}
          }
        },
        { provide: StorageProvider, useValue: {} },
        { provide: Network, useClass: NetworkMock },
        { provide: ConnectionProvider, useValue: {} },
        { provide: PreferencesProvider, useValue: {} },
        { provide: ProcessProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: StatusBar, useClass: StatusBarMock },
        { provide: SplashScreen, useClass: SplashScreenMock },
        { provide: Platform, useClass: PlatformMockDev },
        { provide: Storage, useClass: StorageMock }
      ]
    });
    await TestBed.compileComponents();
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyApp);
    appComponent = fixture.componentInstance;
  });

  test('should create MyApp component', () => {
    fixture.detectChanges();

    expect(appComponent).toBeDefined();
    expect(appComponent instanceof MyApp).toBe(true);
  }); // end 'should create MyApp component' test

  test('should initialize app', done => {
    fixture.detectChanges();

    const statusBarSpy: jest.SpyInstance = jest
      .spyOn(appComponent.statusBar, 'styleDefault');
    const splashScreenSpy: jest.SpyInstance = jest
      .spyOn(appComponent.splashScreen, 'hide');

    appComponent.initializeApp();

    setTimeout(() => {
      expect(statusBarSpy).toHaveBeenCalled();
      expect(splashScreenSpy).toHaveBeenCalled();
      done();
    }, 10);
  }); // end 'should initialize app' test

});
