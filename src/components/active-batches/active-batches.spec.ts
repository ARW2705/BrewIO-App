/* Module imports */
import { TestBed, getTestBed, async, ComponentFixture } from '@angular/core/testing';
import { IonicModule, NavController, Form, DomController, Events, Config, GestureController, Platform } from 'ionic-angular';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { NavMock, EventsMock, ConfigMock, DomMock, GestureMock, FormMock, PlatformMockDev } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

/* Component imports */
import { ActiveBatchesComponent } from './active-batches';

/* Page imports */
import { ProcessPage } from '../../pages/process/process';

/* Providers imports */
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { ToastProvider } from '../../providers/toast/toast';
import { UserProvider } from '../../providers/user/user';


describe('Active Batch Component', () => {
  let fixture: ComponentFixture<ActiveBatchesComponent>
  let activeBatches: ActiveBatchesComponent;
  let injector: TestBed;
  let processService: ProcessProvider;
  let userService: UserProvider;
  let recipeService: RecipeProvider;
  let toastService: ToastProvider;
  let eventService: Events;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ActiveBatchesComponent
      ],
      imports: [
        IonicModule
      ],
      providers: [
        { provide: Events, useClass: EventsMock },
        { provide: ProcessProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: NavController, useClass: NavMock },
        { provide: Config, useClass: ConfigMock },
        { provide: Platform, useClass: PlatformMockDev },
        { provide: GestureController, useClass: GestureMock },
        { provide: DomController, useClass: DomMock },
        { provide: Form, useClass: FormMock },
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
    userService = injector.get(UserProvider);
    recipeService = injector.get(RecipeProvider);
    toastService = injector.get(ToastProvider);
    eventService = injector.get(Events);
  }));

  describe('Does not have an active batch', () => {
    beforeEach(async(() => {
      processService.getActiveBatchesList = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Array<BehaviorSubject<Batch>>>([]));
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(mockUser()));
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>([]));
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

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      expect(activeBatches.isLoggedIn()).toBe(false);
    }); // end 'should not be logged in' test

    test('should display no active batches when logged in', () => {
      fixture.detectChanges();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const row = fixture.debugElement.query(By.css('.no-active-message'));

      expect(row.nativeElement.innerHTML).toMatch('No Active Batches');
    }); // end 'should display no active batches when logged in' test

  }); // end 'Does not have an active batch' section


  describe('Has an active batch', () => {

    beforeEach(async(() => {
      processService.getActiveBatchesList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<Array<BehaviorSubject<Batch>>>(
            [
              new BehaviorSubject<Batch>(mockBatch())
            ]
          )
        );
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>(
            [
              new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
            ]
          )
        );
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(mockUser()));
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      toastService.presentToast = jest
        .fn();
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
      fixture.detectChanges();

      const _mockBatch = mockBatch();
      _mockBatch.recipe = 'no-recipe';

      const recipeMasterName = activeBatches.getRecipeMasterName(_mockBatch);

      expect(recipeMasterName).toMatch('');
    }); // end 'should fail to get a recipe master name when master is missing' test

    test('should get the recipe variant name that a batch belongs to', () => {
      fixture.detectChanges();

      const variantName = activeBatches.getRecipeName(mockBatch());

      expect(variantName).toMatch(mockRecipeVariantComplete().variantName);
    }); // end 'should get the recipe variant name that a batch belongs to' test

    test('should fail to get a recipe variant name when recipe is missing', () => {
      fixture.detectChanges();

      const _mockBatch = mockBatch();
      _mockBatch.recipe = 'no-recipe';

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
        expect(data.destTitle).toMatch(mockRecipeVariantComplete().variantName);
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
