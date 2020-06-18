/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { IonicModule, NavController, NavParams, Events, Platform } from 'ionic-angular';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { Process } from '../../shared/interfaces/process';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockAlert } from '../../../test-config/mockmodels/mockAlert';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { NavMock, NavParamsMock, PlatformMockDev, SortPipeMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { ProcessPage } from './process';

/* Component imports */
import { CalendarProcessComponent } from './process-components/calendar-process/calendar-process';

/* Provider imports */
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';
import { TimerProvider } from '../../providers/timer/timer';


describe('Process Page', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let recipeService: RecipeProvider;
  let toastService: ToastProvider;
  let timerService: TimerProvider;
  let eventService: Events;
  let fixture: ComponentFixture<ProcessPage>;
  let processPage: ProcessPage;
  let originalUpdateRecipe: any;
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
        { provide: RecipeProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: ToastProvider, useValue: {} },
        { provide: TimerProvider, useValue: {} },
        { provide: Events, useValue: {} },
        { provide: Platform, useClass: PlatformMockDev },
        { provide: NavController, useClass: NavMock },
        { provide: NavParams, useClass: NavParamsMock }
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
    eventService = injector.get(Events);
    toastService = injector.get(ToastProvider);
    timerService = injector.get(TimerProvider);
  }));

  beforeEach(async(() => {
    eventService.subscribe = jest
      .fn();
    eventService.unsubscribe = jest
      .fn();
    eventService.publish = jest
      .fn();
    toastService.presentToast = jest
      .fn();
    processService.getActiveBatchById = jest
      .fn()
      .mockReturnValue(new BehaviorSubject<Batch>(mockBatch()));
    timerService.addBatchTimer = jest
      .fn();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessPage);
    processPage = fixture.componentInstance;
    originalUpdateRecipe = processPage.updateRecipeMasterActive;
    processPage.updateRecipeMasterActive = jest
      .fn();
  });

  describe('Component creation', () => {
    test('should create the component', () => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      fixture.detectChanges();

      expect(processPage).toBeDefined();
    }); // end 'should create the component' test

    test('should have a recipe master passed as a NavParam', () => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      fixture.detectChanges();

      expect(processPage.master._id).toMatch(mockRecipeMasterActive()._id);
    }); // end 'should have a recipe master passed as a NavParam' test

    test('should have found the selected recipe from the master\'s recipe list', () => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      fixture.detectChanges();

      expect(processPage.recipe).toBeDefined();
    }); // end 'should have found the selected recipe from the master\'s recipe list' test

    test('should start a new batch', done => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master.cid

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processPage.batchId = null;
      processPage.selectedBatch$ = null;

      const processStartSpy = jest.spyOn(processService, 'startNewBatch');
      const processRecipeUpdateSpy = jest.spyOn(processPage, 'updateRecipeMasterActive');
      const processTimerSpy = jest.spyOn(timerService, 'addBatchTimer');

      fixture.detectChanges();

      expect(processStartSpy).toHaveBeenCalledWith(
        processPage.requestedUserId,
        processPage.master._id,
        processPage.recipe._id
      );

      setTimeout(() => {
        expect(processPage.selectedBatch$).not.toBeNull();
        expect(processPage.batchId).toBeDefined();
        expect(processRecipeUpdateSpy).toHaveBeenCalled();
        expect(processTimerSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should start a new batch' test

    test('should fail to start a new batch due to error response', done => {
      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      fixture.detectChanges();

      const toastSpy = jest.spyOn(processPage.toastService, 'presentToast');
      const eventSpy = jest.spyOn(processPage.events, 'publish');

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith('<404> User not found');
        expect(eventSpy.mock.calls[0][0]).toMatch('update-nav-header');
        expect(eventSpy.mock.calls[0][1]).toStrictEqual({
          caller: 'process page',
          other: 'batch-end'
        });
        done();
      }, 10);
    }); // end 'should fail to start a new batch due to error response' test

    test('should encounter an internal error after starting the batch, but not able to find batch', done => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id

      processService.startNewBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(null);

      fixture.detectChanges();

      const toastSpy = jest.spyOn(processPage.toastService, 'presentToast');
      const eventSpy = jest.spyOn(processPage.events, 'publish');

      setTimeout(() => {
        const toastCalls = toastSpy.mock.calls[0];
        expect(toastCalls[0]).toMatch('Internal error: Batch not found');
        expect(toastCalls[1]).toBe(3000);
        expect(toastCalls[2]).toMatch('bottom');

        const eventCalls = eventSpy.mock.calls[0];
        expect(eventCalls[0]).toMatch('update-nav-header');
        expect(eventCalls[1]).toStrictEqual({
          caller: 'process page',
          other: 'batch-end'
        });
        done();
      }, 3010);
    }); // end 'should encounter an internal error after starting the batch, but not able to find batch' test

    test('should continue a batch', () => {
      const _mockBatch = mockBatch();

      processPage.batchId = _mockBatch.cid;

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      timerService.addBatchTimer = jest
        .fn();

      processPage.goToActiveStep = jest
        .fn();

      fixture.detectChanges();

      const batchSpy = jest.spyOn(processService, 'getActiveBatchById');

      expect(processPage.selectedBatch).toStrictEqual(_mockBatch);
      expect(batchSpy).toHaveBeenCalledWith(_mockBatch.cid);
    }); //  end 'should continue a batch' test

    test('should get an error continuing a batch', () => {
      processPage.batchId = '0000000000000';

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('batch with id not found'));

      fixture.detectChanges();

      const toastSpy = jest.spyOn(toastService, 'presentToast');
      const eventSpy = jest.spyOn(eventService, 'publish');

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

      const _mockBatch = mockBatch();
      const calStep = 13; // a calendar step
      const _mockAlertInclude = mockAlert();
      _mockAlertInclude.title = _mockBatch.schedule[calStep].name;
      const _mockAlertExclude = mockAlert();

      processPage.selectedBatch.alerts = [_mockAlertExclude, _mockAlertInclude];
      processPage.selectedBatch.currentStep = calStep;

      const alerts = processPage.getAlerts();
      expect(alerts.length).toBe(1);
      expect(alerts[0]).toStrictEqual(_mockAlertInclude);
    }); // end 'should get list of alerts for current step' test

    test('should get the batch cid', () => {
      fixture.detectChanges();

      expect(processPage.getBatchId()).toMatch(mockBatch().cid);
    }); // end 'should get the batch cid' test

    test('should get the current step process', () => {
      fixture.detectChanges();

      const _mockBatch = mockBatch();
      const expected: Process = _mockBatch.schedule[_mockBatch.currentStep];
      processPage.viewStepIndex = _mockBatch.currentStep;

      expect(processPage.getStepData()).toStrictEqual(expected);
    }); // end 'should get the current step process' test

    test('should get step process for a non-concurrent timer process', () => {
      fixture.detectChanges();

      const _mockBatch = mockBatch();
      const nonConcurrentStep = 10;
      const process: Process = _mockBatch.schedule[nonConcurrentStep];
      processPage.viewStepIndex = nonConcurrentStep;

      const timerData = processPage.getTimerStepData();
      expect(timerData.length).toBe(1);
      expect(timerData[0]).toStrictEqual(process);
    }); // end 'should get step process for a non-concurrent timer process' test

    test('should get step process for concurrent timer processes', () => {
      fixture.detectChanges();

      const _mockBatch = mockBatch();
      const concurrentRangeStart = 2;
      const concurrentRangeEnd = 3;
      processPage.viewStepIndex = 2;

      const timerData = processPage.getTimerStepData();
      expect(timerData.length).toBe(2);
      expect(timerData[0]).toStrictEqual(_mockBatch.schedule[concurrentRangeStart]);
      expect(timerData[1]).toStrictEqual(_mockBatch.schedule[concurrentRangeEnd]);
    }); // end 'should get step process for concurrent timer processes' test


  }); // end 'Child Component Output'

  describe('View Display Methods', () => {

    test('should check if a batch has been loaded', () => {
      fixture.detectChanges();

      expect(processPage.isBatchLoaded()).toBe(true);

      processPage.selectedBatch = null;

      expect(processPage.isBatchLoaded()).toBe(false);
    }); // end 'should check if a batch has been loaded' test

    test('should check if the current view step is a manual step', () => {
      const _mockBatch = mockBatch();
      const manualProcess = _mockBatch.schedule[0];

      processPage.getStepData = jest
        .fn()
        .mockReturnValue(manualProcess);

      fixture.detectChanges();

      expect(processPage.isManualStepView()).toBe(true);
    }); // end 'should check if the current view step is a manual step' test

    test('should check if the current view step is a timer step', () => {
      const _mockBatch = mockBatch();
      const timerProcess = _mockBatch.schedule[2];

      fixture.detectChanges();

      processPage.getStepData = jest
        .fn()
        .mockReturnValue(timerProcess);

      expect(processPage.isTimerStepView()).toBe(true);
    }); // end 'should check if the current view step is a timer step' test

    test('should check if the current view step is a calendar step', () => {
      const _mockBatch = mockBatch();
      const calendarProcess = _mockBatch.schedule[13];

      processPage.getStepData = jest
        .fn()
        .mockReturnValue(calendarProcess);

      fixture.detectChanges();

      expect(processPage.isCalendarStepView()).toBe(true);
    }); // end 'should check if the current view step is a calendar step' test

    test('should check if the current view step is a preview or current step', () => {
      fixture.detectChanges();

      expect(processPage.isPreview()).toBe(true);

      processPage.viewStepIndex = mockBatch().currentStep;

      expect(processPage.isPreview()).toBe(false);
    }); // end 'should check if the current view step is a preview or current step' test

  }); // end 'View Display Methods' section

  describe('View Navigation Methods', () => {

    test('should check if viewing the last step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 19;

      expect(processPage.atViewEnd('next')).toBe(true);
    }); // end 'should check if viewing the last step' test

    test('should check if viewing the first step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 0;

      expect(processPage.atViewEnd('prev')).toBe(true);
    }); // end 'should check if viewing the first step' test

    test('should check if viewing at some point between first and last step', () => {
      fixture.detectChanges();

      expect(processPage.atViewEnd('next')).toBe(false);
    }); // end 'should check if viewing at some point between first and last step'

    test('should change view to next step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 4;

      processPage.changeStep('next');

      expect(processPage.viewStepIndex).toBe(5);
    }); // end 'should change view to next step' test

    test('should change view to previous step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 4;

      processPage.changeStep('prev');

      expect(processPage.viewStepIndex).toBe(3);
    }); // end 'should change view to previous step' test

    test('should not change view if at end and trying to go forward', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 19;

      processPage.changeStep('next');

      expect(processPage.viewStepIndex).toBe(19);
    }); // end 'should not change view if at end and trying to go forward' test

    test('should complete the current step and continue schedule', done => {
      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(of(mockBatch()));

      fixture.detectChanges();

      const processSpy = jest.spyOn(processService, 'incrementCurrentStep');
      processPage.completeStep();

      setTimeout(() => {
        expect(processSpy).toHaveBeenCalled();
        expect(processPage.selectedBatch.currentStep).toBe(5);
        expect(processPage.viewStepIndex).toBe(5);
        done();
      }, 10);
    }); // end 'should complete the current step and continue schedule' test

    test('should complete the current concurrent steps and continue schedule', done => {
      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(of(mockBatch()));

      fixture.detectChanges();

      processPage.selectedBatch.currentStep++;
      const processSpy = jest.spyOn(processService, 'incrementCurrentStep');
      processPage.completeStep();

      setTimeout(() => {
        expect(processSpy).toHaveBeenCalled();
        expect(processPage.selectedBatch.currentStep).toBe(8);
        expect(processPage.viewStepIndex).toBe(8);
        done();
      }, 10);
    }); // end 'should complete the current concurrent steps and continue schedule' test

    test('should complete the current step and end the batch', done => {
      const nextIndex = 19;
      const _mockBatch = mockBatch();
      _mockBatch.currentStep = nextIndex;

      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      timerService.removeBatchTimer = jest
        .fn();

      fixture.detectChanges();

      processPage.selectedBatch.currentStep = nextIndex;

      const timerSpy = jest.spyOn(timerService, 'removeBatchTimer');
      const eventSpy = jest.spyOn(eventService, 'publish');
      const toastSpy = jest.spyOn(processPage.toastService, 'presentToast');
      const updateMasterSpy = jest.spyOn(processPage, 'updateRecipeMasterActive');

      setTimeout(() => {
        expect(timerSpy).toHaveBeenCalledWith(
          _mockBatch.cid
        );
        expect(updateMasterSpy).toHaveBeenCalledWith(false);
        expect(eventSpy).toHaveBeenCalledWith(
          'update-nav-header',
          {
            caller: 'process page',
            other: 'batch-end'
          }
        );
        expect(toastSpy).toHaveBeenCalledWith(
          'Enjoy!',
          1000,
          'bright-toast'
        );
        done();
      }, 10);

      processPage.completeStep();
    }); // 'should complete the current step and end the batch' test

    test('should get an error trying to complete a step', done => {
      processService.incrementCurrentStep = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error occurred completing step'));

      processPage.getStep = jest
        .fn()
        .mockReturnValue(1);

      fixture.detectChanges();

      const toastSpy = jest.spyOn(toastService, 'presentToast');

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

      processPage.selectedBatch.schedule.concat(
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

      processPage.selectedBatch.schedule[0] = {
        splitInterval: 1,
        duration: 0,
        concurrent: true,
        _id: '5d02b47a78264160488b6391',
        cid: '0123456789017',
        type: 'timer',
        name: 'Add Nugget hops',
        description: 'Hops addition'
      };
      processPage.selectedBatch.schedule[1] = {
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
      fixture.detectChanges();

      processPage.viewStepIndex = 4;

      expect(processPage.getStep(false, 'next')).toBe(5);

      processPage.viewStepIndex = 5;

      expect(processPage.getStep(false, 'next')).toBe(8);
    }); // end 'should get the next step index without completing a step' test

    test('should get the next step index when completing a step', () => {
      fixture.detectChanges();

      expect(processPage.getStep(true, 'next')).toBe(5);

      processPage.selectedBatch.currentStep = 5;

      expect(processPage.getStep(true, 'next')).toBe(8);
    }); // end 'should get the next step index when completing a step' test

    test('should get the previous step index', () => {
      fixture.detectChanges();

      expect(processPage.getStep(true, 'prev')).toBe(3);

      processPage.selectedBatch.currentStep = 7;

      expect(processPage.getStep(true, 'prev')).toBe(4);
    }); // end 'should get the previous step index when completing a step' test

    test('should get -1 as next step when trying to move forward at end of schedule', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = processPage.selectedBatch.schedule.length - 1;

      expect(processPage.getStep(false, 'next')).toBe(-1);
    }); // end 'should get -1 as next step when trying to move forward at end of schedule' test

    test('should get -1 as previous step when trying to move backward at beginning of schedule', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 0;

      expect(processPage.getStep(false, 'prev')).toBe(-1);
    }); // end 'should get -1 as previous step when trying to move backward at beginning of schedule' test

    test('should change the view step to the selected batch\'s current step', () => {
      fixture.detectChanges();

      processPage.viewStepIndex = 2;

      processPage.goToActiveStep();

      expect(processPage.viewStepIndex).toBe(4);
    }); // end 'should change the view step to the selected batch\'s current step' test

  }); // end 'View Navigation Methods' section

  describe('Calendar Specific Methods', () => {

    test('should handle change date event', () => {
      processPage.clearAlertsForCurrentStep = jest
        .fn();

      fixture.detectChanges();

      const calendarIndex = 13;
      processPage.selectedBatch.currentStep = 13
      processPage.selectedBatch.schedule[calendarIndex].startDatetime = (new Date()).toISOString();

      const toastSpy = jest.spyOn(toastService, 'presentToast');

      processPage.changeDateEventHandler();

      expect(toastSpy).toHaveBeenCalledWith(
        'Select new dates',
        2000,
        'top'
      );
      expect(processPage.selectedBatch.schedule[calendarIndex].hasOwnProperty('startDatetime')).toBe(false);
    }); // end 'should handle change date event' test

    test('should clear alerts associated with current step', () => {
      fixture.detectChanges();

      const calendarIndex = 13;
      const batch = processPage.selectedBatch;
      batch.currentStep = 13
      batch.schedule[calendarIndex].startDatetime = (new Date()).toISOString();

      const _mockAlertRemove = mockAlert();
      _mockAlertRemove.title = batch.schedule[calendarIndex].name;
      const _mockAlertRemain = mockAlert();
      batch.alerts = [_mockAlertRemain, _mockAlertRemove];

      processPage.clearAlertsForCurrentStep();

      expect(batch.alerts.length).toBe(1);
      expect(batch.alerts[0]).toStrictEqual(_mockAlertRemain);
    }); // end 'should clear alerts associated with current step' test

    test('should check if a calendar is in progress', () => {
      fixture.detectChanges();

      const calendarIndex = 13;
      processPage.selectedBatch.currentStep = calendarIndex;

      expect(processPage.isCalendarInProgress()).toBe(false);

      processPage.selectedBatch.schedule[calendarIndex]['startDatetime'] = (new Date()).toISOString();

      expect(processPage.isCalendarInProgress()).toBe(true);
    }); // end 'should check if a calendar is in progress' test

    test('should start a calendar step', done => {
      fixture.detectChanges();

      processPage.processService.patchBatchStepById = jest
        .fn()
        .mockReturnValue(Observable.of({}));

      processPage.calendarRef = new CalendarProcessComponent(eventService);
      processPage.calendarRef.startCalendar = jest
        .fn()
        .mockReturnValue({
          _id: 'test-id',
          startDatetime: (new Date()).toISOString(),
          alerts: []
        });

      const consoleSpy = jest.spyOn(console, 'log');

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

      const navSpy = jest.spyOn(processPage.navCtrl, 'pop');

      processPage.headerNavPopEventHandler();

      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle a nav header pop event' test

    test('should update the recipe master hasActiveBatch property', done => {
      fixture.detectChanges();

      processPage.updateRecipeMasterActive = originalUpdateRecipe;

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      _mockRecipeMasterActive.hasActiveBatch = false;

      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeMasterActive));

      const consoleSpy = jest.spyOn(console, 'log');
      const patchSpy = jest.spyOn(recipeService, 'patchRecipeMasterById');

      expect(processPage.master.hasActiveBatch).toBe(true);

      processPage.updateRecipeMasterActive(false);

      setTimeout(() => {
        expect(patchSpy).toHaveBeenCalled();
        const lastCall = consoleSpy.mock.calls.length - 1;
        expect(consoleSpy.mock.calls[lastCall][0]).toMatch('Recipe master has active batch: ');
        expect(consoleSpy.mock.calls[lastCall][1]).toBe(false);
        done();
      }, 100);
    }); // end 'should update the recipe master hasActiveBatch property' test

    test('should get error response trying to update the recipe master', done => {
      recipeService.patchRecipeMasterById = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error updating recipe master'));

      fixture.detectChanges();

      processPage.updateRecipeMasterActive = originalUpdateRecipe;

      const consoleSpy = jest.spyOn(console, 'log');

      processPage.updateRecipeMasterActive(true);

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('error updating recipe master');
        done();
      }, 10);
    }); // end 'should get error response trying to update the recipe master' test

  }); // end 'Other' section

});
