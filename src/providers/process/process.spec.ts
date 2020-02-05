/* Module imports */
import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { combineLatest } from 'rxjs/observable/combineLatest';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Mock imports */
import { mockProcessSchedule } from '../../../test-config/mockmodels/mockProcessSchedule';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';

/* Provider imports */
import { ProcessProvider } from './process';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

describe('Process Service', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        ProcessProvider,
        ProcessHttpErrorProvider
      ]
    });
    injector = getTestBed();
    processService = injector.get(ProcessProvider);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('API requests', () => {

    test('should end a batch', done => {
      const _mockBatch = mockBatch();

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$,
        processService.endBatchById(_mockBatch._id)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.length).toBe(0);
        expect(fromResponse._id).toMatch(_mockBatch._id);
        done();
      });

      const endReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      expect(endReq.request.method).toMatch('DELETE');
      endReq.flush(_mockBatch);
    }); // end 'should end a batch' test

    test('should increment the batch\'s current step', done => {
      const _mockBatch = mockBatch();
      const _updatedMockBatch = mockBatch();
      _updatedMockBatch.currentStep++;

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$,
        processService.incrementCurrentStep(_mockBatch._id)
      ).subscribe(([fromSubject, fromResponse]) => {
        const expectedStep = _mockBatch.currentStep + 1;
        expect(fromSubject[0].value.currentStep).toBe(expectedStep);
        expect(fromResponse.currentStep).toBe(expectedStep);
        done();
      });

      const incReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}/next`);
      expect(incReq.request.method).toMatch('GET');
      incReq.flush(_updatedMockBatch);
    }); // end 'should increment the batch's current step' test

    test('should initialize the active batch list', done => {
      expect(processService.activeBatchList$.value.length).toBe(0);

      processService.activeBatchList$
        .skip(1)
        .subscribe(batchList => {
          expect(batchList.length).toBe(3);
          done();
        });

      processService.initializeActiveBatchList();

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush([mockBatch(), mockBatch(), mockBatch()]);
    }); // end 'should initialize the active batch list' test

    test('should update a batch by its id', done => {
      const _mockBatch = mockBatch();
      const _updatedMockBatch = mockBatch();
      _updatedMockBatch.updatedAt = 'just now';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$.value[0],
        processService.patchBatchById(_mockBatch._id, _updatedMockBatch)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.updatedAt).toMatch('just now');
        expect(fromResponse.updatedAt).toMatch('just now');
        done();
      });

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_updatedMockBatch);
    }); // end 'should update batch by its id' test

    test('should update a step of a batch', done => {
      const _mockBatch = mockBatch();
      const _updatedMockBatch = mockBatch();
      const _updatedStep = mockProcessSchedule()[_mockBatch.currentStep];
      _updatedStep.name = 'new name';
      _updatedMockBatch.schedule[_mockBatch.currentStep] = _updatedStep;

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      combineLatest(
        processService.activeBatchList$.value[0],
        processService.patchStepById(_mockBatch._id, _updatedStep._id, _updatedStep)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.schedule[_mockBatch.currentStep].name).toMatch(_updatedStep.name);
        expect(fromResponse.name).toMatch(_updatedStep.name);
        done();
      });

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}/step/${_updatedStep._id}`);
      expect(patchReq.request.method).toMatch('PATCH');
      patchReq.flush(_updatedMockBatch);
    }); // end 'should update step of a batch' test

    test('should start a new batch', done => {
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
    }); // end 'should start a new batch'

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

    test('should remove a batch from the list', done => {
      const _mockBatch = mockBatch();
      const _deleteMockBatch = mockBatch();
      _deleteMockBatch._id = 'delete this';

      processService.activeBatchList$.next([
        new BehaviorSubject<Batch>(_mockBatch),
        new BehaviorSubject<Batch>(_deleteMockBatch),
        new BehaviorSubject<Batch>(_mockBatch)
      ]);

      processService.activeBatchList$
        .skip(1)
        .subscribe(batchList => {
          expect(batchList.length).toBe(2);
          done();
        });

      processService.removeBatchFromList(_deleteMockBatch);
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

  }); // end 'Utility methods' section

});
