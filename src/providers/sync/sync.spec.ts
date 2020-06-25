/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { of } from 'rxjs/observable/of';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { HttpErrorResponse } from '@angular/common/http';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { EventsMock } from '../../../test-config/mocks-ionic';

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
    const storageSpy = jest.spyOn(storage, 'removeSyncFlags');

    syncService.syncFlags = [{ method: 'create', docId: '', docType: 'recipe' }];

    syncService.clearSyncData();

    expect(syncService.syncFlags.length).toBe(0);
    expect(storageSpy).toHaveBeenCalled();
  }); // end 'should clear sync flags' test

  test('should get all sync flags', () => {
    const flags = [
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' }
    ]
    syncService.syncFlags = flags;

    const gotFlags = syncService.getAllSyncFlags();

    expect(gotFlags.length).toBe(2);
    expect(gotFlags[1]).toStrictEqual(flags[1]);
  }); // end 'should get all sync flags' test

  test('should get only flags of a given doc type', () => {
    const flags = [
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' },
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' },
      { method: 'update', docId: 'id', docType: 'recipe' },
      { method: 'create', docId: 'id', docType: 'batch' },
      { method: 'update', docId: 'id', docType: 'recipe' }
    ]
    syncService.syncFlags = flags;

    const recipeFlags = syncService.getSyncFlagsByType('recipe');
    const batchFlags = syncService.getSyncFlagsByType('batch');

    expect(recipeFlags.length).toBe(4);
    expect(recipeFlags[1]).toStrictEqual(flags[2]);
    expect(batchFlags.length).toBe(3);
    expect(batchFlags[1]).toStrictEqual(flags[3]);
  }); // end 'should get only flags of a given doc type' test

  test('should handle adding a create sync flag', () => {
    syncService.syncFlags = [];

    syncService.updateStorage = jest
      .fn();

    const storageSpy = jest.spyOn(syncService, 'updateStorage');

    syncService.addSyncFlag({ method: 'create', docId: 'id', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(1);
    expect(syncService.syncFlags[0].docId).toMatch('id');
    expect(storageSpy).toHaveBeenCalled();
  }); // end 'should add a create sync flag' test

  test('should handle adding an update flag', () => {
    syncService.syncFlags = [];

    syncService.updateStorage = jest
      .fn();

    const storageSpy = jest.spyOn(syncService, 'updateStorage');

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

    const storageSpy = jest.spyOn(syncService, 'updateStorage');

    syncService.syncFlags = [
      { method: 'create', docId: 'createId', docType: 'recipe' },
      { method: 'update', docId: 'updateId', docType: 'recipe' }
    ];

    syncService.addSyncFlag({ method: 'delete', docId: 'id', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(3);
    expect(syncService.syncFlags[2].docId).toMatch('id');

    syncService.addSyncFlag({ method: 'delete', docId: 'createId', docType: 'recipe' });

    expect(syncService.syncFlags.length).toBe(2);
    expect(syncService.syncFlags[0].docId).not.toMatch('createId');

    syncService.addSyncFlag({ method: 'delete', docId: 'updateId', docType: 'recipe' });

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
      .subscribe(response => {
        expect(response['isDeleted']).toBe(true);
        done();
      });

    const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/delete-route`);
    deleteReq.flush({isDeleted: true});
  }); // end 'should make a sync delete http request test

  test('should catch a response error and return an observable of the error on sync delete http request', done => {
    syncService.deleteSync('delete-route')
      .subscribe(response => {
        expect(response instanceof HttpErrorResponse).toBe(true);
        expect(response['status']).toBe(404);
        done();
      });

    const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/delete-route`);
    deleteReq.flush(null, mockErrorResponse(404, 'Not found'));
  }); // end 'should catch a response error and return an observable of the error on sync delete http request' test

  test('should make a sync patch http request', done => {
    const _mockRecipeMasterActive = mockRecipeMasterActive();
    syncService.patchSync('patch-route', _mockRecipeMasterActive)
      .subscribe(response => {
        expect(response).toStrictEqual(_mockRecipeMasterActive);
        done();
      });

    const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/patch-route`);
    patchReq.flush(_mockRecipeMasterActive);
  }); // end 'should make a sync patch http request' test

  test('should catch a response error and return an observable of the error on sync patch http request', done => {
    const _mockRecipeMasterActive = mockRecipeMasterActive();
    syncService.patchSync('patch-route', _mockRecipeMasterActive)
      .subscribe(response => {
        expect(response instanceof HttpErrorResponse).toBe(true);
        expect(response['status']).toBe(400);
        done();
      });

    const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/patch-route`);
    patchReq.flush(null, mockErrorResponse(400, 'Bad request'));
  }); // end 'should catch a response error and return an observable of the error on sync patch http request' test

  test('should make a sync post http request', done => {
    const _mockRecipeMasterActive = mockRecipeMasterActive();
    syncService.postSync('post-route', _mockRecipeMasterActive)
      .subscribe(response => {
        expect(response).toStrictEqual(_mockRecipeMasterActive);
        done();
      });

    const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/post-route`);
    postReq.flush(_mockRecipeMasterActive);
  }); // end 'should make a sync post http request' test

  test('should catch a response error and return an observable of the error on sync post http request', done => {
    const _mockRecipeMasterActive = mockRecipeMasterActive();

    syncService.postSync('post-route', _mockRecipeMasterActive)
      .subscribe(response => {
        expect(response instanceof HttpErrorResponse).toBe(true);
        expect(response['status']).toBe(500);
        done();
      });

    const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/post-route`);
    postReq.flush(null, mockErrorResponse(500, 'Internal server error'));
  }); // end 'should catch a response error and return an observable of the error on sync post http request' test

  test('should process sync response errors', () => {
    const _mockErrorNoStatus = mockErrorResponse(null, 'Unknown');
    const _mockErrorWithAdditional = mockErrorResponse(
      400,
      'Bad request',
      {
        name: 'ValidationError',
        message: 'Duplicate key error'
      }
    );

    const errorData = [
      mockErrorResponse(400, 'Bad request'),
      mockErrorResponse(404, 'Not found'),
      new Error('Other error'),
      _mockErrorNoStatus,
      _mockErrorWithAdditional
    ];

    const errors = syncService.processSyncErrors(errorData);
    expect(errors[0]).toMatch('<400> Bad request');
    expect(errors[1]).toMatch('<404> Not found');
    expect(errors[2]).toMatch('Other error');
    expect(errors[3]).toMatch('<503> Service unavailable');
    expect(errors[4]).toMatch('<400> Bad request: Duplicate key error');
  }); // end 'should process sync response errors' test

  test('should process sync requests', done => {
    const _mockCreateSync = mockRecipeMasterInactive();
    const _mockUpdateSync = mockRecipeMasterInactive();

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

    const requests = [
      syncService.postSync('post-route', _mockCreateSync),
      syncService.patchSync('patch-route', _mockUpdateSync),
      syncService.deleteSync('error-route')
    ];

    syncService.sync('recipe', requests)
      .subscribe(responses => {
        expect(syncService.syncFlags.length).toBe(1);
        expect(responses.successes.length).toBe(2);
        expect(responses.successes[0]).toStrictEqual(_mockCreateSync);
        expect(responses.errors.length).toBe(1);
        expect(responses.errors[0]).toMatch('<503> Service unavailable');
        done();
      });
  }); // end 'should process sync requests' test

  test('should update sync flag storage', () => {
    storage.setSyncFlags = jest
      .fn()
      .mockReturnValue(of({}));

    const storageSpy = jest.spyOn(storage, 'setSyncFlags');

    const flags = [
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

    const consoleSpy = jest.spyOn(console, 'log');

    syncService.updateStorage();

    const callCount = consoleSpy.mock.calls.length;
    expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('Sync flag store error');
    expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('new error');
  }); // end 'should get error updating sync flag storage' test

});
