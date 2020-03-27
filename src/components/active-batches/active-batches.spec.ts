/* Module imports */
import { TestBed, getTestBed, async, ComponentFixture } from '@angular/core/testing';
import { IonicModule, NavController, ToastController, Form, DomController, Events, App, Config, GestureController, Platform, ItemSliding } from 'ionic-angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Storage } from '@ionic/storage';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { NavMock, StorageMock, SortPipeMock, ToastControllerMock, AppMock, ConfigMock, PlatformMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';

/* Component imports */
import { ActiveBatchesComponent } from './active-batches';

/* Page imports */
import { ProcessPage } from '../../pages/process/process';

/* Providers imports */
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';
import { UserProvider } from '../../providers/user/user';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';
import { StorageProvider } from '../../providers/storage/storage';
import { ConnectionProvider } from '../../providers/connection/connection';


describe('Active Batch Component', () => {

  describe('Does not have an active batch', () => {
    let fixture: ComponentFixture<ActiveBatchesComponent>
    let activeBatches: ActiveBatchesComponent;
    let injector: TestBed;
    let processService: ProcessProvider;
    let userService: UserProvider;
    configureTestBed();

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ActiveBatchesComponent
        ],
        imports: [
          IonicModule,
          HttpClientTestingModule
        ],
        providers: [
          ProcessProvider,
          UserProvider,
          RecipeProvider,
          ToastProvider,
          Events,
          Network,
          ConnectionProvider,
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: NavController, useClass: NavMock },
          { provide: Storage, useClass: StorageMock },
          { provide: StorageProvider, useValue: {} },
          { provide: ToastController, useClass: ToastControllerMock }
        ]
      });
      await TestBed.compileComponents();
    })()
    .then(done)
    .catch(done.fail));

    beforeEach(async(() => {
      injector = getTestBed();
      processService = injector.get(ProcessProvider);
      processService.activeBatchList$.next([]);
      userService = injector.get(UserProvider);
      userService.user$.next({
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        username: undefined,
        firstname: undefined,
        lastname: undefined,
        email: undefined,
        friendList: [],
        token: undefined
      })
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ActiveBatchesComponent);
      activeBatches = fixture.componentInstance;
    });

    test('should create the component', () => {
      fixture.detectChanges();
      expect(activeBatches).toBeDefined();
    }); // end 'should create the component' test

    test('should not be logged in', () => {
      fixture.detectChanges();
      expect(activeBatches.isLoggedIn()).toBe(false);
    }); // end 'should not be logged in' test

    test('should display login message when not logged in', () => {
      fixture.detectChanges();
      const row = fixture.debugElement.query(By.css('.no-active-message'));
      expect(row.nativeElement.innerHTML).toMatch('Must be logged in to view active batches');
    }); // end 'should display login message when not logged in' test

    test('should display no active batches when logged in', () => {
      userService.user$.next(mockUser());
      fixture.detectChanges();
      const row = fixture.debugElement.query(By.css('.no-active-message'));
      expect(row.nativeElement.innerHTML).toMatch('No Active Batches');
    }); // end 'should display no active batches when logged in' test

  }); // end 'Does not have an active batch' section


  describe('Has an active batch', () => {
    let fixture: ComponentFixture<ActiveBatchesComponent>
    let activeBatches: ActiveBatchesComponent;
    let injector: TestBed;
    let processService: ProcessProvider;
    let userService: UserProvider;
    let recipeService: RecipeProvider;
    let eventService: Events;
    configureTestBed();

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ActiveBatchesComponent,
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule,
          HttpClientTestingModule
        ],
        providers: [
          ProcessProvider,
          UserProvider,
          RecipeProvider,
          ToastProvider,
          Events,
          GestureController,
          ItemSliding,
          DomController,
          Form,
          Network,
          ConnectionProvider,
          { provide: ProcessHttpErrorProvider, useValue: {} },
          { provide: NavController, useClass: NavMock },
          { provide: Storage, useClass: StorageMock },
          { provide: StorageProvider, useValue: {} },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: Config, useClass: ConfigMock },
          { provide: Platform, useClass: PlatformMock },
          { provide: App, useClass: AppMock }
        ],
        schemas: [
          NO_ERRORS_SCHEMA
        ]
      });
      await TestBed.compileComponents();
    })()
    .then(done)
    .catch(done.fail));

    beforeEach(async(() => {
      injector = getTestBed();
      processService = injector.get(ProcessProvider);
      processService.activeBatchList$.next([new BehaviorSubject<Batch>(mockBatch())]);
      userService = injector.get(UserProvider);
      userService.user$.next(mockUser());
      recipeService = injector.get(RecipeProvider);
      recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())]);
      eventService = injector.get(Events);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ActiveBatchesComponent);
      activeBatches = fixture.componentInstance;
    });

    test('should be logged in', () => {
      fixture.detectChanges();
      expect(activeBatches.isLoggedIn()).toBe(true);
    }); // end 'should be logged in' test

    test('should get the current batch step name', () => {
      fixture.detectChanges();
      expect(activeBatches.getBatchCurrentStep(mockBatch())).toMatch('Mash out / Heat to boil');
    }); // end 'should get the current batch step name' test

    test('should get the start datetime of a batch', () => {
      fixture.detectChanges();
      expect(activeBatches.getBatchStartDate(mockBatch())).toMatch('2020-01-01T12:00:00.000Z');
    }); // end 'should get the start datetime of a batch' test

    test('should get the recipe master that a batch belongs to', () => {
      fixture.detectChanges();
      const master = activeBatches.getMasterByBatch(mockBatch());
      expect(master._id).toMatch(mockRecipeMasterActive()._id);
    }); // end 'should get the recipe master that a batch belongs to' test

    test('should get the recipe master name that a batch belongs to', () => {
      fixture.detectChanges();
      const masterName = activeBatches.getRecipeMasterName(mockBatch());
      expect(masterName).toMatch(mockRecipeMasterActive().name);
    }); // end 'should get the recipe master name that a batch belongs to' test

    test('should fail to get a recipe master name when master is missing', () => {
      const _mockBatch = mockBatch();
      _mockBatch.recipe = 'no-recipe';
      fixture.detectChanges();
      const recipeMasterName = activeBatches.getRecipeMasterName(_mockBatch);
      expect(recipeMasterName).toMatch('');
    }); // end 'should fail to get a recipe master name when master is missing' test

    test('should get the recipe variant name that a batch belongs to', () => {
      fixture.detectChanges();
      const variantName = activeBatches.getRecipeName(mockBatch());
      expect(variantName).toMatch(mockRecipeComplete().variantName);
    }); // end 'should get the recipe variant name that a batch belongs to' test

    test('should fail to get a recipe variant name when recipe is missing', () => {
      const _mockBatch = mockBatch();
      _mockBatch.recipe = 'no-recipe';
      fixture.detectChanges();
      const recipeVariantName = activeBatches.getRecipeName(_mockBatch);
      expect(recipeVariantName).toMatch('');
    }); // end 'should fail to get a recipe variant name when recipe is missing' test

    test('should close all sliding items', () => {
      fixture.detectChanges();
      const sliderSpies = activeBatches.slidingItems.map(slidingItem => {
        return jest.spyOn(slidingItem, 'close');
      });
      activeBatches.updateHeaderNavEventHandler();
      sliderSpies.forEach(sliderSpy => {
        expect(sliderSpy).toHaveBeenCalled();
      });
    }); // end 'should close all sliding items' test

    test('should navigate to the active process', () => {
      fixture.detectChanges();
      const _mockBatch = mockBatch();
      const navSpy = jest.spyOn(activeBatches.navCtrl, 'push');
      eventService.subscribe('update-nav-header', data => {
        expect(data.dest).toMatch('process');
        expect(data.destType).toMatch('page');
        expect(data.destTitle).toMatch(mockRecipeComplete().variantName);
        expect(data.origin).toMatch('');
      });
      activeBatches.navToBrewProcess(_mockBatch);
      const navOptions = navSpy.mock.calls[0][1];
      const _mockRecipeMaster = mockRecipeMasterActive();
      expect(navSpy.mock.calls[0][0]).toBe(ProcessPage);
      expect(navOptions.master).toStrictEqual(_mockRecipeMaster);
      expect(navOptions.requestedUserId).toMatch(_mockRecipeMaster.owner);
      expect(navOptions.selectedRecipeId).toMatch(_mockRecipeMaster.master);
      expect(navOptions.selectedBatchId).toMatch(_mockBatch._id);
    }); // end 'should navigate to the active process' test

    test('should display error when trying to navigate to a process with an undefined recipe master', () => {
      fixture.detectChanges();
      activeBatches.masterList = [];
      const toastSpy = jest.spyOn(activeBatches.toastService, 'presentToast');
      activeBatches.navToBrewProcess(mockBatch());
      expect(toastSpy).toHaveBeenCalledWith('Error finding associated Recipe');
    }); // end 'should display error when trying to navigate to a process with an undefined recipe master' test

    test('should display an active batch', () => {
      fixture.detectChanges();
      const slidingItems = fixture.debugElement.query(By.css('.sliding-item'));
      expect(slidingItems).toBeDefined();
    }); // end 'should display an active batch' test

  }); // end 'Has an active batch' test

});
