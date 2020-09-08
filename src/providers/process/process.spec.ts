/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule, TestRequest } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock } from '../../../test-config/mocks-ionic';
import { mockAlert } from '../../../test-config/mockmodels/mockAlert';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockUser } from '../../../test-config/mockmodels/mockUser';

/* Interface imports */
import { Alert } from '../../shared/interfaces/alert';
import { Batch } from '../../shared/interfaces/batch';
import { PrimaryValues } from '../../shared/interfaces/primary-values';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { User } from '../../shared/interfaces/user';

/* Provider imports */
import { ProcessProvider } from './process';
import { CalculationsProvider } from '../calculations/calculations';
import { ClientIdProvider } from '../client-id/client-id';
import { ConnectionProvider } from '../connection/connection';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { RecipeProvider } from '../recipe/recipe';
import { StorageProvider } from '../storage/storage';
import { SyncProvider } from '../sync/sync';
import { UserProvider } from '../user/user';


describe('Process Service', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let httpMock: HttpTestingController;
  let eventService: Events;
  let userService: UserProvider;
  let storage: StorageProvider;
  let sync: SyncProvider;
  let connection: ConnectionProvider;
  let recipeService: RecipeProvider;
  let processHttpError: ProcessHttpErrorProvider;
  let clientIdService: ClientIdProvider;
  let calculationService: CalculationsProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ProcessProvider,
        { provide: CalculationsProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: ConnectionProvider, useValue: {} },
        { provide: UserProvider, useValue: {} },
        { provide: RecipeProvider, useValue: {} },
        { provide: SyncProvider, useValue: {} },
        { provide: ClientIdProvider, useValue: {} },
        { provide: Events, useClass: EventsMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    eventService = injector.get(Events);
    processService = injector.get(ProcessProvider);
    connection = injector.get(ConnectionProvider);
    httpMock = injector.get(HttpTestingController);
    userService = injector.get(UserProvider);
    storage = injector.get(StorageProvider);
    sync = injector.get(SyncProvider);
    recipeService = injector.get(RecipeProvider);
    processHttpError = injector.get(ProcessHttpErrorProvider);
    clientIdService = injector.get(ClientIdProvider);
    calculationService = injector.get(CalculationsProvider);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('API requests', () => {

    test('should end a batch', done => {
      const _mockBatch: Batch = mockBatch();

      expect(_mockBatch.isArchived).toBe(false);

      processService.patchBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processService.archiveActiveBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.endBatchById(_mockBatch.cid)
        .subscribe(
          (updated: Batch): void => {
            expect(updated.isArchived).toBe(true);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should end a batch' test

    test('should fail to end a batch due to missing batch', done => {
      processService.getBatchById = jest
        .fn()
        .mockReturnValue(undefined);

      processService.endBatchById('isMissing')
        .subscribe(
          (response: any): void => {
            console.log('Unexpected response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Batch with id isMissing not found');
            done();
          }
        );
    }); // 'should fail to end a batch due to missing batch'

    test('should fetch batch lists', done => {
      const _mockBatch1: Batch = mockBatch();
      const _mockBatch2: Batch = mockBatch();
      const _mockBatchList: Batch[] = [ _mockBatch1, _mockBatch2 ];

      processService.mapBatchArrayToSubjectArray = jest
        .fn();

      processService.updateBatchStorage = jest
        .fn();

      const mapSpy: jest.SpyInstance = jest
        .spyOn(processService, 'mapBatchArrayToSubjectArray');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(processService, 'updateBatchStorage');

      processService.fetchBatches()
        .subscribe(
          (): void => {
            expect(mapSpy.mock.calls[0][0]).toBe(true);
            expect(mapSpy.mock.calls[0][1]).toStrictEqual(_mockBatchList);
            expect(mapSpy.mock.calls[1][0]).toBe(false);
            expect(mapSpy.mock.calls[1][1]).toStrictEqual(_mockBatchList);
            expect(storageSpy.mock.calls[0][0]).toBe(true);
            expect(storageSpy.mock.calls[1][0]).toBe(false);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/process/batch`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(
        {
          activeBatches: _mockBatchList,
          archiveBatches: _mockBatchList
        }
      );
    }); // end 'should fetch archive batch list' test

    test('should fail to fetch batches due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<503> Server unavailable'));

      processService.fetchBatches()
        .subscribe(
          (response: any): void => {
            console.log('should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<503> Server unavailable');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/process/batch`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(null, mockErrorResponse(503, 'Server unavailable'));
    }); // end 'should fail to fetch batches due to error response' test

    test('should increment the batch\'s current step', done => {
      const _mockBatch: Batch = mockBatch();
      const currentStep: number = _mockBatch.process.currentStep;

      const _mockBatchResponse: Batch = mockBatch();
      _mockBatchResponse.process.currentStep = currentStep + 1;

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processService.patchBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatchResponse));

      processService.refreshBatchList = jest
        .fn();
      processService.updateBatchStorage = jest
        .fn();

      processService.incrementCurrentStep(_mockBatch.cid, currentStep + 1)
        .subscribe(
          (response: Batch): void => {
            expect(response.process.currentStep)
              .toEqual(_mockBatchResponse.process.currentStep);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should increment the batch's current step' test

    test('should end the batch when incrementing from final step', done => {
      processService.endBatchById = jest
        .fn()
        .mockReturnValue(of(null));

      processService.incrementCurrentStep('testId', -1)
        .subscribe(
          (response: Batch): void => {
            expect(response).toBeNull();
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should end the batch when incrementing from final step' test

    test('should fail to increment step due to missing batch', done => {
      processService.getBatchById = jest
        .fn()
        .mockReturnValue(undefined);

      processService.incrementCurrentStep('missingId', 5)
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Batch with id missingId not found');
            done();
          }
        );
    }); // end 'should fail to increment step due to missing batch' test

    test('should initialize active and archive batch lists [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.loadBatchesFromStorage = jest
        .fn();

      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of({}));

      processService.fetchBatches = jest
        .fn()
        .mockReturnValue(of(true));

      const loadSpy: jest.SpyInstance = jest
        .spyOn(processService, 'loadBatchesFromStorage');
      const syncSpy: jest.SpyInstance = jest
        .spyOn(processService, 'syncOnConnection');
      const fetchSpy: jest.SpyInstance = jest
        .spyOn(processService, 'fetchBatches');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      processService.initializeBatchLists();

      setTimeout((): void => {
        expect(loadSpy).toHaveBeenCalled();
        expect(syncSpy).toHaveBeenCalled();
        expect(fetchSpy).toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledWith('init-inventory');
        done();
      }, 10);
    }); // end 'should initialize active and archive batch lists [online]' test

    test('should initialize active and archive batch lists [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.loadBatchesFromStorage = jest
        .fn();

      const loadSpy: jest.SpyInstance = jest
        .spyOn(processService, 'loadBatchesFromStorage');
      const syncSpy: jest.SpyInstance = jest
        .spyOn(processService, 'syncOnConnection');
      const eventSpy: jest.SpyInstance = jest
        .spyOn(eventService, 'publish');

      processService.initializeBatchLists();

      setTimeout((): void => {
        expect(loadSpy).toHaveBeenCalled();
        expect(syncSpy).not.toHaveBeenCalled();
        expect(eventSpy).toHaveBeenCalledWith('init-inventory');
        done();
      }, 10);
    }); // end 'should initialize active and archive batch lists [offline]' test

    test('should fail to initialize active batches due to error response', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.loadBatchesFromStorage = jest
        .fn();

      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of({}));

      processService.fetchBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<500> Server error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      processService.initializeBatchLists();

      setTimeout((): void => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('Batch init error: <500> Server error');
        done();
      }, 10);
    }); // end 'should fail to initialize active batches due to error response' test

    test('should update a batch [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.addSyncFlag = jest
        .fn();

      const _mockBatch: Batch = mockBatch();

      processService.patchBatch(_mockBatch)
        .subscribe(
          (response: Batch): void => {
            expect(response).toStrictEqual(_mockBatch);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const patchReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_mockBatch);
    }); // end 'should update a batch [online]' test

    test('should update a batch [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      const _mockBatch: Batch = mockBatch();

      processService.patchBatch(_mockBatch)
        .subscribe(
          (response: Batch): void => {
            expect(response).toStrictEqual(_mockBatch);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should update a batch [offline]' test

    test('should error response from server on batch update', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Bad request'));

      const _mockBatch: Batch = mockBatch();

      processService.patchBatch(_mockBatch)
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<400> Bad request');
            done();
          }
        );

      const patchReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(null, mockErrorResponse(400, 'Bad request'));
    }); // end 'should fail to update a batch due to error response' test

    test('should fail to patch a batch due to missing server id', done => {
      const _missingBatch: Batch = mockBatch();
      delete _missingBatch._id;

      processService.patchBatch(_missingBatch)
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Batch missing server id');
            done();
          }
        );
    }); // end 'should fail to update a batch due to missing server id' test

    test('should patch batch measured values', done => {
      const _mockBatch: Batch = mockBatch();

      const _mockBatchResponse: Batch = mockBatch();
      const _measuredValues: PrimaryValues
        = _mockBatchResponse.annotations.measuredValues;

      _measuredValues.originalGravity = 1.048;
      _measuredValues.finalGravity = 1.010;
      _measuredValues.efficiency = 70;
      _measuredValues.batchVolume = 5;
      _measuredValues.ABV = 5.2;
      _measuredValues.IBU = 35;
      _measuredValues.SRM = 15;

      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processService.patchBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatchResponse));

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
        );

      calculationService.getABV = jest
        .fn()
        .mockReturnValue(5.2);
      calculationService.calculateTotalIBU = jest
        .fn()
        .mockReturnValue(35);
      calculationService.calculateTotalSRM = jest
        .fn()
        .mockReturnValue(15);

      processService.refreshBatchList = jest
        .fn();
      processService.updateBatchStorage = jest
        .fn();

      const update: PrimaryValues = {
        originalGravity: 1.048,
        finalGravity: 1.010,
        efficiency: 70,
        batchVolume: 5,
        ABV: 5.5,
        IBU: 30,
        SRM: 20
      };

      processService.patchMeasuredValues(true, _mockBatch.cid, update)
        .subscribe(
          (response: Batch): void => {
            const updatedValues: PrimaryValues
              = response.annotations.measuredValues;

            expect(updatedValues.ABV).toEqual(5.2);
            expect(updatedValues.IBU).toEqual(35);
            expect(updatedValues.SRM).toEqual(15);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should patch batch measured values' test

    test('should get an error trying to patch measured values', done => {
      const update: PrimaryValues = {
        originalGravity: 1.048,
        finalGravity: 1.010,
        efficiency: 70,
        batchVolume: 5,
        ABV: 5.5,
        IBU: 30,
        SRM: 20
      };

      processService.patchMeasuredValues(true, '', update)
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: any): void => {
            expect(error instanceof TypeError).toBe(true);
            done();
          }
        );
    }); // end 'should get an error trying to patch measured values' test

    test('should update a step of a batch', done => {
      const _mockBatch: Batch = mockBatch();
      const _mockBatchResponse: Batch = mockBatch();
      const _mockAlert: Alert = mockAlert();

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      const now: string = (new Date()).toISOString();

      const update: object = {
        id: _mockBatch.process.schedule[0]._id,
        update: {
          alerts: [_mockAlert],
          startDatetime: now
        }
      };
      _mockBatchResponse.process.alerts = [_mockAlert];
      _mockBatchResponse.process.schedule[0].startDatetime = now;

      processService.patchBatch = jest
        .fn()
        .mockReturnValue(of(_mockBatchResponse));

      processService.updateBatchStorage = jest
        .fn();

      processService.patchStepById(_mockBatch.cid, update)
        .subscribe(
          (response: Batch): void => {
            expect(response.process.alerts.length).toEqual(1);
            expect(response.process.schedule[0].startDatetime).toMatch(now);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should update step of a batch' test

    test('should fail to patch step due to missing batch', done => {
      processService.getBatchById = jest
        .fn()
        .mockReturnValue(undefined);

      processService.patchStepById('missingId', {})
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Active batch with id missingId not found');
            done();
          }
        );
    }); // end 'should fail to patch step due to missing batch' test

    test('should fail to patch step due to missing owner', done => {
      const _mockBatch: Batch = mockBatch();
      _mockBatch.owner = null;

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processService.patchStepById('', {})
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Active batch is missing an owner id');
            done();
          }
        );
    }); // end 'should fail to patch step due to missing owner' test

    test('should fail to patch step due to step update missing an id', done => {
      const _mockBatch: Batch = mockBatch();

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processService.patchStepById('', {})
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Step update missing an id');
            done();
          }
        );
    }); // end 'should fail to patch step due to step update missing an id' test

    test('should fail to patch step due to missing step', done => {
      const _mockBatch: Batch = mockBatch();

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Batch>(_mockBatch));

      processService.patchStepById('', {id: 'missingId'})
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch('Active batch missing step with id missingId');
            done();
          }
        );
    }); // end 'should fail to patch step due to missing step' test

    test('should start a new batch [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const _mockBatch: Batch = mockBatch();

      processService.generateBatchFromRecipe = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.addBatchToActiveList = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(
          (response: Batch): void => {
            expect(response).toStrictEqual(_mockBatch);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/process/user/uid/master/rmid/variant/rvid`
        );
      expect(getReq.request.method).toMatch('POST');
      getReq.flush(_mockBatch);
    }); // end 'should start a new batch [online]'

    test('should start a new batch [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      const syncSpy: jest.SpyInstance = jest
        .spyOn(processService, 'addSyncFlag');

      const _mockBatch: Batch = mockBatch();

      processService.generateBatchFromRecipe = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.addBatchToActiveList = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(
          (response: Batch): void => {
            expect(response).toStrictEqual(_mockBatch);
            expect(syncSpy).toHaveBeenCalledWith(
              'create',
              _mockBatch.cid
            );
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should start a new batch [offline]' test

    test('should fail to start a new batch due to missing recipe', done => {
      processService.generateBatchFromRecipe = jest
        .fn()
        .mockReturnValue(of(undefined));

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(
          (response: any): void => {
            console.log('should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch('Unable to generate new batch: missing recipe');
            done();
          }
        );
    }); // end 'should fail to start a new batch due to missing recipe' test

    test('should fail to start a new batch due to error response', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Recipe not found'));

      processService.generateBatchFromRecipe = jest
        .fn()
        .mockReturnValue(of(mockBatch()));

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> Recipe not found');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/process/user/uid/master/rmid/variant/rvid`
        );
      expect(getReq.request.method).toMatch('POST');
      getReq.flush(null, mockErrorResponse(404, 'Recipe not found'));
    }); // end 'should fail to start a new batch due to error response' test

  }); // end 'API requests' section


  describe('Sync handling', () => {

    beforeEach(() => {
      this.syncErrors = [];
    });

    test('should add a sync flag', () => {
      sync.addSyncFlag = jest
        .fn();

      const flagSpy: jest.SpyInstance = jest.spyOn(sync, 'addSyncFlag');

      processService.addSyncFlag('create', 'id');

      expect(flagSpy).toHaveBeenCalledWith({
        method: 'create',
        docId: 'id',
        docType: 'batch'
      });
    }); // end 'should add a sync flag' test

    test('should dimiss all sync errors', () => {
      processService.syncErrors = ['', '', ''];

      processService.dismissAllErrors();

      expect(processService.syncErrors.length).toBe(0);
    }); // end 'should dimiss all sync errors' test

    test('should dismiss sync error at index', () => {
      processService.syncErrors = ['1', '2', '3'];

      processService.dismissError(1);

      expect(processService.syncErrors.length).toBe(2);
      expect(processService.syncErrors[1]).toBe('3');
    }); // end 'should dismiss sync error at index' test

    test('should throw error with invalid index when dismissing sync error', () => {
      processService.syncErrors = ['1', '2', '3'];
      expect((): void => {
        processService.dismissError(3);
      })
      .toThrow('Invalid sync error index');

      expect((): void => {
        processService.dismissError(-1);
      })
      .toThrow('Invalid sync error index');
    }); // end 'should throw error with invalid index when dismissing sync error' test

    test('should get array of active batches that are flagged for sync', () => {
      const _mockBatch1: Batch = mockBatch();
      const _mockBatch2: Batch = mockBatch();
      _mockBatch2._id += '1';

      sync.getAllSyncFlags = jest
        .fn()
        .mockReturnValue([{
          method: 'update',
          docId: _mockBatch2._id,
          docType: 'batch'
        }]);

      processService.getBatchList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<Batch>[]>([
            new BehaviorSubject<Batch>(_mockBatch1),
            new BehaviorSubject<Batch>(_mockBatch2)
          ])
        );

      const flagged: BehaviorSubject<Batch>[] = processService
        .getFlaggedBatches(true);
      expect(flagged.length).toBe(1);
      expect(flagged[0].value._id).toMatch(_mockBatch2._id);
    }); // end 'should get array of active batches that are flagged for sync' test

    test('should get array of archive batches that are flagged for sync', () => {
      const _mockBatch1: Batch = mockBatch();
      const _mockBatch2: Batch = mockBatch();
      _mockBatch1.isArchived = true;
      _mockBatch2.isArchived = true;
      _mockBatch2._id += '1';

      sync.getAllSyncFlags = jest
        .fn()
        .mockReturnValue([{
          method: 'create',
          docId: _mockBatch2._id,
          docType: 'batch'
        }]);

      processService.getBatchList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<Batch>[]>([
            new BehaviorSubject<Batch>(_mockBatch1),
            new BehaviorSubject<Batch>(_mockBatch2)
          ])
        );

      const flagged: BehaviorSubject<Batch>[] = processService
        .getFlaggedBatches(false);
      expect(flagged.length).toBe(1);
      expect(flagged[0].value._id).toMatch(_mockBatch2._id);
    }); // end 'should get array of archive batches that are flagged for sync' test

    test('should process sync success responses', () => {
      processService.archiveActiveBatch = jest
        .fn()
        .mockReturnValue(of());

      const _mockBatch: Batch = mockBatch();
      _mockBatch._id = undefined;
      _mockBatch.cid = '0000000000000';

      const _archiveBatch: Batch = mockBatch();
      _archiveBatch._id = 'archiveId';

      processService.activeBatchList$
        .next([new BehaviorSubject<Batch>(_mockBatch)]);

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(processService.activeBatchList$.value[0]);

      _mockBatch._id = 'changedId';
      processService.processSyncSuccess([
        _mockBatch,
        { isDeleted: true, data: _archiveBatch }
      ]);

      expect(processService.activeBatchList$.value[0].value._id)
        .toMatch('changedId');
    }); // end 'should process a sync success response' test

    test('should set sync error if missing recipe master', () => {
      const _mockBatch: Batch = mockBatch();
      _mockBatch._id = undefined;
      const _mockMissingBatch: Batch = mockBatch();
      _mockMissingBatch.cid = 'missing';
      const _mockBatchSubject$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockBatch);

      processService.getBatchById = jest
        .fn()
        .mockReturnValueOnce(_mockBatchSubject$)
        .mockReturnValueOnce(undefined);

      processService.syncErrors = [];

      _mockBatch._id = 'changedId';
      processService.processSyncSuccess([
        _mockBatch,
        _mockMissingBatch
      ]);

      expect(_mockBatchSubject$.value._id).toMatch('changedId');
      expect(processService.syncErrors[0])
        .toMatch('Batch with id: \'missing\' not found');
    }); // end 'should set sync error if missing recipe master' test

    test('should handle sync requests on connection', done => {
      const _mockBatch: Batch = mockBatch();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.processSyncSuccess = jest
        .fn();

      processService.updateBatchStorage = jest
        .fn();

      sync.postSync = jest
        .fn();
      sync.patchSync = jest
        .fn();
      sync.deleteSync = jest
        .fn();

      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterActive$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive);

      const _mockRecipeMasterActiveNoId: RecipeMaster = mockRecipeMasterActive();
      _mockRecipeMasterActiveNoId._id = undefined;
      const _mockRecipeMasterActiveNoId$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActiveNoId);

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValueOnce(_mockRecipeMasterActive$)
        .mockReturnValueOnce(_mockRecipeMasterActiveNoId$)
        .mockReturnValueOnce(undefined);

      const successSpy: jest.SpyInstance = jest
        .spyOn(processService, 'processSyncSuccess');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(processService, 'updateBatchStorage');

      const _mockOfflineSync: Batch = mockBatch();
      _mockOfflineSync._id = undefined;
      const _mockOfflineSync$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockOfflineSync);

      const _mockOnlineSync: Batch = mockBatch();
      _mockOnlineSync.process.currentStep
        = _mockOnlineSync.process.schedule.length - 1;
      const _mockOnlineSync$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockOnlineSync);

      const _mockDeleteSync: Batch = mockBatch();
      _mockDeleteSync._id = 'delete';
      const _mockDeleteSync$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockDeleteSync);

      const _mockDefaultId: Batch = mockBatch();
      _mockDefaultId.recipeMasterId = '0123456789012';
      const _mockDefaultId$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockDefaultId);

      const _mockDefaultIdFail: Batch = mockBatch();
      _mockDefaultIdFail.recipeMasterId = '1234567890123';
      const _mockDefaultIdFail$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockDefaultIdFail);

      processService.getBatchById = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(_mockOfflineSync$)
        .mockReturnValueOnce(_mockOfflineSync$)
        .mockReturnValueOnce(_mockOnlineSync$)
        .mockReturnValueOnce(_mockDeleteSync$)
        .mockReturnValueOnce(_mockOfflineSync$)
        .mockReturnValueOnce(_mockDefaultId$)
        .mockReturnValueOnce(_mockDefaultIdFail$)
        .mockReturnValueOnce(_mockDefaultIdFail$);

      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockBatch,
            _mockOnlineSync,
            { isDeleted: true, data: _mockDeleteSync },
            _mockDefaultId
          ],
          errors: [
            `Sync error: Batch with id '${_mockOfflineSync.cid}' not found`,
            `Batch with id: ${_mockOfflineSync.cid} is missing its server id`,
            'Unknown sync flag method \'unknown-method\'',
            'Sync error: Cannot get batch owner\'s id',
            'Sync error: Cannot get batch owner\'s id'
          ]
        }));

      sync.getSyncFlagsByType = jest
        .fn()
        .mockReturnValue([
          {
            method: 'create',
            docId: _mockOfflineSync.cid,
            docType: 'batch'
          },
          {
            method: 'update',
            docId: _mockOfflineSync.cid,
            docType: 'batch'
          },
          {
            method: 'create',
            docId: _mockOfflineSync.cid,
            docType: 'batch'
          },
          {
            method: 'update',
            docId: _mockOnlineSync._id,
            docType: 'batch'
          },
          {
            method: 'delete',
            docId: _mockDeleteSync._id,
            docType: 'batch'
          },
          {
            method: 'unknown-method',
            docId: _mockOnlineSync._id,
            docType: 'batch'
          },
          {
            method: 'create',
            docId: _mockDefaultId.cid,
            docType: 'batch'
          },
          {
            method: 'create',
            docId: _mockDefaultIdFail.cid,
            docType: 'batch'
          },
          {
            method: 'create',
            docId: _mockDefaultIdFail.cid,
            docType: 'batch'
          }
        ]);

      const syncSpy: jest.SpyInstance = jest.spyOn(sync, 'sync');

      processService.syncOnConnection(false)
        .subscribe(
          (): void => {},
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      setTimeout((): void => {
        // Errors should be indicies 0, 1, 5, 7, and 8; rest are undefined due to mocks
        expect(syncSpy.mock.calls[0][1][0].error)
          .toMatch(
            `Sync error: Batch with id '${_mockOfflineSync.cid}' not found`
          );
        expect(syncSpy.mock.calls[0][1][1].error)
          .toMatch(
            `Batch with id: ${_mockOfflineSync.cid} is missing its server id`
          );
        expect(syncSpy.mock.calls[0][1][2]).toBeUndefined();
        expect(syncSpy.mock.calls[0][1][3]).toBeUndefined();
        expect(syncSpy.mock.calls[0][1][4]).toBeUndefined();
        expect(syncSpy.mock.calls[0][1][5].error)
          .toMatch('Unknown sync flag method \'unknown-method\'');
        expect(syncSpy.mock.calls[0][1][6]).toBeUndefined();
        expect(syncSpy.mock.calls[0][1][7].error)
          .toMatch('Sync error: Cannot get batch owner\'s id');
        expect(syncSpy.mock.calls[0][1][8].error)
          .toMatch('Sync error: Cannot get batch owner\'s id');

        expect(successSpy).toHaveBeenCalledWith([
          _mockBatch,
          _mockOnlineSync,
          { isDeleted: true, data: _mockDeleteSync },
          _mockDefaultId
        ]);

        expect(processService.syncErrors).toStrictEqual([
          `Sync error: Batch with id '${_mockOfflineSync.cid}' not found`,
          `Batch with id: ${_mockOfflineSync.cid} is missing its server id`,
          'Unknown sync flag method \'unknown-method\'',
          'Sync error: Cannot get batch owner\'s id',
          'Sync error: Cannot get batch owner\'s id'
        ]);

        expect(storageSpy.mock.calls[0][0]).toBe(true);
        expect(storageSpy.mock.calls[1][0]).toBe(false);
        done();
      }, 10);
    }); // end 'should handle sync requests on connection' test

    test('should handle sync requests on login', done => {
      const _mockBatch: Batch = mockBatch();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.processSyncSuccess = jest
        .fn();

      processService.updateBatchStorage = jest
        .fn();

      const successSpy: jest.SpyInstance = jest
        .spyOn(processService, 'processSyncSuccess');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(processService, 'updateBatchStorage');

      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockBatch
          ],
          errors: [
            'Active batch with id \'missing\' not found'
          ]
        }));

      sync.getSyncFlagsByType = jest
        .fn()
        .mockReturnValue(
          [
            {
              method: 'create',
              docId: 'missing',
              docType: 'batch'
            },
            {
              method: 'create',
              docId: _mockBatch.cid,
              docType: 'batch'
            }
          ]
        );

      processService.syncOnConnection(true)
        .subscribe(
          (): void => {},
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      setTimeout(():void  => {
        expect(processService.syncErrors[0])
          .toMatch('Active batch with id \'missing\' not found');
        expect(successSpy).not.toHaveBeenCalled();
        expect(storageSpy).not.toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync requests on login' test

    test('should not perform a sync on connection if not logged in', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      processService.syncOnConnection(false)
        .subscribe(
          (response: boolean): void => {
            expect(response).toBe(false);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should not perform a sync on connection if not logged in' test

    test('should call connection sync on reconnect', () => {
      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of());

      const syncSpy: jest.SpyInstance = jest
        .spyOn(processService, 'syncOnConnection');

      processService.syncOnReconnect();

      expect(syncSpy).toHaveBeenCalledWith(false);
    }); // end 'should call connection sync on reconnect' test

    test('should get error response after calling connection sync on reconnect', done => {
      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Error syncing on reconnect'));

      const consoleSpy: jest.SpyInstance = jest
        .spyOn(console, 'log');

      processService.syncOnReconnect();

      setTimeout((): void => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('Error syncing on reconnect');
        done();
      }, 10);
    }); // end 'should get error response after calling connection sync on reconnect' test

    test('should handle sync on signup', done => {
      const _mockSync: Batch = mockBatch();
      _mockSync._id = undefined;
      const _mockBatchResponse: Batch = mockBatch();

      processService.getBatchList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<Batch>[]>(
            [
              new BehaviorSubject<Batch>(_mockSync),
              new BehaviorSubject<Batch>(_mockSync)
            ]
          )
        );

      processService.updateBatchStorage = jest
        .fn();

      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValueOnce(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
        )
        .mockReturnValueOnce(undefined);

      sync.sync = jest
        .fn()
        .mockReturnValue(of(
          {
            successes: [_mockBatchResponse],
            errors: []
          }
        ));

      const successSpy: jest.SpyInstance = jest
        .spyOn(processService, 'processSyncSuccess');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(processService, 'updateBatchStorage');

      processService.syncOnSignup();

      setTimeout((): void => {
        expect(successSpy.mock.calls[0][0][0]).toStrictEqual(_mockBatchResponse);
        expect(processService.syncErrors.length).toBe(0);
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync on signup' test

  }); // end 'Sync handling' section


  describe('Utility methods', () => {

    beforeEach(() => {
      processService.activeBatchList$.value
        .forEach((activeBatch$: BehaviorSubject<Batch>): void => {
          activeBatch$.complete();
        });
      processService.activeBatchList$.next([]);

      processService.archiveBatchList$.value
        .forEach((archiveBatch$: BehaviorSubject<Batch>): void => {
          archiveBatch$.complete();
        });
      processService.archiveBatchList$.next([]);
    });

    test('should add a batch to the list', done => {
      processService.updateBatchStorage = jest
        .fn();

      expect(processService.activeBatchList$.value.length).toEqual(0);

      const _mockBatch: Batch = mockBatch();

      processService.addBatchToActiveList(_mockBatch)
        .subscribe(
          (response: Batch): void => {
            expect(processService.activeBatchList$.value.length).toEqual(1);
            expect(response).toStrictEqual(_mockBatch)
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should add a batch to the list' test

    test('should archive an active batch', done => {
      const _mockBatch: Batch = mockBatch();
      const _mockBatch$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockBatch);
      const _mockArchiveList: BehaviorSubject<BehaviorSubject<Batch>[]>
        = new BehaviorSubject<BehaviorSubject<Batch>[]>([]);

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(_mockBatch$);

      processService.getBatchList = jest
        .fn()
        .mockReturnValue(_mockArchiveList);

      processService.updateBatchStorage = jest
        .fn();

      processService.removeBatchFromList = jest
        .fn()
        .mockReturnValue(of(null));

      const updateSpy: jest.SpyInstance = jest
        .spyOn(processService, 'updateBatchStorage');
      const removeSpy: jest.SpyInstance = jest
        .spyOn(processService, 'removeBatchFromList');

      processService.archiveActiveBatch(_mockBatch.cid)
        .subscribe(
          (response: Batch): void => {
            expect(response).toBeNull();
            expect(updateSpy).toHaveBeenCalledWith(false);
            expect(removeSpy).toHaveBeenCalledWith(true, _mockBatch.cid);
            expect(_mockArchiveList.value.length).toBe(1);
            expect(_mockArchiveList.value[0].value).toStrictEqual(_mockBatch);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should archive an active batch' test

    test('should fail to archive a batch with missing active batch', done => {
      processService.getBatchById = jest
        .fn()
        .mockReturnValue(undefined);

      processService.archiveActiveBatch('missing-id')
        .subscribe(
          (response: any): void => {
            console.log('should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch('Active batch with id: missing-id could not be archived');
            done();
          }
        );
    }); // end 'should fail to archive a batch with missing active batch' test

    test('should clear active batches', () => {
      const _mockBatch: Batch = mockBatch();

      processService.activeBatchList$
        .next([
          new BehaviorSubject<Batch>(_mockBatch),
          new BehaviorSubject<Batch>(_mockBatch)
        ]);

      storage.removeBatches = jest
        .fn();

      const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'removeBatches');

      processService.clearBatchList(true);

      expect(processService.activeBatchList$.value.length).toBe(0);
      expect(storageSpy).toHaveBeenCalledWith(true);
    }); // end 'should clear active batches' test

    test('should clear archive batches', () => {
      const _mockBatch: Batch = mockBatch();

      processService.archiveBatchList$
        .next([
          new BehaviorSubject<Batch>(_mockBatch),
          new BehaviorSubject<Batch>(_mockBatch)
        ]);

      storage.removeBatches = jest
        .fn();

      const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'removeBatches');

      processService.clearBatchList(false);

      expect(processService.archiveBatchList$.value.length).toBe(0);
      expect(storageSpy).toHaveBeenCalledWith(false);
    }); // end 'should clear archive batches' test

    test('should clear all batches', () => {
      processService.clearBatchList = jest
        .fn();

      const clearSpy: jest.SpyInstance = jest
        .spyOn(processService, 'clearBatchList');

      processService.clearAllBatchLists();

      expect(clearSpy.mock.calls[0][0]).toBe(true);
      expect(clearSpy.mock.calls[1][0]).toBe(false);
    }); // end 'should clear all batches' test

    test('should create a batch using a recipe as a template', done => {
      const _mockUser: User = mockUser();
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeVariantComplete: RecipeVariant
        = mockRecipeVariantComplete();

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue(_mockRecipeVariantComplete.cid);

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
        );

      processService.generateBatchFromRecipe(
        _mockUser._id,
        _mockRecipeMasterActive._id,
        _mockRecipeVariantComplete._id
      )
      .subscribe(
        (batch: Batch): void => {
          expect(batch.owner).toMatch(_mockUser._id);
          expect(batch.recipeVariantId).toMatch(_mockRecipeVariantComplete._id);
          expect(batch.process.schedule.length)
            .toBe(_mockRecipeVariantComplete.processSchedule.length);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should create a batch using a recipe as a template' test

    test('should fail to create a batch due to missing recipe', done => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValueOnce(of(undefined))
        .mockReturnValueOnce(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
        );

      combineLatest(
        processService.generateBatchFromRecipe(
          _mockRecipeMasterActive._id,
          '',
          ''
        ),
        processService.generateBatchFromRecipe(
          _mockRecipeMasterActive._id,
          '',
          ''
        )
      )
      .subscribe(
        ([noMaster, noVariant]: Batch[]): void => {
          expect(noMaster).toBeUndefined();
          expect(noVariant).toBeUndefined();
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should fail to create a batch due to missing recipe' test

    test('should get an active batch by its id', done => {
      const _mockBatch1: Batch = mockBatch();
      const _mockBatch2: Batch = mockBatch();
      _mockBatch2._id = 'newid';

      processService.activeBatchList$
        .next([
          new BehaviorSubject<Batch>(_mockBatch1),
          new BehaviorSubject<Batch>(_mockBatch2)
        ]);

      processService.archiveBatchList$.next([]);

      processService.getBatchById(_mockBatch2._id)
        .subscribe(
          (batch: Batch): void => {
            expect(batch._id).toMatch(_mockBatch2._id);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should get an active batch by its id' test

    test('should get an archive batch by its id', done => {
      const _mockBatch1: Batch = mockBatch();
      const _mockBatch2: Batch = mockBatch();
      _mockBatch2._id = 'newid';

      processService.archiveBatchList$
        .next([
          new BehaviorSubject<Batch>(_mockBatch1),
          new BehaviorSubject<Batch>(_mockBatch2)
        ]);

      processService.activeBatchList$.next([]);

      processService.getBatchById(_mockBatch2._id)
        .subscribe(
          (batch: Batch): void => {
            expect(batch._id).toMatch(_mockBatch2._id);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should get an archive batch by its id' test

    test('should return null for missing batch', () => {
      const _mockBatch: Batch = mockBatch();

      processService.activeBatchList$
        .next([
          new BehaviorSubject<Batch>(_mockBatch)
        ]);

      expect(processService.getBatchById('')).toBeUndefined();
    }); // end 'should return null for missing batch' test

    test('should get lists', () => {
      const _mockBatch: Batch = mockBatch();

      processService.activeBatchList$
        .next(
          [ new BehaviorSubject<Batch>(_mockBatch) ]
        );
      processService.archiveBatchList$
        .next(
          [ new BehaviorSubject<Batch>(_mockBatch) ]
        );

      expect(processService.getBatchList(true))
        .toBe(processService.activeBatchList$);
      expect(processService.getBatchList(false))
        .toBe(processService.archiveBatchList$);
    }); // end 'should get active batches list' test

    test('should map an array of active batches to a behavior subject of array of behvior subjects', () => {
      const _mockBatch: Batch = mockBatch();

      expect(processService.activeBatchList$.value.length).toBe(0);
      expect(processService.archiveBatchList$.value.length).toBe(0);

      processService.mapBatchArrayToSubjectArray(
        true,
        [_mockBatch, _mockBatch, _mockBatch]
      );
      processService.mapBatchArrayToSubjectArray(false, [_mockBatch]);

      expect(processService.activeBatchList$.value.length).toBe(3);
      expect(processService.activeBatchList$.value[1].value)
        .toStrictEqual(_mockBatch);
      expect(processService.archiveBatchList$.value.length).toBe(1);
      expect(processService.archiveBatchList$.value[0].value)
        .toStrictEqual(_mockBatch);
    }); // end 'should map an array of active batches to a behavior subject of array of behvior subjects' test

    test('should remove a batch from the list', done => {
      processService.updateBatchStorage = jest
        .fn();

      const _mockBatch: Batch = mockBatch();
      const _deleteMockBatch: Batch = mockBatch();
      _deleteMockBatch._id = 'delete this';

      processService.activeBatchList$
        .next([
          new BehaviorSubject<Batch>(_mockBatch),
          new BehaviorSubject<Batch>(_deleteMockBatch),
          new BehaviorSubject<Batch>(_mockBatch)
        ]);

      combineLatest(
        processService.activeBatchList$,
        processService.removeBatchFromList(true, _deleteMockBatch._id)
      )
      .subscribe(
        ([fromSubject, fromResponse]: [BehaviorSubject<Batch>[], Batch]): void => {
          expect(fromSubject.length).toBe(2);
          expect(fromResponse).toBeNull();
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should remove a batch from the list' test

    test('should fail to remove a batch from the list due to missing batch', done => {
      processService.removeBatchFromList(true, 'batchId')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch('Delete error: Active batch with id batchId not found');
            done();
          }
        );
    }); // end 'should fail to remove a batch from the list due to missing batch' test

    test('should update a step of a batch in list', () => {
      processService.updateBatchStorage = jest
        .fn();

      const now: string = (new Date()).toISOString();
      const _mockBatch: Batch = mockBatch();
      const stepIndex: number = 13;
      const _mockStepUpdate: object = {
        alerts: [ mockAlert() ],
        startDatetime: now
      };

      processService.activeBatchList$
        .next([new BehaviorSubject<Batch>(_mockBatch)]);

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(processService.activeBatchList$.value[0]);

      const update: Batch = processService.updateStepOfBatchInList(
        _mockBatch,
        {
          id: _mockBatch.process.schedule[stepIndex]._id,
          update: _mockStepUpdate
        }
      );

      expect(update.process.alerts.length).toBe(1);
      expect(update.process.schedule[stepIndex].startDatetime).toMatch(now);
    }); // end 'should update a step of a batch in list' test

    test('should fail to update step of a batch due to missing batch', () => {
      processService.getBatchById = jest
        .fn()
        .mockReturnValue(undefined);

      const _mockBatch: Batch = mockBatch();

      expect((): void => {
        processService.updateStepOfBatchInList(_mockBatch, {});
      }).toThrowError(`Active batch with id ${_mockBatch._id} not found`);
    }); // end 'should fail to update step of a batch due to missing batch' test

    test('should fail to update step of a batch due to missing owner property', () => {
      const _mockBatch: Batch = mockBatch();
      _mockBatch.owner = null;

      const _mockBatchSubject$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockBatch);

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(_mockBatchSubject$);

      expect((): void => {
        processService.updateStepOfBatchInList(_mockBatch, {});
      }).toThrowError('Active batch is missing an owner id');
    }); // end 'should failt to update step of a batch due to missing owner property' test

    test('should fail to update step of a batch due to missing step', () => {
      const _mockBatch: Batch = mockBatch();

      const _mockBatchSubject$: BehaviorSubject<Batch>
        = new BehaviorSubject<Batch>(_mockBatch);

      processService.getBatchById = jest
        .fn()
        .mockReturnValue(_mockBatchSubject$);

      expect((): void => {
        processService.updateStepOfBatchInList(_mockBatch, {id: 'missing'});
      }).toThrowError('Active batch missing step with id missing');
    }); // end 'should fail to update step of a batch due to missing step' test

  }); // end 'Utility methods' section


  describe('Storage methods', () => {

    test('should load batches from storage', done => {
      const _mockActiveBatch1: Batch = mockBatch();
      _mockActiveBatch1.cid = '1';
      const _mockActiveBatch2: Batch = mockBatch();
      _mockActiveBatch2.cid = '2';
      const _mockArchiveBatch: Batch = mockBatch();
      _mockArchiveBatch.cid = '3';

      processService.activeBatchList$.next([]);
      processService.archiveBatchList$.next([]);

      processService.mapBatchArrayToSubjectArray = jest
        .fn();

      storage.getBatches = jest
        .fn()
        .mockImplementation((isActive: boolean): Observable<Batch[]> => {
          return of(
            isActive
            ? [_mockActiveBatch1, _mockActiveBatch2]
            : [_mockArchiveBatch]
          );
        });

      const getSpy: jest.SpyInstance = jest
        .spyOn(storage, 'getBatches');
      const mapSpy: jest.SpyInstance = jest
        .spyOn(processService, 'mapBatchArrayToSubjectArray');

      processService.loadBatchesFromStorage();

      setTimeout((): void => {
        expect(getSpy.mock.calls[0][0]).toBe(true);
        expect(getSpy.mock.calls[1][0]).toBe(false);
        expect(mapSpy.mock.calls[0][0]).toBe(true);
        expect(mapSpy.mock.calls[0][1])
          .toStrictEqual([_mockActiveBatch1, _mockActiveBatch2]);
        expect(mapSpy.mock.calls[1][0]).toBe(false);
        expect(mapSpy.mock.calls[1][1]).toStrictEqual([_mockArchiveBatch]);
        done();
      }, 10);
    }); // end 'should load batches from storage' test

    test('should fail to load batches due to storage error', done => {
      storage.getBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable('missing batch'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      processService.loadBatchesFromStorage();

      setTimeout((): void => {
        const callCount: number = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 2][0])
          .toMatch('missing batch: awaiting active batch data from server');
        expect(consoleSpy.mock.calls[callCount - 1][0])
          .toMatch('missing batch: awaiting archive batch data from server');
        done();
      }, 10);
    }); // end 'should fail to load batches due to storage error' test

    test('should call to update active batch storage', done => {
      const _mockBatch: Batch = mockBatch();

      processService.getBatchList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<Batch>[]>(
            [
              new BehaviorSubject<Batch>(_mockBatch),
              new BehaviorSubject<Batch>(_mockBatch)
            ]
          )
        );

      storage.setBatches = jest
        .fn()
        .mockReturnValue(of({}));

      const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'setBatches');
      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      processService.updateBatchStorage(true);

      setTimeout((): void => {
        expect(storageSpy).toHaveBeenCalledWith(
          true,
          [ _mockBatch, _mockBatch ]
        );
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('stored active batches');
        done();
      });
    }); // end 'should call to update active batch storage' test

    test('should get an error from storage on update', () => {
      storage.setBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error message'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      processService.updateBatchStorage(true);

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('active batch store error: error message');
    }); // end 'should get an error from storage on update' test

  }); // end 'Storage methods' section

});
