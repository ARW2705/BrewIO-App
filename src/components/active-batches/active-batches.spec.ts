/* Module imports */
import { TestBed, getTestBed, async, ComponentFixture } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { IonicModule, NavController, Form, DomController, Events, Config, GestureController, Platform } from 'ionic-angular';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NO_ERRORS_SCHEMA } from '@angular/core';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { NavMock, EventsMock, ConfigMock, DomMock, GestureMock, FormMock, PlatformMockDev } from '../../../test-config/mocks-ionic';

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


describe('Active Batch Component', () => {
  let fixture: ComponentFixture<ActiveBatchesComponent>
  let activeBatches: ActiveBatchesComponent;
  let injector: TestBed;
  let processService: ProcessProvider;
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
    recipeService = injector.get(RecipeProvider);
    toastService = injector.get(ToastProvider);
    eventService = injector.get(Events);
  }));

  describe('Does not have an active batch', () => {

    beforeEach(() => {
      fixture = TestBed.createComponent(ActiveBatchesComponent);
      activeBatches = fixture.componentInstance;
    });

    test('should create the component', () => {
      processService.getBatchList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<Batch>[]>([])
        );
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>([])
        );

      fixture.detectChanges();

      expect(activeBatches).toBeDefined();
    }); // end 'should create the component' test

  }); // end 'Does not have an active batch' section


  describe('Has an active batch', () => {

    beforeAll(async(() => {
      processService.getBatchList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<Batch>[]>(
            [
              new BehaviorSubject<Batch>(mockBatch())
            ]
          )
        );
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>(
            [
              new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
            ]
          )
        );
      toastService.presentToast = jest
        .fn();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ActiveBatchesComponent);
      activeBatches = fixture.componentInstance;
    });

    test('should close all sliding items', () => {
      fixture.detectChanges();

      const sliderSpies: jest.SpyInstance[] = activeBatches
        .slidingItems
        .map(slidingItem => {
          return jest.spyOn(slidingItem, 'close');
        });

      activeBatches.updateHeaderNavEventHandler();

      sliderSpies.forEach((sliderSpy: jest.SpyInstance) => {
        expect(sliderSpy).toHaveBeenCalled();
      });
    }); // end 'should close all sliding items' test

    test('should navigate to the active process', () => {
      fixture.detectChanges();

      const _mockRecipeMaster: RecipeMaster = mockRecipeMasterActive();
      const _mockBatch: Batch = mockBatch();

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMaster)
        );

      eventService.publish = jest
        .fn();

      const navSpy: jest.SpyInstance = jest.spyOn(activeBatches.navCtrl, 'push');
      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');

      activeBatches.navToBrewProcess(_mockBatch);

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'active batches component',
          dest: 'process',
          destType: 'page',
          destTitle: mockRecipeVariantComplete().variantName,
          origin: 'mock-active-name'
        }
      );

      expect(navSpy).toHaveBeenCalledWith(
        ProcessPage,
        {
          master: _mockRecipeMaster,
          requestedUserId: _mockRecipeMaster.owner,
          selectedRecipeId: _mockRecipeMaster.master,
          selectedBatchId: _mockBatch._id
        }
      );
    }); // end 'should navigate to the active process' test

    test('should display error when trying to navigate to a process with an undefined recipe master', () => {
      fixture.detectChanges();

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(undefined);

      const toastSpy: jest.SpyInstance = jest
        .spyOn(activeBatches.toastService, 'presentToast');

      activeBatches.navToBrewProcess(mockBatch());

      expect(toastSpy).toHaveBeenCalledWith('Error finding associated Recipe');
    }); // end 'should display error when trying to navigate to a process with an undefined recipe master' test

    test('should display an active batch', () => {
      fixture.detectChanges();

      const slidingItems: DebugElement = fixture
        .debugElement
        .query(By.css('.sliding-item'));

      expect(slidingItems).toBeDefined();
    }); // end 'should display an active batch' test

  }); // end 'Has an active batch' test

});
