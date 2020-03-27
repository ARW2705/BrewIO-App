/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicStorageModule } from '@ionic/storage';
import { Events } from 'ionic-angular';
import { Network } from '@ionic-native/network/ngx';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { combineLatest } from 'rxjs/observable/combineLatest';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockProcessSchedule } from '../../../test-config/mockmodels/mockProcessSchedule';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';

/* Provider imports */
import { ProcessProvider } from './process';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';
import { UserProvider } from '../user/user';
import { RecipeProvider } from '../recipe/recipe';

describe('Process Service', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let connectionService: ConnectionProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        ProcessProvider,
        ProcessHttpErrorProvider,
        StorageProvider,
        ConnectionProvider,
        UserProvider,
        RecipeProvider,
        Events,
        Network
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    processService = injector.get(ProcessProvider);
    connectionService = injector.get(ConnectionProvider);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('API requests', () => {

    test('should end a batch [online]', done => {
      connectionService.connection = true;
      const _mockBatch = mockBatch();

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$,
        processService.endBatchById(_mockBatch._id)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.length).toBe(0);
        expect(fromResponse).toBeNull();
        done();
      });

      const endReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      expect(endReq.request.method).toMatch('DELETE');
      endReq.flush(_mockBatch);
    }); // end 'should end a batch [online]' test

    test('should increment the batch\'s current step [online]', done => {
      connectionService.connection = true;
      const _mockBatch = mockBatch();
      const currentStep = _mockBatch.currentStep;

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$,
        processService.incrementCurrentStep(_mockBatch, currentStep + 1)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject[0].value.currentStep).toBe(_mockBatch.currentStep);
        expect(fromResponse.currentStep).toBe(_mockBatch.currentStep);
        done();
      });

      const incReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      expect(incReq.request.method).toMatch('PATCH');
      incReq.flush(_mockBatch);
    }); // end 'should increment the batch's current step [online]' test

    test('should initialize the active batch list [online]', done => {
      connectionService.connection = true;
      expect(processService.activeBatchList$.value.length).toBe(0);
      const getSpy = jest.spyOn(processService.storageService, 'getProcesses');
      const storeSpy = jest.spyOn(processService, 'updateCache');

      processService.activeBatchList$
        .skip(1)
        .subscribe(batchList => {
          setTimeout(() => {
            expect(batchList.length).toBe(3);
            expect(getSpy).toHaveBeenCalled();
            expect(storeSpy).toHaveBeenCalled();
            done();
          }, 10);
        });

      processService.initializeActiveBatchList();

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush([mockBatch(), mockBatch(), mockBatch()]);
    }); // end 'should initialize the active batch list [online]' test

    test('should update a step of a batch [online]', done => {
      connectionService.connection = true;
      const _mockBatch = mockBatch();
      const _updatedMockBatch = mockBatch();
      const _updatedStep = mockProcessSchedule()[_mockBatch.currentStep];
      _updatedStep.startDatetime = 'datetime';
      _updatedMockBatch.schedule[_mockBatch.currentStep] = _updatedStep;

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$.value[0],
        processService.patchBatchStepById(_mockBatch, _updatedStep._id, _updatedStep)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.schedule[_mockBatch.currentStep].name).toMatch(_updatedStep.name);
        expect(fromResponse.schedule[_mockBatch.currentStep].name).toMatch(_updatedStep.name);
        done();
      });

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_updatedMockBatch);
    }); // end 'should update step of a batch [online]' test

    test('should start a new batch [online]', done => {
      const _mockBatch = mockBatch();

      combineLatest(
        processService.activeBatchList$,
        processService.startNewBatch('userid', 'masterid', _mockBatch.recipe)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject[0].value._id).toMatch(_mockBatch._id);
        expect(fromResponse._id).toMatch(_mockBatch._id);
        done();
      });

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/userid/master/masterid/recipe/${_mockBatch.recipe}`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(_mockBatch);
    }); // end 'should start a new batch [online]'

  }); // end 'API requests' section

  describe('Utility methods', () => {

    beforeEach(() => {
      processService.activeBatchList$.next([]);
    });

    test('should add a batch to the list', done => {
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

    test('should return null for missing batch', done => {
      const _mockBatch = mockBatch();

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      processService.getActiveBatchById('')
        .subscribe(batch => {
          expect(batch.recipe).toBeNull();
          done();
        });
    }); // end 'should return null for missing batch' test

    test('should get active batches list', () => {
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
      const _mockBatch = mockBatch();
      const _deleteMockBatch = mockBatch();
      _deleteMockBatch._id = 'delete this';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch),
        new BehaviorSubject<Batch>(_deleteMockBatch),
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      // processService.activeBatchList$
      //   .skip(1)
      //   .subscribe(batchList => {
      //     expect(batchList.length).toBe(2);
      //     done();
      //   });
      //
      // processService.removeBatchFromList(_deleteMockBatch)
      //   .subscribe()
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

    test('should update a batch in the list', done => {
      const _updatedMockBatch = mockBatch();
      _updatedMockBatch.recipe = 'new recipe';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(mockBatch())
      ]);

      processService.activeBatchList$.value[0]
        .skip(1)
        .subscribe(batch => {
          expect(batch.recipe).toMatch(_updatedMockBatch.recipe);
          done();
        });

      processService.updateBatchInList(_updatedMockBatch);
    }); // end 'should update a batch in the list' test

    test('should call to update process cache', () => {
      const _mockBatch = mockBatch();
      processService.activeBatchList$.next(
        [
          new BehaviorSubject<Batch>(_mockBatch),
          new BehaviorSubject<Batch>(_mockBatch)
        ]
      );
      const cacheSpy = jest.spyOn(processService.storageService, 'setProcesses');
      processService.updateCache();
      expect(cacheSpy).toHaveBeenCalledWith(
        [
          _mockBatch,
          _mockBatch
        ]
      );
    }); // 'should call to update process cache' test

  }); // end 'Utility methods' section

});
