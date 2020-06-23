/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockAlert } from '../../../test-config/mockmodels/mockAlert';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';

/* Provider imports */
import { ProcessProvider } from './process';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';
import { UserProvider } from '../user/user';
import { RecipeProvider } from '../recipe/recipe';
import { SyncProvider } from '../sync/sync';
import { ClientIdProvider } from '../client-id/client-id';


describe('Process Service', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let httpMock: HttpTestingController;
  let userService: UserProvider;
  let storage: StorageProvider;
  let sync: SyncProvider;
  let connection: ConnectionProvider;
  let recipeService: RecipeProvider;
  let processHttpError: ProcessHttpErrorProvider;
  let clientIdService: ClientIdProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ProcessProvider,
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
    processService = injector.get(ProcessProvider);
    connection = injector.get(ConnectionProvider);
    httpMock = injector.get(HttpTestingController);
    userService = injector.get(UserProvider);
    storage = injector.get(StorageProvider);
    sync = injector.get(SyncProvider);
    recipeService = injector.get(RecipeProvider);
    processHttpError = injector.get(ProcessHttpErrorProvider);
    clientIdService = injector.get(ClientIdProvider);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('API requests', () => {

    test('should end a batch [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.removeBatchFromList = jest
        .fn()
        .mockReturnValue(of(null));

      const _mockBatch = mockBatch();

      processService.endBatchById(_mockBatch._id)
        .subscribe(response => {
          expect(response).toBeNull();
          done();
        });

      const endReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(endReq.request.method).toMatch('DELETE');
      endReq.flush(_mockBatch);
    }); // end 'should end a batch [online]' test

    test('should end a batch [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      processService.removeBatchFromList = jest
        .fn()
        .mockReturnValue(of(null));

      const syncSpy = jest.spyOn(processService, 'addSyncFlag');

      const _mockBatch = mockBatch();

      processService.endBatchById(_mockBatch._id)
        .subscribe(response => {
          expect(response).toBe(null);
          expect(syncSpy).toHaveBeenCalledWith(
            'delete',
            _mockBatch._id
          );
          done();
        });
    }); // end 'should end a batch [offline]' test

    test('should fail to end a batch due to error response', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Bad request'));

      processService.endBatchById('batchId')
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<400> Bad request');
            done();
          }
        );

      const endReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/batchId`);
      expect(endReq.request.method).toMatch('DELETE');
      endReq.flush(null, mockErrorResponse(400, 'Bad request'));
    }); // end 'should fail to end a batch due to error response' test

    test('should increment the batch\'s current step [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const _mockBatch = mockBatch();
      const currentStep = _mockBatch.currentStep;

      processService.updateBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      processService.incrementCurrentStep(_mockBatch, currentStep + 1)
        .subscribe(response => {
          expect(response.currentStep).toBe(_mockBatch.currentStep);
          done();
        });

      const incReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(incReq.request.method).toMatch('PATCH');
      incReq.flush(_mockBatch);
    }); // end 'should increment the batch's current step [online]' test

    test('should increment the batch\'s current step [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      const syncSpy = jest.spyOn(processService, 'addSyncFlag');

      const _mockBatch = mockBatch();
      const currentStep = _mockBatch.currentStep;

      processService.updateBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      processService.incrementCurrentStep(_mockBatch, currentStep + 1)
        .subscribe(response => {
          expect(response.currentStep).toBe(_mockBatch.currentStep);
          expect(syncSpy).toHaveBeenCalledWith(
            'update',
            _mockBatch._id
          );
          done();
        });
    }); // end 'should increment the batch\'s current step [offline]' test

    test('should end the batch when incrementing from final step', done => {
      processService.endBatchById = jest
        .fn()
        .mockReturnValue(of(null));

      const _mockBatch = mockBatch();

      processService.incrementCurrentStep(_mockBatch, -1)
        .subscribe((response: Batch) => {
          expect(response).toBeNull();
          done();
        });
    }); // end 'should end the batch when incrementing from final step' test

    test('should fail to increment step due to thrown error', done => {
      const _mockBatch = mockBatch();

      processService.updateBatchInList = jest
        .fn()
        .mockImplementation(() => {
          throw new Error(`Active batch with id ${_mockBatch._id} not found`);
        });

      processService.incrementCurrentStep(_mockBatch, 5)
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch(`Active batch with id ${_mockBatch._id} not found`);
            done();
          }
        );
    }); // end 'should fail to increment step due to thrown error' test

    test('should fail to increment step due to error response', done => {
      const _mockBatch = mockBatch();

      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Batch not found'));

      processService.updateBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      processService.incrementCurrentStep(_mockBatch, 5)
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<404> Batch not found');
            done();
          }
        );

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(null, mockErrorResponse(404, 'Batch not found'));
    }); // end 'should fail to increment step due to error response' test

    test('should initialize the active batch list [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      storage.getBatches = jest
        .fn()
        .mockReturnValue(of([]));

      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of({}));

      processService.mapActiveBatchArrayToSubjects = jest
        .fn();

      processService.updateBatchStorage = jest
        .fn();

      const mapSpy = jest.spyOn(processService, 'mapActiveBatchArrayToSubjects');
      const storeSpy = jest.spyOn(processService, 'updateBatchStorage');
      const consoleSpy = jest.spyOn(console, 'log');

      processService.initializeActiveBatchList();

      const _mock1 = mockBatch();
      const _mock2 = mockBatch();
      const _mock3 = mockBatch();

      setTimeout(() => {
        expect(mapSpy).toHaveBeenCalledWith([_mock1, _mock2, _mock3]);
        expect(storeSpy).toHaveBeenCalled();
        expect(consoleSpy.mock.calls.length).toBe(2);
        expect(consoleSpy.mock.calls[1][0]).not.toMatch('batch init error');
        done();
      }, 10);

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush([_mock1, _mock2, _mock3]);
    }); // end 'should initialize the active batch list [online]' test

    test('should fail to initialize active batches due to error response', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      storage.getBatches = jest
        .fn()
        .mockReturnValue(of([]));

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<500> Server error'));

      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of({}));

      const consoleSpy = jest.spyOn(console, 'log');

      processService.initializeActiveBatchList();

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('batch init error');
        expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('<500> Server error');
        done();
      }, 10);

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(null, mockErrorResponse(500, 'Server error'));
    }); // end 'should fail to initialize active batches due to error response' test

    test('should fail to initialize active batches due to storage error', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      storage.getBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable('storage error'));

      const consoleSpy = jest.spyOn(console, 'log');

      processService.initializeActiveBatchList();

      setTimeout(() => {
        const callCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('storage error: awaiting data from server');
        done();
      }, 10);
    }); // end 'should fail to initialize active batches due to storage error' test

    test('should update a batch [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const _mockBatch = mockBatch();

      processService.updateBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      processService.patchBatch(_mockBatch)
        .subscribe(response => {
          expect(response).toStrictEqual(_mockBatch);
          done();
        });

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_mockBatch);
    }); // end 'should update a batch [online]' test

    test('should update a batch [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      const _mockBatch = mockBatch();

      processService.updateBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      const syncSpy = jest.spyOn(processService, 'addSyncFlag');

      processService.patchBatch(_mockBatch)
        .subscribe(response => {
          expect(response).toStrictEqual(_mockBatch);
          expect(syncSpy).toHaveBeenCalledWith(
            'update',
            _mockBatch._id
          );
          done();
        });
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

      const _mockBatch = mockBatch();
      processService.updateBatchInList = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.patchBatch(_mockBatch)
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<400> Bad request');
            done();
          }
        );

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(null, mockErrorResponse(400, 'Bad request'));
    }); // end 'should fail to update a batch due to error response' test

    test('should fail to patch a batch due to update batch error response', done => {
      processService.updateBatchInList = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('Active batch with id 000 not found');
        });

      const _missingBatch = mockBatch();

      processService.patchBatch(_missingBatch)
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch(`Active batch with id 000 not found`);
            done();
          }
        );
    }); // end 'should fail to update a batch due to missing batch' test

    test('should update a step of a batch [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const _mockBatch = mockBatch();

      processService.updateStepOfBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      processService.patchBatchStepById(_mockBatch, _mockBatch.schedule[0]._id, {})
        .subscribe(response => {
          expect(response).toStrictEqual(_mockBatch);
          done();
        });

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_mockBatch);
    }); // end 'should update step of a batch [online]' test

    test('should update step of a batch [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      const _mockBatch = mockBatch();

      processService.updateStepOfBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      const syncSpy = jest.spyOn(processService, 'addSyncFlag');

      processService.patchBatchStepById(_mockBatch, _mockBatch.schedule[0]._id, {})
        .subscribe(response => {
          expect(response).toStrictEqual(_mockBatch);
          expect(syncSpy).toHaveBeenCalledWith(
            'update',
            _mockBatch._id
          );
          done();
        });
    }); // end 'should update step of a batch [offline]' test

    test('should fail to update a step due to error response', done => {
      const _mockBatch = mockBatch();

      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.updateStepOfBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<400> Bad request'));

      processService.patchBatchStepById(_mockBatch, 'stepId', {})
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<400> Bad request');
            done();
          }
        );

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/batch/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(null, mockErrorResponse(400, 'Bad request'));
    }); // end 'should fail to update a step due to error response' test

    test('should fail to patch a batch step due to update error response', done => {
      processService.updateStepOfBatchInList = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('Active batch is missing an owner id');
        });

      const _mockBatch = mockBatch();

      processService.patchBatchStepById(_mockBatch, 'id', {})
        .subscribe(
          response => {
            console.log('should not get respones', response);
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('Active batch is missing an owner id');
            done();
          }
        );
    }); // end 'should fail to patch a batch step due to update error response' test

    test('should start a new batch [online]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(true);

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      const _mockBatch = mockBatch();

      processService.addBatchToList = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(response => {
          expect(response).toStrictEqual(_mockBatch);
          done();
        });

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/uid/master/rmid/variant/rvid`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(_mockBatch);
    }); // end 'should start a new batch [online]'

    test('should start a new batch [offline]', done => {
      connection.isConnected = jest
        .fn()
        .mockReturnValue(false);

      processService.addSyncFlag = jest
        .fn();

      const syncSpy = jest.spyOn(processService, 'addSyncFlag');

      const _mockBatch = mockBatch();

      processService.addBatchToList = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.generateBatchFromRecipe = jest
        .fn()
        .mockReturnValue(of(_mockBatch));

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(response => {
          expect(response).toStrictEqual(_mockBatch);
          expect(syncSpy).toHaveBeenCalledWith(
            'create',
            _mockBatch.cid
          );
          done();
        });
    }); // end 'should start a new batch [offline]' test

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

      processService.startNewBatch('uid', 'rmid', 'rvid')
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          }, error => {
            expect(error).toMatch('<404> Recipe not found');
            done();
          }
        );

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/uid/master/rmid/variant/rvid`);
      expect(getReq.request.method).toMatch('GET');
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

      const flagSpy = jest.spyOn(sync, 'addSyncFlag');

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
      expect(() => {
        processService.dismissError(3);
      })
      .toThrow('Invalid sync error index');

      expect(() => {
        processService.dismissError(-1);
      })
      .toThrow('Invalid sync error index');
    }); // end 'should throw error with invalid index when dismissing sync error' test

    test('should get array of active batches that are flagged for sync', () => {
      const _mockBatch1 = mockBatch();
      const _mockBatch2 = mockBatch();
      _mockBatch2._id += '1';

      sync.getAllSyncFlags = jest
        .fn()
        .mockReturnValue([{
          method: 'update',
          docId: _mockBatch2._id,
          docType: 'batch'
        }]);

      processService.getActiveBatchesList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<Array<BehaviorSubject<Batch>>>([
            new BehaviorSubject<Batch>(_mockBatch1),
            new BehaviorSubject<Batch>(_mockBatch2)
          ])
        );

      const flagged = processService.getFlaggedBatches();
      expect(flagged.length).toBe(1);
      expect(flagged[0].value._id).toMatch(_mockBatch2._id);
    }); // end 'should get array of active batches that are flagged for sync' test

    test('should process sync success responses', () => {
      processService.removeBatchFromList = jest
        .fn();

      const removeSpy = jest.spyOn(processService, 'removeBatchFromList');

      const _mockBatch = mockBatch();
      _mockBatch._id = undefined;
      _mockBatch.cid = '0000000000000';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(processService.activeBatchList$.value[0]);

      _mockBatch._id = 'changedId';
      processService.processSyncSuccess([
        _mockBatch,
        { isDeleted: true, data: {_id: 'deletionId'} }
      ]);

      expect(processService.activeBatchList$.value[0].value._id).toMatch('changedId');
      expect(removeSpy).toHaveBeenCalledWith('deletionId');
    }); // end 'should process a sync success response' test

    test('should set sync error if missing recipe master', () => {
      const _mockBatch = mockBatch();
      _mockBatch._id = undefined;

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValueOnce(processService.activeBatchList$.value[0])
        .mockReturnValueOnce(undefined);

      processService.syncErrors = [];

      _mockBatch._id = 'changedId';
      processService.processSyncSuccess([
        _mockBatch,
        { cid: 'missing' }
      ]);

      expect(processService.activeBatchList$.value[0].value._id).toMatch('changedId');
      expect(processService.syncErrors[0]).toMatch('Batch with id: \'missing\' not found');
    }); // end 'should set sync error if missing recipe master' test

    test('should handle sync requests on connection', done => {
      const _mockBatch = mockBatch();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.processSyncSuccess = jest
        .fn();

      processService.updateBatchInList = jest
        .fn();

      sync.postSync = jest
        .fn();

      sync.patchSync = jest
        .fn();

      sync.deleteSync = jest
        .fn();

      processService.updateBatchStorage = jest
        .fn();

      const successSpy = jest.spyOn(processService, 'processSyncSuccess');
      const storageSpy = jest.spyOn(processService, 'updateBatchStorage');

      const _mockOfflineSync = mockBatch();
      _mockOfflineSync._id = undefined;
      const _mockOnlineSync = mockBatch();
      _mockOnlineSync.currentStep = _mockOnlineSync.schedule.length - 1;
      const _mockDeleteSync = mockBatch();
      _mockDeleteSync._id = 'delete';
      const _mockMissingId = mockBatch();
      _mockMissingId._id = undefined;
      _mockMissingId.cid = '21098765431';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch),
        new BehaviorSubject<Batch>(_mockOfflineSync),
        new BehaviorSubject<Batch>(_mockOnlineSync),
        new BehaviorSubject<Batch>(_mockDeleteSync),
        new BehaviorSubject<Batch>(_mockMissingId)
      ]);

      _mockOfflineSync._id = 'inactive';
      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockBatch,
            _mockOnlineSync,
            { isDeleted: true }
          ],
          errors: [
            'Active batch with id \'missing\' not found',
            'Unknown sync flag method \'bad flag\'',
            `Batch with id: ${_mockMissingId.cid} is missing its server id`
          ]
        }));

      sync.getSyncFlagsByType = jest
        .fn()
        .mockReturnValue([
          {
            method: 'create',
            docId: 'missing',
            docType: 'batch'
          },
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
            method: 'bad flag',
            docId: '',
            docType: 'batch'
          },
          {
            method: 'update',
            docId: _mockMissingId.cid,
            docType: 'batch'
          }
        ]);

      processService.syncOnConnection(false)
        .subscribe(() => {});

      setTimeout(() => {
        expect(successSpy.mock.calls[0][0].length).toBe(3);
        expect(successSpy.mock.calls[0][0][0]).toStrictEqual(_mockBatch);
        expect(successSpy.mock.calls[0][0][1]).toStrictEqual(_mockOnlineSync);
        expect(successSpy.mock.calls[0][0][2]).toStrictEqual({ isDeleted: true });
        expect(processService.syncErrors.length).toBe(3);
        expect(processService.syncErrors[0]).toMatch('Active batch with id \'missing\' not found');
        expect(processService.syncErrors[1]).toMatch('Unknown sync flag method \'bad flag\'');
        expect(processService.syncErrors[2]).toMatch(`Batch with id: ${_mockMissingId.cid} is missing its server id`);
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync requests on connection' test

    test('should handle sync requests on login', done => {
      const _mockBatch = mockBatch();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      processService.processSyncSuccess = jest
        .fn();

      processService.updateBatchStorage = jest
        .fn();

      const successSpy = jest.spyOn(processService, 'processSyncSuccess');
      const storageSpy = jest.spyOn(processService, 'updateBatchStorage');

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      sync.sync = jest
        .fn()
        .mockReturnValue(Observable.of({
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
        .subscribe(() => {});

      setTimeout(() => {
        expect(processService.syncErrors[0]).toMatch('Active batch with id \'missing\' not found');
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
        .subscribe(response => {
          expect(response).toBe(false);
          done();
        });
    }); // end 'should not perform a sync on connection if not logged in' test

    test('should call connection sync on reconnect', () => {
      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of());

      const syncSpy = jest.spyOn(processService, 'syncOnConnection');

      processService.syncOnReconnect();

      expect(syncSpy).toHaveBeenCalledWith(false);
    }); // end 'should call connection sync on reconnect' test

    test('should get error response after calling connection sync on reconnect', done => {
      processService.syncOnConnection = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Error syncing on reconnect'));

      const consoleSpy = jest.spyOn(console, 'log');

      processService.syncOnReconnect();

      setTimeout(() => {
        const consoleCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[consoleCount - 1][0]).toMatch('Error syncing on reconnect');
        done();
      }, 10);
    }); // end 'should get error response after calling connection sync on reconnect' test

    test('should handle sync on signup', done => {
      const _mockSync = mockBatch();
      _mockSync._id = undefined;
      const _mockBatchResponse = mockBatch();

      processService.getActiveBatchesList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<Array<BehaviorSubject<Batch>>>(
            [
              new BehaviorSubject<Batch>(_mockSync),
              new BehaviorSubject<Batch>(_mockSync)
            ]
          )
        );

      processService.updateBatchStorage = jest
        .fn();

      recipeService.getRecipeMasterByRecipeId = jest
        .fn()
        .mockReturnValueOnce({})
        .mockReturnValueOnce(undefined);

      sync.sync = jest
        .fn()
        .mockReturnValue(Observable.of(
          {
            successes: [_mockBatchResponse],
            errors: []
          }
        ));

      const successSpy = jest.spyOn(processService, 'processSyncSuccess');
      const storageSpy = jest.spyOn(processService, 'updateBatchStorage');

      processService.syncOnSignup();

      setTimeout(() => {
        expect(successSpy.mock.calls[0][0][0]).toStrictEqual(_mockBatchResponse);
        expect(processService.syncErrors.length).toBe(0);
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync on signup' test

  }); // end 'Sync handling' section


  describe('Utility methods', () => {

    beforeEach(() => {
      processService.activeBatchList$.next([]);
    });

    test('should add a batch to the list', done => {
      processService.updateBatchStorage = jest
        .fn();

      expect(processService.activeBatchList$.value.length).toBe(0);

      processService.activeBatchList$
        .skip(1)
        .subscribe(batchList => {
          expect(batchList.length).toBe(1);
          done();
        });

      processService.addBatchToList(mockBatch());
    }); // end 'should add a batch to the list' test

    test('should clear all batches', done => {
      storage.removeBatches = jest
        .fn();

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(mockBatch()),
        new BehaviorSubject<Batch>(mockBatch()),
        new BehaviorSubject<Batch>(mockBatch())
      ]);

      expect(processService.activeBatchList$.value.length).toBe(3);

      processService.activeBatchList$
        .skip(1)
        .subscribe(batchList => {
          expect(batchList.length).toBe(0);
          done();
        });

      processService.clearProcesses();
    }); // end 'should clear all batches' test

    test('should create a batch using a recipe as a template', done => {
      const _mockUser = mockUser();
      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue(_mockRecipeVariantComplete.cid);

      recipeService.getRecipeVariantById = jest
        .fn()
        .mockReturnValue(of(_mockRecipeVariantComplete));

      processService.generateBatchFromRecipe('masterId', _mockRecipeVariantComplete._id, _mockUser._id)
        .subscribe(batch => {
          expect(batch.owner).toMatch(_mockUser._id);
          expect(batch.recipe).toMatch(_mockRecipeVariantComplete._id);
          expect(batch.schedule.length).toBe(_mockRecipeVariantComplete.processSchedule.length);
          done();
        });
    }); // end 'should create a batch using a recipe as a template' test

    test('should get an active batch by its id', done => {
      const _mockBatch1 = mockBatch();
      const _mockBatch2 = mockBatch();
      _mockBatch2._id = 'newid';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch1),
        new BehaviorSubject<Batch>(_mockBatch2)
      ]);

      processService.getActiveBatchById(_mockBatch2._id)
        .subscribe(batch => {
          expect(batch._id).toMatch(_mockBatch2._id);
          done();
        });
    }); // end 'should get an active batch by its id' test

    test('should return null for missing batch', () => {
      const _mockBatch = mockBatch();

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      expect(processService.getActiveBatchById('')).toBeUndefined();
    }); // end 'should return null for missing batch' test

    test('should get active batches list', () => {
      processService.activeBatchList$.next([ new BehaviorSubject<Batch>(mockBatch()) ]);

      expect(processService.getActiveBatchesList()).toBe(processService.activeBatchList$);
    }); // end 'should get active batches list' test

    test('should map an array of active batches to a behavior subject of array of behvior subjects', () => {
      const _mockBatch = mockBatch();

      expect(processService.activeBatchList$.value.length).toBe(0);

      processService.mapActiveBatchArrayToSubjects([_mockBatch, _mockBatch, _mockBatch]);

      expect(processService.activeBatchList$.value.length).toBe(3);
      expect(processService.activeBatchList$.value[1].value).toStrictEqual(_mockBatch);
    }); // end 'should map an array of active batches to a behavior subject of array of behvior subjects' test

    test('should remove a batch from the list', done => {
      processService.updateBatchStorage = jest
        .fn();

      const _mockBatch = mockBatch();
      const _deleteMockBatch = mockBatch();
      _deleteMockBatch._id = 'delete this';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch),
        new BehaviorSubject<Batch>(_deleteMockBatch),
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$,
        processService.removeBatchFromList(_deleteMockBatch._id)
      )
      .subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.length).toBe(2);
        expect(fromResponse).toBeNull();
        done();
      });
    }); // end 'should remove a batch from the list' test

    test('should fail to remove a batch from the list due to missing batch', done => {
      processService.removeBatchFromList('batchId')
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('Delete error: Active batch with id batchId not found');
            done();
          }
        );
    }); // end 'should fail to remove a batch from the list due to missing batch' test

    test('should update a batch in the list', done => {
      processService.updateBatchStorage = jest
        .fn();

      const _updatedMockBatch = mockBatch();
      _updatedMockBatch.recipe = 'new recipe';
      _updatedMockBatch['ignoreProp'] = 0;

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(mockBatch())
      ]);

      processService.activeBatchList$.value[0]
        .skip(1)
        .subscribe(batch => {
          expect(batch.recipe).toMatch(_updatedMockBatch.recipe);
          expect(batch['ignoreProp']).toBeUndefined();
          done();
        });

      processService.updateBatchInList(_updatedMockBatch);
    }); // end 'should update a batch in the list' test

    test('should fail to update a batch in list due to missing batch', () => {
      const _mockBatch = mockBatch();

      expect(() => {
        processService.updateBatchInList(_mockBatch);
      }).toThrowError(`Active batch with id ${_mockBatch._id} not found`);
    }); // end 'should fail to update a batch in list due to missing batch' test

    test('should update a step of a batch in list', () => {
      processService.updateBatchStorage = jest
        .fn();

      const now = (new Date()).toISOString();
      const _mockBatch = mockBatch();
      const stepIndex = 13;
      const _mockStepUpdate = {
        alerts: [ mockAlert() ],
        startDatetime: now
      };

      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(processService.activeBatchList$.value[0]);

      const update = processService.updateStepOfBatchInList(_mockBatch, _mockBatch.schedule[stepIndex]._id, _mockStepUpdate)

      expect(update.alerts.length).toBe(1);
      expect(update.schedule[stepIndex].startDatetime).toMatch(now);
    }); // end 'should update a step of a batch in list' test

    test('should fail to update step of a batch due to missing batch', () => {
      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(undefined);

      const _mockBatch = mockBatch();

      expect(() => {
        processService.updateStepOfBatchInList(_mockBatch, '', {});
      }).toThrowError(`Active batch with id ${_mockBatch._id} not found`);
    }); // end 'should fail to update step of a batch due to missing batch' test

    test('should fail to update step of a batch due to missing owner property', () => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = null;

      const _mockBatchSubject$ = new BehaviorSubject<Batch>(_mockBatch);

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(_mockBatchSubject$);

      expect(() => {
        processService.updateStepOfBatchInList(_mockBatch, '', {});
      }).toThrowError('Active batch is missing an owner id');
    }); // end 'should failt to update step of a batch due to missing owner property' test

    test('should fail to update step of a batch due to missing step', () => {
      const _mockBatch = mockBatch();

      const _mockBatchSubject$ = new BehaviorSubject<Batch>(_mockBatch);

      processService.getActiveBatchById = jest
        .fn()
        .mockReturnValue(_mockBatchSubject$);

      expect(() => {
        processService.updateStepOfBatchInList(_mockBatch, 'missing', {});
      }).toThrowError('Active batch missing step with id missing');
    }); // end 'should fail to update step of a batch due to missing step' test

    test('should call to update process storage', () => {
      const _mockBatch = mockBatch();
      processService.activeBatchList$.next(
        [
          new BehaviorSubject<Batch>(_mockBatch),
          new BehaviorSubject<Batch>(_mockBatch)
        ]
      );

      storage.setBatches = jest
        .fn()
        .mockReturnValue(of({}));

      const storageSpy = jest.spyOn(storage, 'setBatches');

      processService.updateBatchStorage();

      expect(storageSpy).toHaveBeenCalledWith([ _mockBatch, _mockBatch ]);
    }); // 'should call to update process storage' test

    test('should get an error from storage on update', () => {
      storage.setBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error message'));

      const consoleSpy = jest.spyOn(console, 'log');

      processService.updateBatchStorage();

      const callCount = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('active batch store error');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error message');
    }); // end 'should get an error from storage on update' test

  }); // end 'Utility methods' section

});
