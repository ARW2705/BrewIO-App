/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Events } from 'ionic-angular';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { BASE_URL } from '../../shared/constants/base-url';
import { API_VERSION } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { EventsMock } from '../../../test-config/mocks-ionic';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { SyncData, SyncMetadata, SyncableResponse, SyncResponse } from '../../shared/interfaces/sync';

/* Provider imports */
import { SyncProvider } from './sync';
import { StorageProvider } from '../storage/storage';


describe('Sync Service', () => {
  let injector: TestBed;
  let syncService: SyncProvider;
  let storage: StorageProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        SyncProvider,
        { provide: StorageProvider, useValue: { getSyncFlags: () => of([]) } },
        { provide: Events, useClass: EventsMock }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    syncService = injector.get(SyncProvider);
    storage = injector.get(StorageProvider);
    httpMock = injector.get(HttpTestingController);
    syncService = injector.get(SyncProvider);

    storage.removeSyncFlags = jest
      .fn();
  });

  afterEach(() => {
    httpMock.verify();
  });

  test('should clear sync flags', () => {
    const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'removeSyncFlags');

    syncService.syncFlags = [{ method: 'create', docId: '', docType: 'recipe' }];

    syncService.clearSyncData();

    expect(syncService.syncFlags.length).toEqual(0);
    expect(storageSpy).toHaveBeenCalled();
  }); // end 'should clear sync flags' test

  test('should get all sync flags', () => {
    const flags: SyncMetadata[] = [
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' }
    ]
    syncService.syncFlags = flags;

    const gotFlags: SyncMetadata[] = syncService.getAllSyncFlags();

    expect(gotFlags.length).toBe(2);
    expect(gotFlags[1]).toStrictEqual(flags[1]);
  }); // end 'should get all sync flags' test

  test('should get only flags of a given doc type', () => {
    const flags: SyncMetadata[] = [
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' },
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' },
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' },
      { method: 'update', docId: 'id', docType: 'recipe' }
    ]
    syncService.syncFlags = flags;

    const recipeFlags: SyncMetadata[] = syncService.getSyncFlagsByType('recipe');
    const batchFlags: SyncMetadata[] = syncService.getSyncFlagsByType('batch');

    expect(recipeFlags.length).toBe(4);
    expect(recipeFlags[1]).toStrictEqual(flags[2]);
    expect(batchFlags.length).toBe(3);
    expect(batchFlags[1]).toStrictEqual(flags[3]);
  }); // end 'should get only flags of a given doc type' test

  test('should handle adding a create sync flag', () => {
    syncService.syncFlags = [];

    syncService.updateStorage = jest
      .fn();

    const storageSpy: jest.SpyInstance = jest
      .spyOn(syncService, 'updateStorage');

    syncService.addSyncFlag({ method: 'create', docId: 'id', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(1);
    expect(syncService.syncFlags[0].docId).toMatch('id');
    expect(storageSpy).toHaveBeenCalled();
  }); // end 'should add a create sync flag' test

  test('should handle adding an update flag', () => {
    syncService.syncFlags = [];

    syncService.updateStorage = jest
      .fn();

    const storageSpy: jest.SpyInstance = jest
      .spyOn(syncService, 'updateStorage');

    syncService.addSyncFlag({ method: 'update', docId: 'id', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(1);
    expect(syncService.syncFlags[0].docId).toMatch('id');
    expect(storageSpy).toHaveBeenCalled();

    syncService.addSyncFlag({ method: 'update', docId: 'id', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(1);
    expect(syncService.syncFlags[0].docId).toMatch('id');
    expect(storageSpy).toHaveBeenCalled();
  });

  test('should handle adding a delete flag', () => {
    syncService.updateStorage = jest
      .fn();

    const storageSpy: jest.SpyInstance = jest
      .spyOn(syncService, 'updateStorage');

    syncService.syncFlags = [
      { method: 'create', docId: 'createId', docType: 'recipe' },
      { method: 'update', docId: 'updateId', docType: 'recipe' }
    ];

    syncService
      .addSyncFlag({ method: 'delete', docId: 'id', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(3);
    expect(syncService.syncFlags[2].docId).toMatch('id');

    syncService
      .addSyncFlag({ method: 'delete', docId: 'createId', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(2);
    expect(syncService.syncFlags[0].docId).not.toMatch('createId');

    syncService
      .addSyncFlag({ method: 'delete', docId: 'updateId', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(2);
    expect(syncService.syncFlags[0].method).toMatch('delete');

    expect(() => {
      syncService.addSyncFlag({ method: 'bad flag', docId: '', docType: ''});
    })
    .toThrow('Unknown sync flag method: bad flag');

    expect(storageSpy).toHaveBeenCalled();
  }); //end 'should handle adding a delete flag if no other flags exist for docId' test

  test('should make a sync delete http request', done => {
    syncService.deleteSync('delete-route')
      .subscribe(
        (response: SyncData): void => {
          expect(response.isDeleted).toBe(true);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

    const deleteReq: TestRequest = httpMock
      .expectOne(`${BASE_URL}/${API_VERSION}/delete-route`);
    deleteReq.flush({isDeleted: true});
  }); // end 'should make a sync delete http request test

  test('should catch a response error and return an observable of the error on sync delete http request', done => {
    syncService.deleteSync('delete-route')
      .subscribe(
        (response: HttpErrorResponse): void => {
          expect(response instanceof HttpErrorResponse).toBe(true);
          expect(response['status']).toBe(404);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

    const deleteReq: TestRequest = httpMock
      .expectOne(`${BASE_URL}/${API_VERSION}/delete-route`);
    deleteReq.flush(null, mockErrorResponse(404, 'Not found'));
  }); // end 'should catch a response error and return an observable of the error on sync delete http request' test

  test('should make a sync patch http request', done => {
    const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
    syncService.patchSync('patch-route', _mockRecipeMasterActive)
      .subscribe(
        (response: SyncableResponse): void => {
          expect(response).toStrictEqual(_mockRecipeMasterActive);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

    const patchReq: TestRequest = httpMock
      .expectOne(`${BASE_URL}/${API_VERSION}/patch-route`);
    patchReq.flush(_mockRecipeMasterActive);
  }); // end 'should make a sync patch http request' test

  test('should catch a response error and return an observable of the error on sync patch http request', done => {
    const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
    syncService.patchSync('patch-route', _mockRecipeMasterActive)
      .subscribe(
        (response: HttpErrorResponse): void => {
          expect(response instanceof HttpErrorResponse).toBe(true);
          expect(response['status']).toBe(400);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

    const patchReq: TestRequest = httpMock
      .expectOne(`${BASE_URL}/${API_VERSION}/patch-route`);
    patchReq.flush(null, mockErrorResponse(400, 'Bad request'));
  }); // end 'should catch a response error and return an observable of the error on sync patch http request' test

  test('should make a sync post http request', done => {
    const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
    syncService.postSync('post-route', _mockRecipeMasterActive)
      .subscribe(
        (response: SyncableResponse): void => {
          expect(response).toStrictEqual(_mockRecipeMasterActive);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

    const postReq: TestRequest = httpMock
      .expectOne(`${BASE_URL}/${API_VERSION}/post-route`);
    postReq.flush(_mockRecipeMasterActive);
  }); // end 'should make a sync post http request' test

  test('should catch a response error and return an observable of the error on sync post http request', done => {
    const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

    syncService.postSync('post-route', _mockRecipeMasterActive)
      .subscribe(
        (response: HttpErrorResponse): void => {
          expect(response instanceof HttpErrorResponse).toBe(true);
          expect(response['status']).toBe(500);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

    const postReq: TestRequest = httpMock
      .expectOne(`${BASE_URL}/${API_VERSION}/post-route`);
    postReq.flush(null, mockErrorResponse(500, 'Internal server error'));
  }); // end 'should catch a response error and return an observable of the error on sync post http request' test

  test('should process sync response errors', () => {
    const _mockErrorNoStatus: HttpErrorResponse
      = mockErrorResponse(null, 'Unknown');
    const _mockErrorWithAdditional: HttpErrorResponse
      = mockErrorResponse(
        400,
        'Bad request',
        {
          name: 'ValidationError',
          message: 'Duplicate key error'
        }
      );

    const errorData: (HttpErrorResponse | Error)[] = [
      mockErrorResponse(400, 'Bad request'),
      mockErrorResponse(404, 'Not found'),
      new Error('Other error'),
      _mockErrorNoStatus,
      _mockErrorWithAdditional
    ];

    const errors: string[] = syncService.processSyncErrors(errorData);
    expect(errors[0]).toMatch('<400> Bad request');
    expect(errors[1]).toMatch('<404> Not found');
    expect(errors[2]).toMatch('Other error');
    expect(errors[3]).toMatch('<503> Service unavailable');
    expect(errors[4]).toMatch('<400> Bad request: Duplicate key error');
  }); // end 'should process sync response errors' test

  test('should process sync requests', done => {
    const _mockCreateSync: RecipeMaster = mockRecipeMasterInactive();
    const _mockUpdateSync: RecipeMaster = mockRecipeMasterInactive();

    syncService.syncFlags = [
      { method: 'create', docId: '', docType: 'recipe' },
      { method: 'update', docId: '', docType: 'recipe' },
      { method: 'create', docId: '', docType: 'batch' },
      { method: 'delete', docId: '', docType: 'recipe'}
    ];

    syncService.updateStorage = jest
      .fn();

    syncService.postSync = jest
      .fn()
      .mockReturnValue(of(_mockCreateSync));

    syncService.patchSync = jest
      .fn()
      .mockReturnValue(of(_mockUpdateSync));

    syncService.deleteSync = jest
      .fn()
      .mockReturnValue(of(mockErrorResponse(503, 'Service unavailable')));

    const requests: (
      Observable<SyncData | SyncableResponse | HttpErrorResponse>
    )[] = [
      syncService.postSync('post-route', _mockCreateSync),
      syncService.patchSync('patch-route', _mockUpdateSync),
      syncService.deleteSync('error-route')
    ];

    syncService.sync('recipe', requests)
      .subscribe(
        (responses: SyncResponse): void => {
          expect(syncService.syncFlags.length).toBe(1);
          expect(responses.successes.length).toBe(2);
          expect(responses.successes[0]).toStrictEqual(_mockCreateSync);
          expect(responses.errors.length).toBe(1);
          expect(responses.errors[0]).toMatch('<503> Service unavailable');
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
  }); // end 'should process sync requests' test

  test('should update sync flag storage', () => {
    storage.setSyncFlags = jest
      .fn()
      .mockReturnValue(of({}));

    const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'setSyncFlags');

    const flags: SyncMetadata[] = [
      { method: 'create', docId: 'id', docType: 'recipe' },
      { method: 'update', docId: 'id', docType: 'batch' }
    ];
    syncService.syncFlags = flags;

    syncService.updateStorage();

    expect(storageSpy.mock.calls[0][0][0]).toStrictEqual(flags[0]);
    expect(storageSpy.mock.calls[0][0][1]).toStrictEqual(flags[1]);
  }); // end 'should update sync flag storage' test

  test('should get error updating sync flag storage', () => {
    storage.setSyncFlags = jest
      .fn()
      .mockReturnValue(new ErrorObservable('new error'));

    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    syncService.updateStorage();

    expect(consoleSpy).toHaveBeenCalledWith('Sync flag store error: new error');
  }); // end 'should get error updating sync flag storage' test

  describe('Other', () => {
    let consoleSpy: jest.SpyInstance;

    beforeAll(() => {
      consoleSpy = jest.spyOn(console, 'log');
      storage.getSyncFlags = jest
        .fn()
        .mockReturnValue(new ErrorObservable('sync flag error'));
    });

    test('should get error on init', () => {
      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('Sync error: sync flag error');
    });

  });

});
