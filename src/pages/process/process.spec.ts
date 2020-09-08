/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, ModalController, NavController, NavParams, Events, Platform, ViewController } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockAlert } from '../../../test-config/mockmodels/mockAlert';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { EventsMock, ModalControllerMock, ModalMock, NavMock, NavParamsMock, PlatformMockDev, SortPipeMock, ViewControllerMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { Alert } from '../../shared/interfaces/alert';
import { Batch } from '../../shared/interfaces/batch';
import { Process } from '../../shared/interfaces/process';
import { PrimaryValues } from '../../shared/interfaces/primary-values';

/* Page imports */
import { InventoryWrapperPage } from '../extras/components/inventory-wrapper/inventory-wrapper';
import { ProcessPage } from './process';
import { ProcessMeasurementsFormPage } from '../forms/process-measurements-form/process-measurements-form';

/* Component imports */
import { CalendarProcessComponent } from './process-components/calendar-process/calendar-process';

/* Provider imports */
import { ProcessProvider } from '../../providers/process/process';
import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';
import { TimerProvider } from '../../providers/timer/timer';


describe('Process Page', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let toastService: ToastProvider;
  let timerService: TimerProvider;
  let eventService: Events;
  let fixture: ComponentFixture<ProcessPage>;
  let processPage: ProcessPage;
  let modalCtrl: ModalController;
  let navCtrl: NavController;
  configureTestBed();

  beforeAll(async(() => {
    NavParamsMock.setParams('master', mockRecipeMasterActive());
    NavParamsMock.setParams('selectedRecipeId', mockRecipeVariantComplete()._id);
    NavParamsMock.setParams('requestedUserId', mockUser()._id);
  }));

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      declarations: [
        ProcessPage,
        SortPipeMock,
        CalendarProcessComponent
      ],
      imports: [
        IonicModule.forRoot(ProcessPage)
      ],
      providers: [
        { provide: ProcessProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: TimerProvider, useValue: {} },
        { provide: Events, useClass: EventsMock },
        { provide: ModalController, useClass: ModalControllerMock },
        { provide: Platform, useClass: PlatformMockDev },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock },
        { provide: ViewController, useClass: ViewControllerMock }
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
    processService = injector.get(ProcessProvider);
    toastService = injector.get(ToastProvider);
    timerService = injector.get(TimerProvider);
    timerService.addBatchTimer = jest
      .fn();
    toastService.presentToast = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessPage);
    processPage = fixture.componentInstance;

    eventService = injector.get(Events);
    modalCtrl = injector.get(ModalController);
    navCtrl = injector.get(NavController);
    processService.getBatchById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<Batch>(mockBatch()));
  });

  describe('Component creation', () => {

    test('should create the component', () => {
      processPage.ngOnInit = jest
        .fn();

      fixture.detectChanges();

      expect(processPage).toBeDefined();
      expect(processPage.recipeMaster._id)
        .toMatch(mockRecipeMasterActive()._id);
      expect(processPage.recipeVariant._id)
        .toMatch(mockRecipeVariantComplete()._id);
      expect(processPage.requestedUserId).toMatch(mockUser()._id);
    }); // end 'should create the component' test

    test('should start a new batch', done => {
      const _mockBatch: Batch = mockBatch();
      _mockBatch.owner = processPage.recipeMaster.cid

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processPage.updateViewData = jest
        .fn();

      processPage.batchId = null;
      processPage.selectedBatch$ = null;

      const startSpy: jest.SpyInstance = jest
        .spyOn(processService, 'startNewBatch');
      const timerSpy: jest.SpyInstance = jest
        .spyOn(timerService, 'addBatchTimer');
      const viewSpy: jest.SpyInstance = jest
        .spyOn(processPage, 'updateViewData');

      fixture.detectChanges();

      expect(startSpy).toHaveBeenCalledWith(
        processPage.requestedUserId,
        processPage.recipeMaster._id,
        processPage.recipeVariant._id
      );

      setTimeout(() => {
        expect(processPage.selectedBatch$).not.toBeNull();
        expect(processPage.batchId).toBeDefined();
        expect(timerSpy).toHaveBeenCalled();
        expect(viewSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should start a new batch' test

    test('should fail to start a new batch due to error response', done => {
      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      const toastSpy: jest.SpyInstance = jest
        .spyOn(processPage.toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(processPage.events, 'publish');

      fixture.detectChanges();

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith(
          '<404> User not found',
          3000,
          'toast-error'
        );
        expect(eventSpy).toHaveBeenCalledWith(
          'update-nav-header',
          {
            caller: 'process page',
            other: 'batch-end'
          }
        );
        done();
      }, 10);
    }); // end 'should fail to start a new batch due to error response' test

    test('should encounter an internal error after starting the batch, but not able to find batch', done => {
      const _mockBatch: Batch = mockBatch();
      _mockBatch.owner = processPage.recipeMaster._id

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(null);

      const toastSpy: jest.SpyInstance = jest
        .spyOn(processPage.toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(processPage.events, 'publish');

      fixture.detectChanges();

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith(
          'Internal error: Batch not found',
          3000,
          'bottom'
        );
        expect(eventSpy).toHaveBeenCalledWith(
          'update-nav-header',
          {
            caller: 'process page',
            other: 'batch-end'
          }
        );
        done();
      }, 3010);
    }); // end 'should encounter an internal error after starting the batch, but not able to find batch' test

    test('should continue a batch', () => {
      const _mockBatch: Batch = mockBatch();

      processPage.batchId = _mockBatch.cid;

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processPage.goToActiveStep = jest
        .fn();

      fixture.detectChanges();

      const batchSpy: jest.SpyInstance = jest
        .spyOn(processService, 'getBatchById');

      expect(processPage.selectedBatch).toStrictEqual(_mockBatch);
      expect(batchSpy).toHaveBeenCalledWith(_mockBatch.cid);
    }); //  end 'should continue a batch' test

    test('should get an error continuing a batch', () => {
      processPage.batchId = '0000000000000';

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('batch with id not found'));

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      fixture.detectChanges();

      expect(toastSpy).toHaveBeenCalledWith('batch with id not found');
      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'process page',
          other: 'batch-end'
        }
      );
    }); //  end 'should get an error continuing a batch' test

  }); // end 'Component creation' section

  describe('Child Component Output', () => {

    test('should get list of alerts for current step', () => {
      fixture.detectChanges();

      const _mockBatch: Batch = mockBatch();
      const calStep: number = 13; // a calendar step
      const _mockAlertInclude: Alert = mockAlert();
      _mockAlertInclude.title = _mockBatch.process.schedule[calStep].name;
      const _mockAlertExclude: Alert = mockAlert();

      processPage.selectedBatch.process.alerts = [
        _mockAlertExclude,
        _mockAlertInclude
      ];
      processPage.selectedBatch.process.currentStep = calStep;

      const alerts: Alert[] = processPage.getAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0]).toStrictEqual(_mockAlertInclude);
    }); // end 'should get list of alerts for current step' test

    test('should get step process for a non-concurrent timer process', () => {
      fixture.detectChanges();

      const _mockBatch: Batch = mockBatch();
      const nonConcurrentStep: number = 10; // a non-concurrent timer step
      const process: Process = _mockBatch.process.schedule[nonConcurrentStep];
      processPage.viewStepIndex = nonConcurrentStep;

      const timerData: Process[] = processPage.getTimerStepData();
      expect(timerData.length).toBe(1);
      expect(timerData[0]).toStrictEqual(process);
    }); // end 'should get step process for a non-concurrent timer process' test

    test('should get step process for concurrent timer processes', () => {
      fixture.detectChanges();

      const _mockBatch: Batch = mockBatch();
      const concurrentRangeStart: number = 2;
      const concurrentRangeEnd: number = 3;

      processPage.viewStepIndex = 2;

      const timerData: Process[] = processPage.getTimerStepData();

      expect(timerData.length).toBe(2);
      expect(timerData[0])
        .toStrictEqual(_mockBatch.process.schedule[concurrentRangeStart]);
      expect(timerData[1])
        .toStrictEqual(_mockBatch.process.schedule[concurrentRangeEnd]);
    }); // end 'should get step process for concurrent timer processes' test

  }); // end 'Child Component Output'


  describe('View Navigation Methods', () => {

    test('should check if viewing the last step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 19;

      processPage.updateViewData();

      expect(processPage.atViewEnd).toBe(true);
      expect(processPage.atViewStart).toBe(false);
    }); // end 'should check if viewing the last step' test

    test('should check if viewing the first step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 0;

      processPage.updateViewData();

      expect(processPage.atViewEnd).toBe(false);
      expect(processPage.atViewStart).toBe(true);
    }); // end 'should check if viewing the first step' test

    test('should check if viewing at some point between first and last step', () => {
      fixture.detectChanges();

      expect(processPage.atViewEnd).toBe(false);
      expect(processPage.atViewStart).toBe(true);
    }); // end 'should check if viewing at some point between first and last step'

    test('should change view to next step', () => {
      processPage.updateViewData = jest
        .fn();
      processPage.getStep = jest
        .fn()
        .mockReturnValue(5);

      fixture.detectChanges();

      processPage.viewStepIndex = 4;

      processPage.changeStep('next');

      expect(processPage.viewStepIndex).toBe(5);
    }); // end 'should change view to next step' test

    test('should change view to previous step', () => {
      processPage.updateViewData = jest
        .fn();
      processPage.getStep = jest
        .fn()
        .mockReturnValue(3);

      fixture.detectChanges();

      processPage.viewStepIndex = 4;

      processPage.changeStep('prev');

      expect(processPage.viewStepIndex).toBe(3);
    }); // end 'should change view to previous step' test

    test('should not change view if at end and trying to go forward', () => {
      processPage.updateViewData = jest
        .fn();
      processPage.getStep = jest
        .fn()
        .mockReturnValue(-1);

      fixture.detectChanges();

      processPage.viewStepIndex = 19;

      processPage.changeStep('next');

      expect(processPage.viewStepIndex).toBe(19);
    }); // end 'should not change view if at end and trying to go forward' test

    test('should complete the current step and continue schedule', done => {
      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(of(mockBatch()));

      processPage.updateViewData = jest
        .fn();

      fixture.detectChanges();

      const processSpy: jest.SpyInstance = jest
        .spyOn(processService, 'incrementCurrentStep');
      const updateSpy: jest.SpyInstance = jest
        .spyOn(processPage, 'updateViewData');

      processPage.completeStep();

      setTimeout(() => {
        expect(processSpy).toHaveBeenCalled();
        expect(updateSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should complete the current step and continue schedule' test

    test('should complete the current step and end the batch', done => {
      const nextIndex: number = 19; // last index of schedule
      const _mockBatch: Batch = mockBatch();
      _mockBatch.process.currentStep = nextIndex;

      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      timerService.removeBatchTimer = jest
        .fn();

      processPage.navToInventory = jest
        .fn();

      fixture.detectChanges();

      processPage.selectedBatch.process.currentStep = nextIndex;

      const timerSpy: jest.SpyInstance = jest
        .spyOn(timerService, 'removeBatchTimer');
      const navSpy: jest.SpyInstance = jest
        .spyOn(processPage, 'navToInventory');

      processPage.completeStep();

      setTimeout(() => {
        expect(timerSpy).toHaveBeenCalledWith(_mockBatch.cid);
        expect(navSpy).toHaveBeenCalledWith(_mockBatch.cid);
        done();
      }, 10);
    }); // 'should complete the current step and end the batch' test

    test('should get an error trying to complete a step', done => {
      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(
          new ErrorObservable('error occurred completing step')
        );

      processPage.getStep = jest
        .fn()
        .mockReturnValue(1);

      fixture.detectChanges();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      processPage.completeStep();

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith('error occurred completing step');
        done();
      }, 10);
    }); // end 'should get an error trying to complete a step' test

    test('should get next index after skipping concurrent steps', () => {
      fixture.detectChanges();

      expect(processPage.getIndexAfterSkippingConcurrent('next', 5)).toBe(8);
    }); // end 'should get next index after skipping concurrent steps' test

    test('should get previous index after skipping concurrent steps', () => {
      fixture.detectChanges();

      expect(processPage.getIndexAfterSkippingConcurrent('prev', 7)).toBe(4);
    }); // end 'should get previous index after skipping concurrent steps' test

    test('should get -1 as next step of schedule when last steps are concurrent', () => {
      fixture.detectChanges();

      processPage.selectedBatch.process.schedule.concat(
        [
          {
            splitInterval: 1,
            cid: '0123456789018',
            duration: 0,
            concurrent: true,
            _id: '5d02b47a78264160488b6391',
            type: 'timer',
            name: 'Add Nugget hops',
            description: 'Hops addition'
          },
          {
            splitInterval: 1,
            cid: '0123456789019',
            duration: 10,
            concurrent: true,
            _id: '5d02b47a78264160488b6390',
            type: 'timer',
            name: 'Sterilize yeast water',
            description: 'Boil 2 cups water with 4 teaspoons of extract or corn sugar and yeast nutrient. Allow to cool to < 115F before transferring to flask adding yeast. Cover with sanitized foil and swirl'
          }
        ]
      );

      expect(processPage.getIndexAfterSkippingConcurrent('next', 20)).toBe(-1);
    }); // end 'should get -1 as next step of schedule when last steps are concurrent' test

    test('should get -1 as previous step of schedule when first steps are concurrent', () => {
      fixture.detectChanges();

      processPage.selectedBatch.process.schedule[0] = {
        splitInterval: 1,
        duration: 0,
        concurrent: true,
        _id: '5d02b47a78264160488b6391',
        cid: '0123456789017',
        type: 'timer',
        name: 'Add Nugget hops',
        description: 'Hops addition'
      };
      processPage.selectedBatch.process.schedule[1] = {
        splitInterval: 1,
        duration: 10,
        concurrent: true,
        _id: '5d02b47a78264160488b6390',
        cid: '0123456789016',
        type: 'timer',
        name: 'Sterilize yeast water',
        description: 'Boil 2 cups water with 4 teaspoons of extract or corn sugar and yeast nutrient. Allow to cool to < 115F before transferring to flask adding yeast. Cover with sanitized foil and swirl'
      };

      expect(processPage.getIndexAfterSkippingConcurrent('prev', 2)).toBe(-1);
    }); // end 'should get -1 as previous step of schedule when first steps are concurrent' test

    test('should get the next step index without completing a step', () => {
      processPage.getIndexAfterSkippingConcurrent = jest
        .fn()
        .mockReturnValue(8);

      fixture.detectChanges();

      processPage.viewStepIndex = 4;

      expect(processPage.getStep(false, 'next')).toBe(5);

      processPage.viewStepIndex = 5;

      expect(processPage.getStep(false, 'next')).toBe(8);
    }); // end 'should get the next step index without completing a step' test

    test('should get the previous step index', () => {
      processPage.getIndexAfterSkippingConcurrent = jest
        .fn()
        .mockReturnValue(4);

      fixture.detectChanges();

      expect(processPage.getStep(true, 'prev')).toBe(3);

      processPage.selectedBatch.process.currentStep = 7;

      expect(processPage.getStep(true, 'prev')).toBe(4);
    }); // end 'should get the previous step index when completing a step' test

    test('should get -1 as previous step when trying to move backward at beginning of schedule', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 0;

      expect(processPage.getStep(false, 'prev')).toBe(-1);
    }); // end 'should get -1 as previous step when trying to move backward at beginning of schedule' test

    test('should change the view step to the selected batch\'s current step', () => {
      processPage.updateViewData = jest
        .fn();

      const updateSpy: jest.SpyInstance = jest
        .spyOn(processPage, 'updateViewData');

      fixture.detectChanges();

      processPage.goToActiveStep();

      expect(updateSpy).toHaveBeenCalled();
    }); // end 'should change the view step to the selected batch\'s current step' test

    test('should update view step data', () => {
      const _mockBatch: Batch = mockBatch();

      processPage.getTimerStepData = jest
        .fn()
        .mockReturnValue(_mockBatch.process.schedule.slice(2, 4));

      processPage.getAlerts = jest
        .fn()
        .mockReturnValue([]);

      const timerSpy: jest.SpyInstance = jest
        .spyOn(processPage, 'getTimerStepData');

      fixture.detectChanges();

      processPage.viewStepIndex = 2;

      processPage.updateViewData();

      expect(processPage.stepData.length).toEqual(2);
      expect(processPage.stepType).toMatch('timer');
      expect(timerSpy).toHaveBeenCalled();
    }); // end 'should update view step data' test

  }); // end 'View Navigation Methods' section

  describe('Calendar Specific Methods', () => {

    test('should handle change date event', () => {
      processPage.clearAlertsForCurrentStep = jest
        .fn();

      fixture.detectChanges();

      const calendarIndex: number = 13;
      processPage.selectedBatch.process.currentStep = 13
      processPage.selectedBatch.process.schedule[calendarIndex].startDatetime
        = (new Date()).toISOString();

      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');

      processPage.changeDateEventHandler();

      expect(toastSpy).toHaveBeenCalledWith(
        'Select new dates',
        2000,
        'top'
      );
      expect(
        processPage.selectedBatch.process.schedule[calendarIndex]
          .hasOwnProperty('startDatetime')
      )
      .toBe(false);
    }); // end 'should handle change date event' test

    test('should clear alerts associated with current step', () => {
      fixture.detectChanges();

      const calendarIndex: number = 13;
      const batch: Batch = processPage.selectedBatch;
      batch.process.currentStep = 13
      batch.process.schedule[calendarIndex].startDatetime
        = (new Date()).toISOString();

      const _mockAlertRemove: Alert = mockAlert();
      _mockAlertRemove.title = batch.process.schedule[calendarIndex].name;
      const _mockAlertRemain: Alert = mockAlert();
      batch.process.alerts = [_mockAlertRemain, _mockAlertRemove];

      processPage.clearAlertsForCurrentStep();

      expect(batch.process.alerts.length).toBe(1);
      expect(batch.process.alerts[0]).toStrictEqual(_mockAlertRemain);
    }); // end 'should clear alerts associated with current step' test

    test('should check if a calendar is in progress', () => {
      fixture.detectChanges();

      const calendarIndex: number = 13;
      processPage.selectedBatch.process.currentStep = calendarIndex;

      expect(processPage.hasCalendarStarted()).toBe(false);

      processPage.selectedBatch.process.schedule[calendarIndex]['startDatetime']
        = (new Date()).toISOString();

      expect(processPage.hasCalendarStarted()).toBe(true);
    }); // end 'should check if a calendar is in progress' test

    test('should start a calendar step', done => {
      fixture.detectChanges();

      processPage.processService.patchStepById = jest
        .fn()
        .mockReturnValue(of({}));

      processPage.calendarRef = <CalendarProcessComponent>{
        startCalendar: function() {
          return {
            _id: 'test-id',
            startDatetime: (new Date()).toISOString(),
            alerts: []
          };
        }
      };

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      processPage.startCalendar();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Started calendar');
        done();
      }, 10);
    }); // end 'should start a calendar step' test

  }); // end 'Calendar Specific Methods' section

  describe('Other', () => {

    test('should handle a nav header pop event', () => {
      fixture.detectChanges();

      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'pop');

      processPage.headerNavPopEventHandler({origin : 'wrapper'});

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle a nav header pop event' test

    test('should nav to inventory', () => {
      fixture.detectChanges();

      const eventSpy: jest.SpyInstance = jest.spyOn(eventService, 'publish');
      const navSpy: jest.SpyInstance = jest.spyOn(navCtrl, 'push');

      processPage.navToInventory('batchId');

      expect(eventSpy).toHaveBeenCalledWith(
        'update-nav-header',
        {
          caller: 'process page',
          destType: 'page',
          destTitle: 'Inventory',
          origin: 'first'
        }
      );
      expect(navSpy).toHaveBeenCalledWith(
        InventoryWrapperPage,
        {
          onInit: true,
          sourceBatchId: 'batchId'
        }
      );
    }); // end 'should nav to inventory' test

    test('should open measurement form modal', () => {
      fixture.detectChanges();

      const modalSpy: jest.SpyInstance = jest.spyOn(modalCtrl, 'create');

      processPage.openMeasurementFormModal(false);

      expect(modalSpy).toHaveBeenCalledWith(
        ProcessMeasurementsFormPage,
        {
          areAllRequired: false,
          batch: processPage.selectedBatch
        }
      );
    }); // end 'should open measurement form modal' test

    test('should handle modal dismiss', () => {
      fixture.detectChanges();

      const _mockBatch: Batch = mockBatch();
      const _mockModal: ModalMock = new ModalMock();
      const _mockPrimaryValues: PrimaryValues = {
        efficiency: 72,
        originalGravity: 1.060,
        finalGravity: 1.010,
        batchVolume: 5,
        ABV: 6,
        IBU: 20,
        SRM: 15
      };

      modalCtrl.create = jest
        .fn()
        .mockReturnValue(_mockModal);

      processService.patchMeasuredValues = jest
        .fn()
        .mockReturnValueOnce(of({}))
        .mockReturnValueOnce(new ErrorObservable('Patch error'));

      const processSpy: jest.SpyInstance = jest
        .spyOn(processService, 'patchMeasuredValues');
      const toastSpy: jest.SpyInstance = jest
        .spyOn(toastService, 'presentToast');
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      _mockModal._setCallBackData(_mockPrimaryValues);

      processPage.selectedBatch = _mockBatch;

      processPage.openMeasurementFormModal(true);

      expect(processSpy).toHaveBeenCalledWith(
        false,
        _mockBatch._id,
        _mockPrimaryValues
      );
      expect(toastSpy).toHaveBeenCalledWith('Measured Values Updated');

      processPage.openMeasurementFormModal(true);

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Measurement form error: Patch error');
    }); // end 'should handle modal dismiss' test

  }); // end 'Other' section

});
