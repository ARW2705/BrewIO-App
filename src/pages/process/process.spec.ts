/* Module imports */
import { ComponentFixture, TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, NavController, NavParams, ToastController, Events, Platform } from 'ionic-angular';
import { IonicStorageModule } from '@ionic/storage';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Network } from '@ionic-native/network/ngx';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Constant imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { mockAlert, mockAlertPast, mockAlertFuture, mockAlertCurrent } from '../../../test-config/mockmodels/mockAlert';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockTimer } from '../../../test-config/mockmodels/mockTimer';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { NavMock, NavParamsMock, PlatformMockDev, ToastControllerMock, SortPipeMock } from '../../../test-config/mocks-ionic';

/* Page imports */
import { ProcessPage } from './process';

/* Component imports */
import { CalendarComponent } from '../../components/calendar/calendar';

/* Provider imports */
import { ProcessProvider } from '../../providers/process/process';
import { RecipeProvider } from '../../providers/recipe/recipe';
import { UserProvider } from '../../providers/user/user';
import { ToastProvider } from '../../providers/toast/toast';
import { ProcessHttpErrorProvider } from '../../providers/process-http-error/process-http-error';
import { StorageProvider } from '../../providers/storage/storage';
import { ConnectionProvider } from '../../providers/connection/connection';


describe('Process Page', () => {

  describe('Component creation', () => {
    let injector: TestBed;
    let processService: ProcessProvider;
    let recipeService: RecipeProvider;
    let fixture: ComponentFixture<ProcessPage>;
    let processPage: ProcessPage;
    let connectionService: ConnectionProvider;
    let httpMock: HttpTestingController;
    configureTestBed();

    beforeAll(async(() => {
      NavParamsMock.setParams('master', mockRecipeMasterActive());
      NavParamsMock.setParams('selectedRecipeId', mockRecipeComplete()._id);
      NavParamsMock.setParams('requestedUserId', mockUser()._id);
    }));

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule.forRoot(ProcessPage),
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          ProcessProvider,
          RecipeProvider,
          Events,
          ToastProvider,
          StorageProvider,
          Network,
          ConnectionProvider,
          UserProvider,
          ProcessHttpErrorProvider,
          { provide: Platform, useClass: PlatformMockDev },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock }
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
      connectionService = injector.get(ConnectionProvider);
      connectionService.connection = true;
      recipeService = injector.get(RecipeProvider);
      recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())])
      httpMock = injector.get(HttpTestingController);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessPage);
      processPage = fixture.componentInstance;
    });

    afterEach(() => {
      httpMock.verify();
    });

    test('should create the component', () => {
      fixture.detectChanges();

      expect(processPage).toBeDefined();

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(_mockBatch);

      const recipeMasterReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      recipeMasterReq.flush(mockRecipeMasterActive());
    }); // end 'should create the component' test

    test('should have a recipe master passed as a NavParam', () => {
      fixture.detectChanges();

      expect(processPage.master._id).toMatch(mockRecipeMasterActive()._id);

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(_mockBatch);

      const recipeMasterReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      recipeMasterReq.flush(mockRecipeMasterActive());
    }); // end 'should have a recipe master passed as a NavParam' test

    test('should have found the selected recipe from the master\'s recipe list', () => {
      fixture.detectChanges();

      expect(processPage.recipe).toBeDefined();

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(_mockBatch);

      const recipeMasterReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      recipeMasterReq.flush(mockRecipeMasterActive());
    }); // end 'should have found the selected recipe from the master\'s recipe list' test

    test('should start a new batch', done => {
      expect(processPage.batchId).toBeUndefined();
      expect(processPage.selectedBatch$).toBeNull();

      const processStartSpy = jest.spyOn(processService, 'startNewBatch');
      const processRecipeUpdateSpy = jest.spyOn(processPage, 'updateRecipeMasterActive');
      const processTimerSpy = jest.spyOn(processPage, 'composeTimers');

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

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(_mockBatch);

      const recipeMasterReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      recipeMasterReq.flush(mockRecipeMasterActive());
    }); // end 'should start a new batch' test

    test('should fail to start a new batch due to error response', done => {
      fixture.detectChanges();
      const toastSpy = jest.spyOn(processPage.toastService, 'presentToast');
      const eventSpy = jest.spyOn(processPage.events, 'publish');

      setTimeout(() => {
        expect(toastSpy).toHaveBeenCalledWith('<404> User with id not found');
        expect(eventSpy.mock.calls[0][0]).toMatch('update-nav-header');
        expect(eventSpy.mock.calls[0][1]).toStrictEqual({
          caller: 'process page',
          other: 'batch-end'
        });
        done();
      }, 10);

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(null, mockErrorResponse(404, 'User with id not found'));
    }); // end 'should fail to start a new batch due to error response' test

    test('should encounter an internal error after starting the batch, but not able to find batch', done => {
      fixture.detectChanges();
      processPage.processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(null);
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

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(_mockBatch);
    }); // end 'should encounter an internal error after starting the batch, but not able to find batch' test

    test('should configure timer values for 360px wide screen', () => {
      fixture.detectChanges();

      expect(processPage.timerWidth).toBe(240);
      expect(processPage.timerRadius).toBe(104);
      expect(processPage.timerDY).toMatch('0.3em');

      const _mockBatch = mockBatch();
      _mockBatch.owner = processPage.master._id
      const batchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/${processPage.requestedUserId}/master/${processPage.master._id}/recipe/${processPage.recipe._id}`);
      batchReq.flush(_mockBatch);

      const recipeMasterReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      recipeMasterReq.flush(mockRecipeMasterActive());
    }); // end 'should configure timer values for 360px wide screen' test

  }); // end 'Component creation' section


  describe('Step control functions', () => {
    let fixture: ComponentFixture<ProcessPage>;
    let processPage: ProcessPage;
    let injector: TestBed;
    let processService: ProcessProvider;
    let recipeService: RecipeProvider;
    let connectionService: ConnectionProvider;
    let httpMock: HttpTestingController;
    let eventService: Events;
    configureTestBed();

    beforeAll(async(() => {
      NavParamsMock.setParams('master', mockRecipeMasterActive());
      NavParamsMock.setParams('selectedRecipeId', mockRecipeComplete()._id);
      NavParamsMock.setParams('requestedUserId', mockUser()._id);
      NavParamsMock.setParams('selectedBatchId', mockBatch()._id);
    }));

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule.forRoot(ProcessPage),
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          ProcessProvider,
          RecipeProvider,
          Events,
          ToastProvider,
          StorageProvider,
          Network,
          ConnectionProvider,
          UserProvider,
          ProcessHttpErrorProvider,
          { provide: Platform, useClass: PlatformMockDev },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock }
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
      recipeService = injector.get(RecipeProvider);
      recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())])
      connectionService = injector.get(ConnectionProvider);
      connectionService.connection = true;
      httpMock = injector.get(HttpTestingController);
      eventService = injector.get(Events);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessPage);
      processPage = fixture.componentInstance;
    });

    afterEach(() => {
      httpMock.verify();
    });

    test('should continue a batch', done => {
      const processSpy = jest.spyOn(processService, 'getActiveBatchById');
      const timerSpy = jest.spyOn(processPage, 'composeTimers');
      const gotoSpy = jest.spyOn(processPage, 'goToActiveStep');
      fixture.detectChanges();
      expect(processSpy).toHaveBeenCalledWith(mockBatch()._id);
      setTimeout(() => {
        expect(timerSpy).toHaveBeenCalled();
        expect(gotoSpy).toHaveBeenCalled();
        expect(processPage.selectedBatch._id).toMatch(mockBatch()._id);
        done();
      }, 10);
    }); // end 'should continue a batch' test

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
    }); // end 'should check if viewing at some point between first and last step' test

    test('should change view to next step', () => {
      fixture.detectChanges();
      processPage.changeStep('next');
      expect(processPage.viewStepIndex).toBe(5);
    }); // end 'should change view to next step' test

    test('should change view to previous step', () => {
      fixture.detectChanges();
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
      fixture.detectChanges();

      const processSpy = jest.spyOn(processService, 'incrementCurrentStep');
      processPage.completeStep();
      setTimeout(() => {
        expect(processSpy).toHaveBeenCalled();
        expect(processPage.selectedBatch.currentStep).toBe(5);
        expect(processPage.viewStepIndex).toBe(5);
        done();
      }, 10);

      const processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${mockBatch()._id}`);
      processReq.flush(mockBatch());
    }); // end 'should complete the current step and continue schedule' test

    test('should complete the current concurrent steps and continue schedule', done => {
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

      const processReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${mockBatch()._id}`);
      processReq.flush(mockBatch());
    }); // end 'should complete the current concurrent steps and continue schedule' test

    test('should complete the current step and end the batch', done => {
      fixture.detectChanges();
      const nextIndex = 19;
      processPage.selectedBatch.currentStep = nextIndex;
      const _mockBatch = mockBatch();
      _mockBatch.currentStep = nextIndex;
      const processSpy = jest.spyOn(processService, 'incrementCurrentStep');
      const processEndSpy = jest.spyOn(processService, 'endBatchById');
      const toastSpy = jest.spyOn(processPage.toastService, 'presentToast');
      const updateMasterSpy = jest.spyOn(processPage, 'updateRecipeMasterActive');
      eventService.subscribe('update-nav-header', data => {
        setTimeout(() => {
          expect(updateMasterSpy).toHaveBeenCalledWith(false);
          expect(data.other).toMatch('batch-end')
          expect(processSpy).toHaveBeenCalledWith(_mockBatch, -1);
          expect(processEndSpy).toHaveBeenCalledWith(_mockBatch._id);
          expect(toastSpy).toHaveBeenCalledWith('Enjoy!', 1000, 'bright-toast');
          done();
        }, 10);
      });

      processPage.completeStep();

      const endReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${mockBatch()._id}`);
      endReq.flush(mockBatch());

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      recipeReq.flush(mockRecipeMasterActive());
    }); // 'should complete the current step and end the batch' test

    test('should format a duration (in minutes) to hours:minutes', () => {
      fixture.detectChanges();
      expect(processPage.getFormattedDurationString(61)).toMatch('1 hour 1 minute');
      expect(processPage.getFormattedDurationString(30)).toMatch('30 minutes');
      expect(processPage.getFormattedDurationString(120)).toMatch('2 hours');
    }); // end 'should format a duration (in minutes) to hours:minutes' test

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
            "splitInterval": 1,
            "duration": 0,
            "concurrent": true,
            "_id": "5d02b47a78264160488b6391",
            "type": "timer",
            "name": "Add Nugget hops",
            "description": "Hops addition"
          },
          {
            "splitInterval": 1,
            "duration": 10,
            "concurrent": true,
            "_id": "5d02b47a78264160488b6390",
            "type": "timer",
            "name": "Sterilize yeast water",
            "description": "Boil 2 cups water with 4 teaspoons of extract or corn sugar and yeast nutrient. Allow to cool to < 115F before transferring to flask adding yeast. Cover with sanitized foil and swirl"
          }
        ]
      );
      expect(processPage.getIndexAfterSkippingConcurrent('next', 20)).toBe(-1);
    }); // end 'should get -1 as next step of schedule when last steps are concurrent' test

    test('should get -1 as previous step of schedule when first steps are concurrent', () => {
      fixture.detectChanges();
      processPage.selectedBatch.schedule[0] = {
        "splitInterval": 1,
        "duration": 0,
        "concurrent": true,
        "_id": "5d02b47a78264160488b6391",
        "type": "timer",
        "name": "Add Nugget hops",
        "description": "Hops addition"
      };
      processPage.selectedBatch.schedule[1] = {
        "splitInterval": 1,
        "duration": 10,
        "concurrent": true,
        "_id": "5d02b47a78264160488b6390",
        "type": "timer",
        "name": "Sterilize yeast water",
        "description": "Boil 2 cups water with 4 teaspoons of extract or corn sugar and yeast nutrient. Allow to cool to < 115F before transferring to flask adding yeast. Cover with sanitized foil and swirl"
      };
      expect(processPage.getIndexAfterSkippingConcurrent('prev', 2)).toBe(-1);
    }); // end 'should get -1 as previous step of schedule when first steps are concurrent' test

    test('should get the next step index without completing a step', () => {
      fixture.detectChanges();
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

    test('should get the previous step index without completing a step', () => {
      fixture.detectChanges();
      expect(processPage.getStep(false, 'prev')).toBe(3);
      processPage.viewStepIndex = 7;
      expect(processPage.getStep(false, 'prev')).toBe(4);
    }); // end 'should get the previous step index without completing a step' test

    test('should get the previous step index when completing a step', () => {
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

    test('should get the view step\'s description', () => {
      fixture.detectChanges();
      expect(processPage.getViewStepDescription()).toMatch('Raise grain basket to drain. Set kettle to 218F. While heating, squeeze grain bag. Add fermcap.');
    }); // end 'should get the view step\'s description' test

    test('should get the view step\'s name', () => {
      fixture.detectChanges();
      expect(processPage.getViewStepName()).toMatch('Mash out / Heat to boil');
    }); // end 'should get the view step\'s name' test

    test('should get the view step\'s type', () => {
      fixture.detectChanges();
      expect(processPage.getViewStepType()).toMatch('manual');
    }); // end 'should get the view step\'s type' test

    test('should change the view step to the selected batch\'s current step', () => {
      fixture.detectChanges();
      processPage.viewStepIndex = 2;
      processPage.goToActiveStep();
      expect(processPage.viewStepIndex).toBe(4);
    }); // end 'should change the view step to the selected batch\'s current step' test

  }); // 'Step control functions' section


  describe('Alert functions', () => {
    let fixture: ComponentFixture<ProcessPage>;
    let processPage: ProcessPage;
    let injector: TestBed;
    let processService: ProcessProvider;
    configureTestBed();

    beforeAll(async(() => {
      NavParamsMock.setParams('master', mockRecipeMasterActive());
      NavParamsMock.setParams('selectedRecipeId', mockRecipeComplete()._id);
      NavParamsMock.setParams('requestedUserId', mockUser()._id);
      NavParamsMock.setParams('selectedBatchId', mockBatch()._id);
    }));

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule.forRoot(ProcessPage),
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          ProcessProvider,
          Events,
          Network,
          ConnectionProvider,
          UserProvider,
          ProcessHttpErrorProvider,
          { provide: RecipeProvider, useValue: {} },
          { provide: ToastProvider, useValue: {} },
          { provide: Platform, useClass: PlatformMockDev },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: StorageProvider, useValue: {} }
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
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessPage);
      processPage = fixture.componentInstance;
    });

    test('should get the appropriate classes for the closest alert (\'past\')', () => {
      fixture.detectChanges();
      processPage.selectedBatch.alerts = [mockAlert(), mockAlertPast(), mockAlertFuture()];
      const alertClass = processPage.getAlertClass(mockAlertPast());
      expect(alertClass['next-datetime']).toBe(false);
      expect(alertClass['past-datetime']).toBe(true);
    }); // end 'should get the appropriate classes for the closest alert (\'past\')' test

    test('should get the appropriate classes for the closest alert (\'next\')', () => {
      fixture.detectChanges();
      const targetAlert = mockAlert();
      const now = new Date();
      now.setDate(now.getDate() + 2);
      targetAlert.datetime = now.toISOString();
      processPage.selectedBatch.alerts = [targetAlert, mockAlert(), mockAlertPast(), mockAlertFuture()];
      const alertClass = processPage.getAlertClass(targetAlert);
      expect(alertClass['next-datetime']).toBe(true);
      expect(alertClass['past-datetime']).toBe(false);
    }); // end 'should get the appropriate classes for the closest alert (\'next\')' test

    test('should get the closest alert to current datetime within a group', () => {
      fixture.detectChanges();
      const targetAlert = mockAlert();
      const mismatchAlert = mockAlertPast();
      processPage.selectedBatch.alerts = [targetAlert, mismatchAlert, mockAlertFuture()];
      const closest = processPage.getClosestAlertByGroup(mismatchAlert);
      expect(closest.title).toMatch(mismatchAlert.title);
      expect(closest.datetime).not.toMatch(mismatchAlert.datetime);
      expect(closest.datetime).toMatch(targetAlert.datetime);
    }); // end 'should get the closest alert to current datetime within a group' test

    test('should show alert if its title matches the step\'s name', () => {
      fixture.detectChanges();
      processPage.selectedBatch.alerts = [mockAlertCurrent(), mockAlert(), mockAlertPast(), mockAlertFuture()];
      expect(processPage.shouldShowAlert(mockAlertCurrent())).toBe(true);
      expect(processPage.shouldShowAlert(mockAlert())).toBe(false);
    }); // end should show alert if its title matches the step\'s name' test

  }); // end Alert functions section


  describe('Calendar functions', () => {
    let fixture: ComponentFixture<ProcessPage>;
    let processPage: ProcessPage;
    let injector: TestBed;
    let processService: ProcessProvider;
    configureTestBed();

    beforeAll(async(() => {
      NavParamsMock.setParams('master', mockRecipeMasterActive());
      NavParamsMock.setParams('selectedRecipeId', mockRecipeComplete()._id);
      NavParamsMock.setParams('requestedUserId', mockUser()._id);
      NavParamsMock.setParams('selectedBatchId', mockBatch()._id);
    }));

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          CalendarComponent,
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule.forRoot(ProcessPage),
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          ProcessProvider,
          Events,
          ToastProvider,
          Network,
          ConnectionProvider,
          UserProvider,
          ProcessHttpErrorProvider,
          { provide: RecipeProvider, useValue: {} },
          { provide: Platform, useClass: PlatformMockDev },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: StorageProvider, useValue: {} }
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
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessPage);
      processPage = fixture.componentInstance;
    });

    test('should check that a calendar step has been started', () => {
      fixture.detectChanges();
      expect(processPage.calendarInProgress()).toBe(false);
      processPage.selectedBatch.schedule[13]['startDatetime'] = (new Date()).toISOString();
      processPage.selectedBatch.currentStep = 13;
      expect(processPage.calendarInProgress()).toBe(true);
    }); // end 'should check that a calendar step has been started' test

    test('should change view for calendar to select new dates', () => {
      fixture.detectChanges();
      const toastSpy = jest.spyOn(processPage.toastService, 'presentToast');
      const calendarStep = 13;
      processPage.selectedBatch.schedule[calendarStep]['startDatetime'] = (new Date()).toISOString();
      processPage.selectedBatch.currentStep = calendarStep;
      processPage.changeDate();
      expect(toastSpy).toHaveBeenCalledWith('Select new dates', 2000, 'top');
      expect(processPage.selectedBatch.schedule[calendarStep].hasOwnProperty('startDatetime')).toBe(false);
    }); // end 'should change view for calendar to select new dates' test

    test('should get the step data of current calendar step', () => {
      fixture.detectChanges();
      const calendarStep = 13;
      const stepDetails = processPage.selectedBatch.schedule[calendarStep];
      processPage.viewStepIndex = calendarStep;
      const data = processPage.getCurrentStepCalendarData();
      expect(data._id).toMatch(stepDetails._id);
      expect(data.duration).toBe(stepDetails.duration);
      expect(data.title).toMatch(stepDetails.name);
      expect(data.description).toMatch(stepDetails.description);
    }); // end 'should get the step data of current calendar step' test

    test('should get the description of the current calendar step', () => {
      fixture.detectChanges();
      processPage.selectedBatch.currentStep = 13;
      expect(processPage.getNextDateSummary()).toMatch(processPage.selectedBatch.schedule[13].description);
    }); // end 'should get the description of the current calendar step' test

    test('should start a calendar step', done => {
      fixture.detectChanges();

      processPage.calendarRef = new CalendarComponent();
      processPage.calendarRef.getFinal = jest
        .fn()
        .mockReturnValue({
          _id: 'test-id',
          startDatetime: (new Date()).toISOString(),
          alerts: []
        });

      processPage.processService.patchBatchStepById = jest
        .fn()
        .mockReturnValue(Observable.of({}));

      const consoleSpy = jest.spyOn(console, 'log');

      processPage.startCalendar();

      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Started calendar');
        done();
      }, 10);
    }); // end 'should start a calendar step' test

  }); // end Calendar functions section


  describe('Timer functions', () => {
    let fixture: ComponentFixture<ProcessPage>;
    let processPage: ProcessPage;
    let injector: TestBed;
    let processService: ProcessProvider;
    configureTestBed();

    beforeAll(async(() => {
      NavParamsMock.setParams('master', mockRecipeMasterActive());
      NavParamsMock.setParams('selectedRecipeId', mockRecipeComplete()._id);
      NavParamsMock.setParams('requestedUserId', mockUser()._id);
      NavParamsMock.setParams('selectedBatchId', mockBatch()._id);
    }));

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule.forRoot(ProcessPage),
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          ProcessProvider,
          Events,
          ToastProvider,
          Network,
          ConnectionProvider,
          UserProvider,
          ProcessHttpErrorProvider,
          { provide: RecipeProvider, useValue: {} },
          { provide: Platform, useClass: PlatformMockDev },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock },
          { provide: StorageProvider, useValue: {} },
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
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessPage);
      processPage = fixture.componentInstance;
    });

    test('should clear a timer', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      _mockTimer.interval = setInterval(() => {}, 100);
      processPage.clearTimer(_mockTimer);
      expect(_mockTimer.interval).toBeNull();
    }); // end 'should clear a timer' test

    test('should set up timers in the selected batch', () => {
      fixture.detectChanges();
      const _mockBatch = mockBatch();
      processPage.selectedBatch.schedule.push(_mockBatch.schedule[2]);
      processPage.selectedBatch.schedule.push(_mockBatch.schedule[3]);
      processPage.timers = [];
      processPage.composeTimers();
      expect(processPage.timers.length).toBe(5);
    }); // end 'should set up timers in the selected batch' test

    test('should format timer text', () => {
      fixture.detectChanges();
      expect(processPage.formatProgressCircleText(3700)).toMatch('1:01:40');
      expect(processPage.formatProgressCircleText(1000)).toMatch('16:40');
      expect(processPage.formatProgressCircleText(50)).toMatch('50');
      expect(processPage.formatProgressCircleText(5)).toMatch('05');
    }); // end 'should format timer text' test

    test('should get font size by time remaining', () => {
      fixture.detectChanges();
      processPage.timerWidth = 360;
      expect(processPage.getFontSize(3700)).toMatch('72px');
      expect(processPage.getFontSize(100)).toMatch('90px');
      expect(processPage.getFontSize(50)).toMatch('120px');
    }); // end 'should get font size by time remaining' test

    test('should get start index of timers for a given timer step', () => {
      fixture.detectChanges();
      processPage.setViewTimers(2);
      expect(processPage.currentTimers).toBe(0);
      expect(processPage.isConcurrent).toBe(true);
      processPage.setViewTimers(1);
      expect(processPage.currentTimers).toBe(0);
    }); // end 'should get start index of timers for a given timer step' test

    test('should set up timer style settings', () => {
      fixture.detectChanges();
      const settings = processPage.initTimerSettings(2, 3600);
      expect(settings.circle.originX).toBe(120);
      expect(settings.text.fill).toMatch('white');
    }); // end 'should set up timer style settings' test

    test('should reset timer duration', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      _mockTimer.timer.duration = 10;
      processPage.resetDuration(_mockTimer);
      expect(_mockTimer.timer.duration).toBe(processPage.selectedBatch.schedule[2].duration);
    }); // end 'should reset timer duration' test

    test('should update the timer content', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      _mockTimer.timeRemaining = 30;
      processPage.setProgress(_mockTimer);
      expect(_mockTimer.settings.text.fontSize).toMatch('80px');
      expect(_mockTimer.settings.text.content).toMatch('30');
    }); // 'should update the timer content' test

    test('should update the timer content: time expired', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      _mockTimer.timeRemaining = 0;
      const consoleSpy = jest.spyOn(console, 'log');
      processPage.setProgress(_mockTimer);
      expect(consoleSpy).toHaveBeenLastCalledWith('timer expired alarm');
    }); // end 'should update the timer content: time expired' test

    test('should update the timer content: interval reached', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      _mockTimer.timer.splitInterval = 2;
      _mockTimer.timeRemaining = 3600;
      const consoleSpy = jest.spyOn(console, 'log');
      processPage.setProgress(_mockTimer);
      expect(consoleSpy).toHaveBeenLastCalledWith('interval alarm');
    }); // end 'should update the timer content: interval reached' test

    test('should start a single timer', done => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      const remaining = _mockTimer.timeRemaining;
      processPage.startSingleTimer(_mockTimer);
      setTimeout(() => {
        expect(_mockTimer.interval).not.toBeNull();
        expect(_mockTimer.timeRemaining).toBeLessThan(remaining);
        done();
      }, 1000);
    }); // end 'should start a single timer' test

    test('should stop a single timer', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      const clearTimerSpy = jest.spyOn(processPage, 'clearTimer');
      processPage.stopSingleTimer(_mockTimer);
      expect(clearTimerSpy).toHaveBeenCalledWith(_mockTimer);
    }); // end 'should stop a single timer' test

    test('should add a minute to single timer', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      const remaining = _mockTimer.timeRemaining;
      const duration = _mockTimer.timer.duration;
      processPage.addToSingleTimer(_mockTimer);
      expect(_mockTimer.timeRemaining).toBe(remaining + 60);
      expect(_mockTimer.timer.duration).toBe(duration + 1);
    }); // end 'should add a minute to single timer test

    test('should reset a single timer', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      _mockTimer.timeRemaining = 0;
      processPage.resetSingleTimer(_mockTimer);
      expect(_mockTimer.timeRemaining).toBe(_mockTimer.timer.duration * 60);
    }); // end 'should reset a single timer' test

    test('should start all timers of a step', done => {
      fixture.detectChanges();
      processPage.selectedBatch.currentStep = 2;
      console.log(processPage.timers[processPage.currentTimers]);
      processPage.startAllTimers();

      setTimeout(() => {
        processPage.timers[processPage.currentTimers].forEach(timer => {
          expect(timer.interval).not.toBeNull();
        });
        done();
      }, 1000);
    }); // end 'should start all timers of a step' test

    test('should stop all timers of a step', () => {
      fixture.detectChanges();
      processPage.selectedBatch.currentStep = 2;
      processPage.startAllTimers();
      for (let timer of processPage.timers[processPage.currentTimers]) {
        expect(timer.interval).not.toBeNull();
      }
      processPage.stopAllTimers();
      for (let timer of processPage.timers[processPage.currentTimers]) {
        expect(timer.interval).toBeNull();
      }
    }); // end 'should stop all timers of a step' test

    test('should add a minute to all timers of a step', () => {
      fixture.detectChanges();
      processPage.selectedBatch.currentStep = 2;
      const durations = [];
      const remainings = [];
      const timers = processPage.timers[processPage.currentTimers];
      for (let timer of timers) {
        durations.push(timer.timer.duration);
        remainings.push(timer.timeRemaining);
      }
      processPage.addToAllTimers();
      for (let i=0; i < timers.length; i++) {
        expect(timers[i].timer.duration).toBe(durations[i] + 1);
        expect(timers[i].timeRemaining).toBe(remainings[i] + 60);
      }
    }); // end 'should add a minute to all timers of a step' test

    test('should reset timers', () => {
      fixture.detectChanges();
      processPage.selectedBatch.currentStep = 2;
      const originalTimers = processPage.timers[processPage.currentTimers];
      const timers = originalTimers
        .map(timer => {
          timer.timeRemaining = 0;
          return timer;
        });

      processPage.timers[processPage.currentTimers] = timers;

      processPage.resetAllTimers();

      timers.forEach(timer => {
        expect(timer.timeRemaining).toBeGreaterThan(0);
      });
    }); // end 'should reset timers' test

    test('should toggle timer controls visible', () => {
      fixture.detectChanges();
      const _mockTimer = mockTimer();
      expect(_mockTimer.show).toBe(true);
      processPage.toggleTimerControls(_mockTimer);
      expect(_mockTimer.show).toBe(false);
      processPage.toggleTimerControls(_mockTimer);
      expect(_mockTimer.show).toBe(true);
    }); // end 'should toggle timer controls visible' test

  }); // end Timer functions section


  describe('Other functions', () => {
    let fixture: ComponentFixture<ProcessPage>;
    let processPage: ProcessPage;
    let injector: TestBed;
    let processService: ProcessProvider;
    let recipeService: RecipeProvider;
    let httpMock: HttpTestingController;
    configureTestBed();

    beforeAll(async(() => {
      NavParamsMock.setParams('master', mockRecipeMasterActive());
      NavParamsMock.setParams('selectedRecipeId', mockRecipeComplete()._id);
      NavParamsMock.setParams('requestedUserId', mockUser()._id);
      NavParamsMock.setParams('selectedBatchId', mockBatch()._id);
    }));

    beforeAll(done => (async() => {
      TestBed.configureTestingModule({
        declarations: [
          ProcessPage,
          SortPipeMock
        ],
        imports: [
          IonicModule.forRoot(ProcessPage),
          HttpClientTestingModule,
          IonicStorageModule.forRoot()
        ],
        providers: [
          ProcessProvider,
          Events,
          ToastProvider,
          RecipeProvider,
          StorageProvider,
          Network,
          ConnectionProvider,
          UserProvider,
          ProcessHttpErrorProvider,
          { provide: Platform, useClass: PlatformMockDev },
          { provide: NavController, useClass: NavMock },
          { provide: NavParams, useClass: NavParamsMock },
          { provide: ToastController, useClass: ToastControllerMock }
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
      recipeService = injector.get(RecipeProvider);
      recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())])
      httpMock = injector.get(HttpTestingController);
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessPage);
      processPage = fixture.componentInstance;
    });

    afterEach(() => {
      httpMock.verify();
    });

    test('should handle a nav header pop event', () => {
      fixture.detectChanges();
      const navSpy = jest.spyOn(processPage.navCtrl, 'pop');
      processPage.headerNavPopEventHandler();
      expect(navSpy).toHaveBeenCalled();
    }); // end 'should handle a nav header pop event' test

    test('should toggle description visibility', () => {
      fixture.detectChanges();
      expect(processPage.showDescription).toBe(false);
      processPage.toggleShowDescription();
      expect(processPage.showDescription).toBe(true);
      processPage.toggleShowDescription();
      expect(processPage.showDescription).toBe(false);
    }); // end 'should toggle description visibility' test

    test('should update the recipe master hasActiveBatch property', done => {
      fixture.detectChanges();
      const consoleSpy = jest.spyOn(console, 'log');
      expect(processPage.master.hasActiveBatch).toBe(true);
      processPage.updateRecipeMasterActive(false);
      setTimeout(() => {
        const secondToLastCall = consoleSpy.mock.calls.length - 2;
        expect(consoleSpy.mock.calls[secondToLastCall][0]).toMatch('Recipe master has active batch: ');
        expect(consoleSpy.mock.calls[secondToLastCall][1]).toBe(false);
        done();
      }, 10);

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${processPage.master._id}`);
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      _mockRecipeMasterActive.hasActiveBatch = false;
      recipeReq.flush(_mockRecipeMasterActive);
    }); // end 'should update the recipe master hasActiveBatch property' test

  }); // end Other functions section

});
