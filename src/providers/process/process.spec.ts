/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicStorageModule } from '@ionic/storage';
import { Events, Platform } from 'ionic-angular';
import { Network } from '@ionic-native/network/ngx';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { combineLatest } from 'rxjs/observable/combineLatest';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockProcessSchedule } from '../../../test-config/mockmodels/mockProcessSchedule';
import { mockBatch } from '../../../test-config/mockmodels/mockBatch';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { PlatformMockDev } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';

/* Provider imports */
import { ProcessProvider } from './process';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';
import { UserProvider } from '../user/user';
import { RecipeProvider } from '../recipe/recipe';
import { PreferencesProvider } from '../preferences/preferences';


describe('Process Service', () => {
  let injector: TestBed;
  let processService: ProcessProvider;
  let connectionService: ConnectionProvider;
  let httpMock: HttpTestingController;
  let userService: UserProvider;
  configureTestBed();

  beforeAll(async(() => {
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
        PreferencesProvider,
        Events,
        { provide: Network, useValue: {} },
        { provide: Platform, useClass: PlatformMockDev }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    processService = injector.get(ProcessProvider);
    connectionService = injector.get(ConnectionProvider);
    httpMock = injector.get(HttpTestingController);
    userService = injector.get(UserProvider);
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

    test('should end a batch [offline]', done => {
      connectionService.connection = false;
      const _mockBatch = mockBatch();

      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);

      combineLatest(
        processService.activeBatchList$,
        processService.endBatchById(_mockBatch._id)
      ).subscribe(([fromSubject, fromResponse]) => {
        expect(fromSubject.length).toBe(0);
        expect(fromResponse).toBeNull();
        done();
      });
    }); // end 'should end a batch [offline]' test

    test('should fail to end a batch due to error response', done => {
      connectionService.connection = true;

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

      const endReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/batchId`);
      expect(endReq.request.method).toMatch('DELETE');
      endReq.flush(null, mockErrorResponse(400, 'Bad request'));
    }); // end 'should fail to end a batch due to error response' test

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

    test('should increment the batch\'s current step [offline]', done => {
      connectionService.connection = false;
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
    }); // end 'should increment the batch\'s current step [offline]' test

    test('should end the batch when incrementing from final step', done => {
      const _mockBatch = mockBatch();
      connectionService.connection = false;
      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);
      // _mockBatch.currentStep = _mockBatch.schedule.length - 1;

      processService.incrementCurrentStep(_mockBatch, -1)
        .subscribe((response: Batch) => {
          expect(response).toBeNull();
          done();
        });
    }); // end 'should end the batch when incrementing from final step' test

    test('should fail to increment step due to missing id', done => {
      const _mockBatch = mockBatch();
      processService.activeBatchList$.next([]);
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
    }); // end 'should fail to increment step due to missing id' test

    test('should fail to increment step due to error response', done => {
      const _mockBatch = mockBatch();
      connectionService.connection = true;
      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);

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

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      patchReq.flush(null, mockErrorResponse(404, 'Batch not found'));
    }); // end 'should fail to increment step due to error response' test

    test('should initialize the active batch list [online]', done => {
      connectionService.connection = true;
      expect(processService.activeBatchList$.value.length).toBe(0);
      const storeSpy = jest.spyOn(processService, 'updateStorage');
      processService.storageService.getBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable(''));

      processService.activeBatchList$
        .skip(1)
        .subscribe(batchList => {
          setTimeout(() => {
            expect(batchList.length).toBe(3);
            expect(storeSpy).toHaveBeenCalled();
            done();
          }, 10);
        });

      processService.initializeActiveBatchList();

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush([mockBatch(), mockBatch(), mockBatch()]);
    }); // end 'should initialize the active batch list [online]' test

    test('should fail to initialize active batches due to error response', done => {
      connectionService.connection = true;
      const consoleSpy = jest.spyOn(console, 'log');

      processService.initializeActiveBatchList();

      setTimeout(() => {
        console.log('CALLS');
        console.log(consoleSpy.mock.calls.length);
        expect(consoleSpy.mock.calls[0][0]).toMatch('');
        done();
      }, 10);

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress`);
      getReq.flush(null, mockErrorResponse(500, 'Server error'));
    }); // end 'should fail to initialize active batches due to error response' test

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

    test('should update step of a batch [offline]', done => {
      connectionService.connection = false;
      const _mockBatch = mockBatch();
      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);
      const stepToUpdate = _mockBatch.schedule[0];
      stepToUpdate.description = 'updated description';

      processService.patchBatchStepById(_mockBatch, stepToUpdate._id, stepToUpdate)
        .subscribe((batch: Batch) => {
          expect(batch.schedule[0].description).toMatch('updated description');
          done();
        });
    }); // end 'should update step of a batch [offline]' test

    test('should fail to update a step due to error response', done => {
      const _mockBatch = mockBatch();

      connectionService.connection = true;
      processService.updateStepOfBatchInList = jest
        .fn()
        .mockReturnValue(_mockBatch);

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

      const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/in-progress/${_mockBatch._id}`);
      patchReq.flush(null, mockErrorResponse(400, 'Bad request'));
    }); // end 'should fail to update a step due to error response' test

    test('should fail to update a step due to invalid step id', () => {
      const _mockBatch = mockBatch();
      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);

      expect(() => {
        processService.updateStepOfBatchInList(_mockBatch, 'missingId', {})
      })
      .toThrowError('Active batch missing step with id missingId');
    }); // end 'should fail to update a step due to invalid step id' test

    test('should fail to update a step due to thrown error in update', done => {
      const _mockBatch = mockBatch();
      _mockBatch.owner = null;
      processService.activeBatchList$.next([new BehaviorSubject<Batch>(_mockBatch)]);
      processService.patchBatchStepById(_mockBatch, 'stepId', {})
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('Active batch is missing an owner id');
            done();
          }
        );
    }); // end 'should fail to update a step due to thrown error in update' test

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

    test('should start a new batch [offline]', done => {
      connectionService.connection = false;
      const _mockBatch = mockBatch();
      const _mockUser = mockUser();
      userService.user$.next(_mockUser);

      processService.generateBatchFromRecipe = jest
        .fn()
        .mockReturnValue(Observable.of(_mockBatch));

      processService.startNewBatch(_mockUser._id, 'masterId', 'recipeId')
        .subscribe((batch: Batch) => {
          expect(batch).toStrictEqual(_mockBatch);
          done();
        });
    }); // end 'should start a new batch [offline]' test

    test('should fail to start a new batch due to error response', done => {
      connectionService.connection = true;
      processService.startNewBatch('userId', 'masterId', 'recipeId')
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          }, error => {
            expect(error).toMatch('<404> Recipe not found');
            done();
          }
        );

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/process/user/userId/master/masterId/recipe/recipeId`);
      getReq.flush(null, mockErrorResponse(404, 'Recipe not found'));
    }); // end 'should fail to start a new batch due to error response' test

    test('should fail to start a new batch from a public recipe and no internet connection', done => {
      connectionService.connection = false;
      userService.user$.next(mockUser());
      processService.startNewBatch('otherUserId', 'masterId', 'recipeId')
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('Must be connected to internet to use a public recipe');
            done();
          }
        );
    }); // end ('should fail to start a new batch from a public recipe and no internet connection' test

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

    test('should create a batch using a recipe as a template', done => {
      const _mockUser = mockUser();
      const _mockRecipeComplete = mockRecipeComplete();

      processService.recipeService.getRecipeById = jest
        .fn()
        .mockReturnValue(Observable.of(_mockRecipeComplete));

      processService.generateBatchFromRecipe('masterId', _mockRecipeComplete._id, _mockUser._id)
        .subscribe(batch => {
          expect(batch.owner).toMatch(_mockUser._id);
          expect(batch.recipe).toMatch(_mockRecipeComplete._id);
          expect(batch.schedule.length).toBe(_mockRecipeComplete.processSchedule.length);
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

      expect(processService.getActiveBatchById('')).toBeNull();
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

    test('should call to update process storage', () => {
      const _mockBatch = mockBatch();
      processService.activeBatchList$.next(
        [
          new BehaviorSubject<Batch>(_mockBatch),
          new BehaviorSubject<Batch>(_mockBatch)
        ]
      );
      const storageSpy = jest.spyOn(processService.storageService, 'setBatches');
      processService.updateStorage();
      expect(storageSpy).toHaveBeenCalledWith(
        [
          _mockBatch,
          _mockBatch
        ]
      );
    }); // 'should call to update process storage' test

    test('should get an error from storage on update', () => {
      processService.storageService.setBatches = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error message'));

      const consoleSpy = jest.spyOn(console, 'log');

      processService.updateStorage();

      const callCount = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('active batch store error');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error message');
    }); // end 'should get an error from storage on update' test

  }); // end 'Utility methods' section

});
