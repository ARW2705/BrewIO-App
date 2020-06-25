/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { apiVersion } from '../../shared/constants/api-version';
import { baseURL } from '../../shared/constants/base-url';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock } from '../../../test-config/mocks-ionic';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';
import { mockOtherIngredient } from '../../../test-config/mockmodels/mockOtherIngredient';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockRecipeVariantIncomplete } from '../../../test-config/mockmodels/mockRecipeVariantIncomplete';
import { mockUser } from '../../../test-config/mockmodels/mockUser';

/* Default imports */
import { defaultRecipeMaster } from '../../shared/defaults/default-recipe-master';
import { defaultRecipeVariant } from '../../shared/defaults/default-recipe-variant';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { User } from '../../shared/interfaces/user';

/* Provider imports */
import { RecipeProvider } from './recipe';
import { ClientIdProvider } from '../client-id/client-id';
import { ConnectionProvider } from '../connection/connection';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { SyncProvider } from '../sync/sync';
import { UserProvider } from '../user/user';


describe('Recipe Service', () => {
  let injector: TestBed;
  let recipeService: RecipeProvider;
  let httpMock: HttpTestingController;
  let clientIdService: ClientIdProvider;
  let connectionService: ConnectionProvider;
  let processHttpError: ProcessHttpErrorProvider;
  let storage: StorageProvider;
  let sync: SyncProvider;
  let userService: UserProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        RecipeProvider,
        { provide: Events, useClass: EventsMock },
        { provide: ClientIdProvider, useValue: {} },
        { provide: ConnectionProvider, useValue: {} },
        { provide: ProcessHttpErrorProvider, useValue: {} },
        { provide: StorageProvider, useValue: {} },
        { provide: SyncProvider, useValue: {} },
        { provide: UserProvider, useValue: {} }
      ]
    });
  }));

  beforeEach(() => {
    injector = getTestBed();
    recipeService = injector.get(RecipeProvider);
    httpMock = injector.get(HttpTestingController);
    clientIdService = injector.get(ClientIdProvider);
    connectionService = injector.get(ConnectionProvider);
    processHttpError = injector.get(ProcessHttpErrorProvider);
    storage = injector.get(StorageProvider);
    sync = injector.get(SyncProvider);
    userService = injector.get(UserProvider);

    sync.addSyncFlag = jest.fn();
    storage.setRecipes = jest.fn();
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Public API requests', () => {

    test('should get a recipe master by id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();

      recipeService.getPublicRecipeMasterById(_mockRecipeMasterActive._id)
        .subscribe(recipeMaster => {
          expect(recipeMaster._id).toMatch(_mockRecipeMasterActive._id);
          done();
        });

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/master/${_mockRecipeMasterActive._id}`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(_mockRecipeMasterActive);
    }); // end 'should get a recipe master by id' test

    test('should fail to get a recipe master by user id due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Recipe master not found'));

      recipeService.getPublicRecipeMasterById('masterId')
        .subscribe(
          response => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<404> Recipe master not found');
            done();
          }
        );

      const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/master/masterId`);
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(null, mockErrorResponse(404, 'Recipe master not found'));
    }); // end 'should fail to get a recipe master by user id due to error response' test

    test('should get a list of recipe masters by user id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();

      recipeService.getPublicRecipeMasterListByUser(_mockRecipeMasterActive.owner)
        .subscribe(masterList => {
          expect(masterList.length).toBe(2);
          expect(masterList[0].owner).toMatch(_mockRecipeMasterActive.owner);
          done();
        });

      const masterListReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/${_mockRecipeMasterActive.owner}`);
      expect(masterListReq.request.method).toMatch('GET');
      masterListReq.flush([_mockRecipeMasterActive, mockRecipeMasterInactive()]);
    }); // end 'should get a list of recipe masters by user id' test

    test('should fail to get a list of recipe masters by user id due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      recipeService.getPublicRecipeMasterListByUser('userId')
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<404> User not found');
            done();
          }
        );

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/userId`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(null, mockErrorResponse(404, 'User not found'));
    }); // end 'should fail to get a list of recipe masters by user id due to error response' test

    test('should get a public recipe by id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      recipeService.getPublicRecipeVariantById(_mockRecipeMasterActive._id, _mockRecipeVariantComplete._id)
        .subscribe(recipe => {
          expect(recipe._id).toMatch(_mockRecipeVariantComplete._id);
          done();
        });

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/master/${_mockRecipeMasterActive._id}/variant/${_mockRecipeVariantComplete._id}`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(_mockRecipeVariantComplete);
    }); // end 'should get a public recipe by id' test

    test('should fail to get a public recipe due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Recipe not found'));

      recipeService.getPublicRecipeVariantById('masterId', 'recipeId')
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('<404> Recipe not found');
            done();
          }
        );

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/master/masterId/variant/recipeId`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(null, mockErrorResponse(404, 'Recipe not found'));
    }); // end 'should fail to get a public recipe due to error response' test

  }); // end 'Public API requests' section

  describe('Private API requests', () => {

    describe('DELETE requests', () => {

      beforeEach(() => {
        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()));
        recipeService.addSyncFlag = jest
          .fn();
        recipeService.removeRecipeFromMasterInList = jest
          .fn()
          .mockReturnValue(of(true));
        recipeService.removeRecipeMasterFromList = jest
          .fn()
          .mockReturnValue(of(true));
      });

      test('should delete a recipe variant using its id [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            response => {
              expect(response).toBeDefined();
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            });

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/masterId/variant/variantId`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush({});
      }); // end 'should delete a recipe variant using its id [online]' test

      test('should delete a recipe variant using its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy = jest.spyOn(recipeService, 'addSyncFlag');

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            () => {
              expect(flagSpy).toHaveBeenCalledWith(
                'update',
                'masterId'
              );
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should delete a recipe variant using its id [offline]' test

      test('should fail to delete a recipe variant due to variant count', done => {
        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive()));

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            () => {
              console.log('Should not get a response');
              expect(true).toBe(false);
            },
            error => {
              expect(error).toBeDefined();
              expect(error).toMatch('At least one recipe must remain');
              done();
            }
          );
      }); // end 'should fail to delete a recipe variant due to variant count' test

      test('should fail to delete a recipe variant due to recipe master not found', done => {
        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(undefined);

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            () => {
              console.log('Should not get a response');
              expect(true).toBe(false);
            },
            error => {
              expect(error).toBeDefined();
              expect(error).toMatch('Recipe master with id masterId not found');
              done();
            }
          );
      }); // end 'should fail to delete a recipe variant due to recipe master not found' test

      test('should fail to delete a recipe variant due to error response', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> Recipe with id: recipeId not found'));

        recipeService.deleteRecipeVariantById('masterId', 'recipeId')
          .subscribe(
            () => {
              console.log('Should not get a response');
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<404> Recipe with id: recipeId not found');
              done();
            }
          );

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/masterId/variant/recipeId`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush(null, mockErrorResponse(404, 'Recipe with id: recipeId not found'));
      }); // end 'should fail to delete a recipe variant due to error response' test

      test('should delete a recipe master using its id [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        recipeService.deleteRecipeMasterById('masterId')
          .subscribe(
            response => {
              expect(response).toBeDefined();
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/masterId`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush({});
      }); // end 'should delete a recipe master using its id [online]' test

      test('should delete a recipe master using its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy = jest.spyOn(recipeService, 'addSyncFlag');

        recipeService.deleteRecipeMasterById('masterId')
          .subscribe(
            response => {
              expect(response).toBeDefined();
              expect(flagSpy).toHaveBeenCalledWith(
                'delete',
                'masterId'
              );
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should delete a recipe master using its id [offline]' test

      test('should fail to delete a recipe master due to error response', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> Recipe master with id: masterId not found'));

        recipeService.deleteRecipeMasterById('masterId')
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<404> Recipe master with id: masterId not found');
              done();
            }
          );

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/masterId`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush(null, mockErrorResponse(404, 'Recipe master with id: masterId not found'));
      }); // end 'should fail to delete a recipe master due to error response' test

    }); // end 'DELETE requests' section

    describe('GET requests', () => {

      test('should get recipe master list [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        storage.getRecipes = jest
          .fn()
          .mockReturnValue(of([]));

        recipeService.syncOnConnection = jest
          .fn()
          .mockReturnValue(of());

        recipeService.mapRecipeMasterArrayToSubjects = jest
          .fn();

        recipeService.updateRecipeStorage = jest
          .fn();

        const storageSpy = jest.spyOn(storage, 'getRecipes');
        const mapSpy = jest.spyOn(recipeService, 'mapRecipeMasterArrayToSubjects');

        recipeService.initializeRecipeMasterList();

        setTimeout(() => {
          expect(storageSpy).toHaveBeenCalled();
          expect(mapSpy.mock.calls[0][0].length).toBe(2);
          done();
        }, 10);

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private`);
        expect(getReq.request.method).toMatch('GET');
        getReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
      }); // end 'should get recipe master list [online]' test

      test('should get recipe master list [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        storage.getRecipes = jest
          .fn()
          .mockReturnValue(of([mockRecipeMasterActive(), mockRecipeMasterActive()]));

        recipeService.mapRecipeMasterArrayToSubjects = jest
          .fn();

        const mapSpy = jest.spyOn(recipeService, 'mapRecipeMasterArrayToSubjects');

        recipeService.initializeRecipeMasterList();
        setTimeout(() => {
          expect(mapSpy.mock.calls[0][0].length).toBe(2);
          done();
        }, 10);
      }); // end 'should get recipe master list [offline]' test

      test('should fail to get recipe master list due to error response', () => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        recipeService.syncOnConnection = jest
          .fn()
          .mockReturnValue(of());

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> User not found'));

        const consoleSpy = jest.spyOn(console, 'log');

        recipeService.initializeRecipeMasterList();

        setTimeout(() => {
          expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 2][0]).toMatch('<404> User not found');
        }, 10);

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private`);
        expect(getReq.request.method).toMatch('GET');
        getReq.flush(null, mockErrorResponse(404, 'User not found'));
      }); // end 'should fail to get recipe master list due to error response' test

      test('should fail to get recipe master list from storage', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        storage.getRecipes = jest
          .fn()
          .mockReturnValue(new ErrorObservable('Recipe list not found'));

        const consoleSpy = jest.spyOn(console, 'log');

        recipeService.initializeRecipeMasterList();

        setTimeout(() => {
          expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0]).toMatch('Recipe list not found: awaiting data from server');
          done();
        }, 10);
      }); // end 'should fail to get recipe master list from storage' test

    }); // end 'GET requests' section

    describe('PATCH requests', () => {

      beforeEach(() => {
        recipeService.addSyncFlag = jest
          .fn();
        recipeService.recipeMasterList$.next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);
      });

      afterEach(() => {
        recipeService.recipeMasterList$.value.forEach(recipe$ => {
          recipe$.complete();
        });
      });

      test('should update a recipe master by its id [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const updateToApply = {name: 'new-name'};
        const _mockUpdateApplied = mockRecipeMasterActive();
        _mockUpdateApplied.name = updateToApply.name;

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockUpdateApplied));

        recipeService.updateRecipeMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockUpdateApplied));

        recipeService.patchRecipeMasterById(_mockUpdateApplied.cid, updateToApply)
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockUpdateApplied);
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );

        const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockUpdateApplied._id}`);
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(_mockUpdateApplied);
      }); // end 'should update a recipe master by its id [online]' test

      test('should update a recipe master by its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const updateToApply = {name: 'new-name'};
        const _mockUpdateApplied = mockRecipeMasterActive();
        _mockUpdateApplied.name = updateToApply.name;

        recipeService.updateRecipeMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockUpdateApplied));

        const flagSpy = jest.spyOn(recipeService, 'addSyncFlag');

        recipeService.patchRecipeMasterById(_mockUpdateApplied._id, updateToApply)
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockUpdateApplied);
              expect(flagSpy).toHaveBeenCalledWith(
                'update',
                _mockUpdateApplied._id
              );
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should update a recipe master by its id [offline]' test

      test('should fail to update a recipe master due to error response', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> Error message'));

        const _mockRecipeMasterActive = mockRecipeMasterActive();

        recipeService.patchRecipeMasterById(_mockRecipeMasterActive._id, {})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<404> Error message');
              done();
            }
          );

        const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}`);
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(null, mockErrorResponse(404, 'Error message'));
      }); //  end 'should fail to update a recipe master due to error response' test

      test('should fail to update a recipe master due to missing recipe master', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(undefined);

        recipeService.patchRecipeMasterById('0000000000000', {})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('Recipe with id: 0000000000000 not found');
              done();
            }
          );
      }); // end 'should fail to update a recipe master due to missing recipe master' test

      test('should fail to update a recipe master due to recipe master missing an _id', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        _mockRecipeMasterInactive._id = undefined;

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive));

        // recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)]);

        recipeService.patchRecipeMasterById(_mockRecipeMasterInactive.cid, {})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch(`Found recipe with id: ${_mockRecipeMasterInactive.cid}, but unable to perform request at this time`);
              done();
            }
          );
      }); // end 'should fail to update a recipe master due to recipe master missing an _id' test

      test('should update a recipe variant by its id [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeVariantComplete = mockRecipeVariantComplete();
        const _copyMockRecipeComplete = mockRecipeVariantComplete();
        const updateToApply = _copyMockRecipeComplete;
        updateToApply.variantName = 'new-name';
        const _mockUpdateApplied = _copyMockRecipeComplete;
        _mockUpdateApplied.variantName = updateToApply.variantName;

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive));

        recipeService.updateRecipeOfMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockUpdateApplied));

        recipeService.patchRecipeVariantById(_mockRecipeMasterActive._id, _mockRecipeVariantComplete._id, updateToApply)
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockUpdateApplied);
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );

        const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}/variant/${_mockRecipeVariantComplete._id}`);
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(_mockUpdateApplied);
      }); // end 'should update a recipe variant by its id [online]' test

      test('should update a recipe variant by its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy = jest.spyOn(recipeService, 'addSyncFlag');

        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeVariantComplete = mockRecipeVariantComplete();
        const updateToApply = mockRecipeVariantComplete();
        updateToApply.variantName = 'new-name';

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive));

        recipeService.updateRecipeOfMasterInList = jest
          .fn()
          .mockReturnValue(of(updateToApply));

        recipeService.patchRecipeVariantById(_mockRecipeMasterActive._id, _mockRecipeVariantComplete._id, updateToApply)
          .subscribe(
            response => {
              expect(response).toStrictEqual(updateToApply);
              expect(flagSpy).toHaveBeenCalledWith(
                'update',
                _mockRecipeMasterActive._id
              );
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should update a recipe variant by its id [offline]' test

      test('should fail to update a recipe variant due to error response', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const _mockRecipeMasterActive = mockRecipeMasterActive();

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive));

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> Error message'));

        recipeService.patchRecipeVariantById(_mockRecipeMasterActive._id, 'recipeId', {})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<404> Error message');
              done();
            }
          );

        const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}/variant/recipeId`);
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(null, mockErrorResponse(404, 'Error message'));
      }); // end 'should fail to update a recipe variant due to error response' test

      test('should fail to change a recipe variant\'s isMaster property to false due to recipe count', done => {
        const _mockRecipeMasterInactive = mockRecipeMasterInactive();

        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive));

        recipeService.patchRecipeVariantById(_mockRecipeMasterInactive._id, mockRecipeVariantComplete()._id, { isMaster: false })
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toBeDefined();
              expect(error).toMatch('At least one recipe is required to be set as master');
              done();
            }
          );
      }); // end 'should fail to change a recipe variant\'s isMaster property to false due to recipe count' test

      test('should fail to update recipe variant due to recipe master not found', done => {
        recipeService.getMasterById = jest
          .fn()
          .mockReturnValue(undefined);

        recipeService.patchRecipeVariantById('masterId', 'variantId', {})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toBeDefined();
              expect(error).toMatch(`Recipe master with id masterId not found`);
              done();
            }
          );
      }); // end 'should fail to update recipe variant due to recipe master not found' test

    }); // end 'PATCH requests' section

    describe('POST requests', () => {

      beforeEach(() => {
        recipeService.recipeMasterList$.next([]);
        recipeService.addSyncFlag = jest
          .fn();
        recipeService.updateRecipeStorage = jest
          .fn();
      });

      afterEach(() => {
        recipeService.recipeMasterList$.value.forEach(recipe$ => {
          recipe$.complete();
        });
      });

      test('should post a new recipe master [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const _mockRecipeMasterInactive = mockRecipeMasterInactive();

        recipeService.formatNewRecipeMaster = jest
          .fn()
          .mockReturnValue(_mockRecipeMasterInactive);

        recipeService.postRecipeMaster({})
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockRecipeMasterInactive);
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeMasterInactive);
      }); // end 'should post a new recipe master [online]' test

      test('should post a new recipe master [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy = jest.spyOn(recipeService, 'addSyncFlag');

        const _mockRecipeMasterInactive = mockRecipeMasterInactive();

        recipeService.formatNewRecipeMaster = jest
          .fn()
          .mockReturnValue(_mockRecipeMasterInactive);

        recipeService.postRecipeMaster({})
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockRecipeMasterInactive);
              expect(flagSpy).toHaveBeenCalledWith(
                'create',
                _mockRecipeMasterInactive.cid
              );
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should post a new recipe master [offline]' test

      test('should fail to post a new recipe master due to format error', done => {
        recipeService.formatNewRecipeMaster = jest
          .fn()
          .mockImplementation(() => {
            throw new Error('Client Validation Error: Missing User ID');
          });

        recipeService.postRecipeMaster({})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('Client Validation Error: Missing User ID');
              done();
            }
          );
      }); // end 'should fail to post a new recipe master due to format error' test

      test('should fail to post a new recipe master due to error response', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        recipeService.formatNewRecipeMaster = jest
          .fn()
          .mockReturnValue(mockRecipeMasterInactive());

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> User with id userid not found'));

        recipeService.postRecipeMaster({})
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch(`<404> User with id userid not found`)
              done();
            }
          );

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(null, mockErrorResponse(404, 'User with id userid not found'));
      }); // end 'should fail to post a new recipe master due to error response' test

      test('should post a new recipe to a recipe master [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        const _mockRecipeVariantIncomplete = mockRecipeVariantIncomplete();

        recipeService.addRecipeVariantToMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockRecipeVariantIncomplete));

        recipeService.postRecipeToMasterById(_mockRecipeMasterInactive._id, _mockRecipeVariantIncomplete)
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockRecipeVariantIncomplete);
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterInactive._id}`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeVariantIncomplete);
      }); // end 'should post a new recipe to a recipe master [online]' test

      test('should post a new recipe variant to a recipe master [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy = jest.spyOn(recipeService, 'addSyncFlag');

        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        const _mockRecipeVariantIncomplete = mockRecipeVariantIncomplete();

        recipeService.addRecipeVariantToMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockRecipeVariantIncomplete));

        recipeService.postRecipeToMasterById(_mockRecipeMasterInactive._id, _mockRecipeVariantIncomplete)
          .subscribe(
            response => {
              expect(response).toStrictEqual(_mockRecipeVariantIncomplete);
              expect(flagSpy).toHaveBeenCalledWith(
                'update',
                _mockRecipeMasterInactive._id
              );
              done();
            },
            error => {
              console.log(error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should post a new recipe variant to a recipe master [offline]' test

      test('should get error response when posting a recipe to a recipe master', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> Recipe Master with id: missingId not found'));

        recipeService.postRecipeToMasterById('missingId', mockRecipeVariantComplete())
          .subscribe(
            response => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            error => {
              expect(error).toMatch('<404> Recipe Master with id: missingId not found');
              done();
            }
          );

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/missingId`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(null, mockErrorResponse(404, 'Recipe Master with id: missingId not found'));
      }); // end 'should get error response when posting a recipe to a recipe master' test

    }); // end 'POST requests' section

  }); // end 'Private API requests' section


  describe('Sync handling', () => {

    beforeEach(() => {
      this.syncErrors = [];
    });

    test('should add a sync flag', () => {
      sync.addSyncFlag = jest
        .fn();

      const flagSpy = jest.spyOn(sync, 'addSyncFlag');

      recipeService.addSyncFlag('create', 'id');

      expect(flagSpy).toHaveBeenCalledWith({
        method: 'create',
        docId: 'id',
        docType: 'recipe'
      });
    }); // end 'should add a sync flag' test

    test('should dimiss all sync errors', () => {
      recipeService.syncErrors = ['', '', ''];

      recipeService.dismissAllErrors();

      expect(recipeService.syncErrors.length).toBe(0);
    }); // end 'should dimiss all sync errors' test

    test('should dimiss sync error at index', () => {
      recipeService.syncErrors = ['1', '2', '3'];

      recipeService.dismissError(1);

      expect(recipeService.syncErrors.length).toBe(2);
      expect(recipeService.syncErrors[1]).toMatch('3');
    }); // end 'should dimiss sync error at index' test

    test('should throw error with invalid index', () => {
      recipeService.syncErrors = ['1', '2', '3'];
      expect(() => {
        recipeService.dismissError(3);
      })
      .toThrow('Invalid sync error index');

      expect(() => {
        recipeService.dismissError(-1);
      })
      .toThrow('Invalid sync error index');
    }); // end 'should throw error with invalid index' test

    test('should get array of recipe masters that are flagged for sync', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      sync.getAllSyncFlags = jest
        .fn()
        .mockReturnValue([{
          method: 'update',
          docId: _mockRecipeMasterActive._id,
          docType: 'recipe'
        }]);

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
      ]);

      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>(
            [
              new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
              new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
            ]
          )
        );

      const flagged = recipeService.getFlaggedRecipeMasters();

      expect(flagged.length).toBe(1);
      expect(flagged[0].value._id).toMatch(_mockRecipeMasterActive._id);
    }); // end 'should get array of recipe masters that are flagged for sync' test

    test('should process sync success responses', () => {
      recipeService.removeRecipeMasterFromList = jest
        .fn();

      const removeSpy = jest.spyOn(recipeService, 'removeRecipeMasterFromList');

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      _mockRecipeMasterActive._id = undefined;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
      ]);

      recipeService.getMasterById = jest
        .fn()
        .mockReturnValue(recipeService.recipeMasterList$.value[0]);

      _mockRecipeMasterActive._id = 'active'
      recipeService.processSyncSuccess([
        _mockRecipeMasterActive,
        { isDeleted: true, data: {_id: 'deletionId'} }
      ]);

      expect(recipeService.recipeMasterList$.value[0].value._id).toMatch('active');
      expect(removeSpy).toHaveBeenCalledWith('deletionId');
    }); // end 'should process a sync success response' test

    test('should set sync error if missing recipe master', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      _mockRecipeMasterActive._id = undefined;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
      ]);

      recipeService.getMasterById = jest
        .fn()
        .mockReturnValueOnce(recipeService.recipeMasterList$.value[0])
        .mockReturnValueOnce(undefined);

      _mockRecipeMasterActive._id = 'active'
      recipeService.processSyncSuccess([
        _mockRecipeMasterActive,
        { cid: 'missing' }
      ]);

      expect(recipeService.recipeMasterList$.value[0].value._id).toMatch('active');
      expect(recipeService.syncErrors[0]).toMatch('Recipe with id: \'missing\' not found');
    }); // end 'should set sync error if missing recipe master' test

    test('should handle sync requests on connection', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);

      recipeService.processSyncSuccess = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      sync.postSync = jest
        .fn();

      sync.patchSync = jest
        .fn();

      sync.deleteSync = jest
        .fn();

      const successSpy = jest.spyOn(recipeService, 'processSyncSuccess');
      const storageSpy = jest.spyOn(recipeService, 'updateRecipeStorage');

      const _mockOfflineSync = mockRecipeMasterInactive();
      _mockOfflineSync._id = undefined;
      const _mockOnlineSync = mockRecipeMasterInactive();
      _mockOnlineSync.name = 'updated';
      const _mockDeleteSync = mockRecipeMasterInactive();
      _mockDeleteSync._id = 'delete';
      const _mockMissingId = mockRecipeMasterInactive();
      _mockMissingId._id = undefined;
      _mockMissingId.cid = '21098765431';

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive),
        new BehaviorSubject<RecipeMaster>(_mockOfflineSync),
        new BehaviorSubject<RecipeMaster>(_mockOnlineSync),
        new BehaviorSubject<RecipeMaster>(_mockDeleteSync),
        new BehaviorSubject<RecipeMaster>(_mockMissingId)
      ]);

      _mockOfflineSync._id = 'inactive';
      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockRecipeMasterInactive,
            _mockRecipeMasterInactive,
            _mockOnlineSync,
            { isDeleted: true }
          ],
          errors: [
            'Recipe master with id \'missing\' not found',
            'Unknown sync flag method \'bad flag\'',
            `Recipe with id: ${_mockMissingId.cid} is missing its server id`
          ]
        }));

      sync.getSyncFlagsByType = jest
        .fn()
        .mockReturnValue([
          {
            method: 'create',
            docId: 'missing',
            docType: 'recipe'
          },
          {
            method: 'create',
            docId: _mockOfflineSync.cid,
            docType: 'recipe'
          },
          {
            method: 'update',
            docId: _mockOfflineSync.cid,
            docType: 'recipe'
          },
          {
            method: 'update',
            docId: _mockOnlineSync._id,
            docType: 'recipe'
          },
          {
            method: 'delete',
            docId: _mockDeleteSync._id,
            docType: 'recipe'
          },
          {
            method: 'bad flag',
            docId: '',
            docType: 'recipe'
          },
          {
            method: 'update',
            docId: _mockMissingId.cid,
            docType: 'recipe'
          }
        ]);

      recipeService.syncOnConnection(false)
        .subscribe(() => {});

      setTimeout(() => {
        expect(successSpy.mock.calls[0][0].length).toBe(4);
        expect(successSpy.mock.calls[0][0][0]).toStrictEqual(_mockRecipeMasterInactive);
        expect(successSpy.mock.calls[0][0][1]).toStrictEqual(_mockRecipeMasterInactive);
        expect(successSpy.mock.calls[0][0][2]).toStrictEqual(_mockOnlineSync);
        expect(successSpy.mock.calls[0][0][3]).toStrictEqual({ isDeleted: true });
        expect(recipeService.syncErrors.length).toBe(3);
        expect(recipeService.syncErrors[0]).toMatch('Recipe master with id \'missing\' not found');
        expect(recipeService.syncErrors[1]).toMatch('Unknown sync flag method \'bad flag\'');
        expect(recipeService.syncErrors[2]).toMatch(`Recipe with id: ${_mockMissingId.cid} is missing its server id`);
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync requests on connection' test

    test('should not perform a sync on connection if not logged in', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      recipeService.syncOnConnection(false)
        .subscribe(response => {
          expect(response).toBe(false);
          done();
        });
    }); // end 'should not perform a sync on connection if not logged in' test

    test('should call connection sync on reconnect', () => {
      recipeService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of());

      const syncSpy = jest.spyOn(recipeService, 'syncOnConnection');

      recipeService.syncOnReconnect();

      expect(syncSpy).toHaveBeenCalledWith(false);
    }); // end 'should call connection sync on reconnect' test

    test('should get error response after calling connection sync on reconnect', done => {
      recipeService.syncOnConnection = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Error syncing on reconnect'));

      const consoleSpy = jest.spyOn(console, 'log');

      recipeService.syncOnReconnect();

      setTimeout(() => {
        const consoleCount = consoleSpy.mock.calls.length;
        expect(consoleSpy.mock.calls[consoleCount - 1][0]).toMatch('Error syncing on reconnect');
        done();
      }, 10);
    }); // end 'should get error response after calling connection sync on reconnect' test

    test('should handle sync on signup', done => {
      recipeService.processSyncSuccess = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      sync.postSync = jest
        .fn();

      const _mockSync = mockRecipeMasterInactive();
      _mockSync._id = undefined;
      const _mockRecipeMasterResponse = mockRecipeMasterInactive();

      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>(
            [ new BehaviorSubject<RecipeMaster>(_mockSync) ]
          )
        );

      sync.sync = jest
        .fn()
        .mockReturnValue(of(
          {
            successes: [ _mockRecipeMasterResponse ],
            errors: []
          }
        ));

      const successSpy = jest.spyOn(recipeService, 'processSyncSuccess');
      const storageSpy = jest.spyOn(recipeService, 'updateRecipeStorage');

      recipeService.syncOnSignup();

      setTimeout(() => {
        expect(successSpy.mock.calls[0][0][0]).toStrictEqual(_mockRecipeMasterResponse);
        expect(recipeService.syncErrors.length).toBe(0);
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync on signup' test

  }); // end 'Sync handling' section


  describe('In memory actions', () => {

    beforeEach(() => {
      recipeService.recipeMasterList$.next([]);
    });

    afterEach(() => {
      recipeService.recipeMasterList$.value.forEach(recipe$ => {
        recipe$.complete();
      });
      recipeService.recipeMasterList$.next([]);
    });

    test('should format a new recipe master', () => {
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(mockUser()));

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue(Date.now().toString());

      recipeService.populateRecipeIds = jest
        .fn();

      const _mockDefaultRecipeMaster = defaultRecipeMaster();
      const _mockDefaultRecipeVariant = defaultRecipeVariant();

      const formatted = recipeService.formatNewRecipeMaster({
        master: _mockDefaultRecipeMaster,
        variant: _mockDefaultRecipeVariant
      });

      expect(formatted.name).toMatch(_mockDefaultRecipeMaster.name);
      expect(formatted.variants[0].variantName).toMatch(_mockDefaultRecipeVariant.variantName);
    }); // end 'should format a new recipe master' test

    test('should fail to format a new recipe master with missing user id', () => {
      const _mockUser = mockUser();
      _mockUser._id = undefined;
      _mockUser.cid = undefined;

      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));

      expect(() => {
        recipeService.formatNewRecipeMaster({})
      })
      .toThrowError('Client Validation Error: Missing User ID');
    }); // end 'should fail to format a new recipe master with missing user id' test

    test('should add a variant to a master in the list', done => {
      recipeService.setRecipeAsMaster = jest
        .fn();

      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeVariantIncomplete = mockRecipeVariantIncomplete();
      _mockRecipeVariantIncomplete.owner = _mockRecipeMasterInactive._id;
      _mockRecipeVariantIncomplete.isMaster = true;

      recipeService.getMasterById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive));

      recipeService.populateRecipeIds = jest
        .fn();

      recipeService.setRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      recipeService.addRecipeVariantToMasterInList(_mockRecipeMasterInactive._id, _mockRecipeVariantIncomplete)
        .subscribe(
          response => {
            expect(response).toStrictEqual(_mockRecipeVariantIncomplete);
            done();
          },
          error => {
            console.log(error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should add a variant to a master in the list [online]' test

    test('should fail to add recipe to a recipe master with invalid id', done => {
      recipeService.getMasterById = jest
        .fn()
        .mockReturnValue(undefined);

      recipeService.addRecipeVariantToMasterInList('masterId', mockRecipeVariantComplete())
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('Recipe master with id masterId not found');
            done();
          }
        );
    }); // end 'should fail to add recipe to a recipe master with invalid id' test

    test('should clear all recipe masters in list', () => {
      storage.removeRecipes = jest
        .fn();

      const storageSpy = jest.spyOn(storage, 'removeRecipes');

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.clearRecipes();

      expect(recipeService.recipeMasterList$.value.length).toBe(0);
      expect(storageSpy).toHaveBeenCalled();
    }); // end 'should clear all recipe masters in list' test

    test('should get a recipe master by its id', done => {
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.getMasterById(_mockRecipeMasterInactive._id)
        .subscribe(recipeMaster => {
          expect(recipeMaster._id).toMatch(_mockRecipeMasterInactive._id);
          done();
        });
    }); // end 'should get a recipe master by its id' test

    test('should get the recipe master list', () => {
      expect(recipeService.recipeMasterList$).toBe(recipeService.getMasterList());
    }); // end 'should get the recipe master list' test

    test('should get a recipe by its id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
      ]);

      recipeService.getMasterById = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive));

      recipeService.getRecipeVariantById(_mockRecipeMasterInactive._id, _mockRecipeVariantComplete._id)
        .subscribe(recipe => {
          expect(recipe._id).toMatch(_mockRecipeVariantComplete._id);
          done();
        });
    }); // end 'should get a recipe by its id' test

    test('should fail to get a recipe with invalid id', done => {
      recipeService.getRecipeVariantById('masterId', 'recipeId')
        .subscribe(
          () => {
            console.log('Should not get a response');
            expect(true).toBe(false);
          },
          error => {
            expect(error).toMatch('Recipe master with id masterId not found');
            done();
          }
        );
    }); // end 'should fail to get a recipe with invalid id' test

    test('should get a recipe master using the variant id', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
      ]);

      const searchRecipe = _mockRecipeMasterActive.variants[1];

      const recipeMaster = recipeService.getRecipeMasterByRecipeId(searchRecipe._id);

      expect(recipeMaster.value).toStrictEqual(recipeService.recipeMasterList$.value[0].value);
    }); // end 'should get a recipe master using the variant id' test

    test('should fail to find a recipe master with given variant id', () => {
      expect(recipeService.getRecipeMasterByRecipeId('')).toBeUndefined();
    }); // end 'should fail to find a recipe master with given variant id' test

    test('should check if a recipe has a process list', () => {
      expect(recipeService.isRecipeProcessPresent(mockRecipeVariantComplete())).toBe(true);
    }); // end 'should check if a recipe has a process list' test

    test('should map an array of recipe masters to a behavior subject of array of behvior subjects', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(recipeService.recipeMasterList$);

      recipeService.getFlaggedRecipeMasters = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>([]));

      recipeService.mapRecipeMasterArrayToSubjects([_mockRecipeMasterActive, _mockRecipeMasterInactive]);

      expect(recipeService.recipeMasterList$.value[0].value).toStrictEqual(_mockRecipeMasterActive);
      expect(recipeService.recipeMasterList$.value[1].value).toStrictEqual(_mockRecipeMasterInactive);
    }); // end 'should map an array of recipe masters to a behavior subject of array of behvior subjects' test

    test('should populate recipe and nested _id fields with unix timestamps in [offline]', () => {
      recipeService.populateRecipeNestedIds = jest
        .fn();

      const popSpy = jest.spyOn(recipeService, 'populateRecipeNestedIds');

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('1234567890123');

      const _mockRecipeVariantComplete = mockRecipeVariantComplete();
      _mockRecipeVariantComplete.otherIngredients = mockOtherIngredient();

      recipeService.populateRecipeIds(_mockRecipeVariantComplete);

      expect(_mockRecipeVariantComplete.cid).toMatch(RegExp(/^[\d]{13,23}$/g));
      expect(popSpy.mock.calls.length).toBe(5);
    }); // end 'should populate recipe and nested _id fields with unix timestamps in [offline]' test

    test('should populate recipe variant with no ingredients', () => {
      const popSpy = jest.spyOn(recipeService, 'populateRecipeNestedIds');

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('1234567890123');

      recipeService.populateRecipeIds(mockRecipeVariantIncomplete());

      expect(popSpy).not.toHaveBeenCalled();
    }); // end 'should populate recipe variant with no ingredients' test

    test('should populate _id fields in objects in array', () => {
      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('1234567890123');

      const _mockGrainBill = mockGrainBill();

      recipeService.populateRecipeNestedIds(_mockGrainBill);

      _mockGrainBill.forEach(grains => {
        expect(grains.cid).toMatch(RegExp(/^[\d]{13,23}$/g));
      });
    }); // end 'should populate _id fields in objects in array' test

    test('should remove a recipe from a recipe master in the list', done => {
      recipeService.removeRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      const _mockRecipeVariantComplete = mockRecipeVariantComplete();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.removeRecipeFromMasterInList(recipeService.recipeMasterList$.value[0], _mockRecipeVariantComplete._id)
        .subscribe(() => {
          const master = recipeService.recipeMasterList$.value[0].value;
          expect(master.variants.length).toBe(1);
          expect(_mockRecipeVariantComplete._id).not.toMatch(master.variants[0]._id);
          done();
        });
    }); // end 'should remove a recipe from a recipe master in the list' test

    test('should fail to remove a recipe from recipe master due to missing recipe', done => {
      const master$ = new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive());

      recipeService.removeRecipeFromMasterInList(master$, 'variantId')
        .subscribe(
          () => { },
          error => {
            expect(error).toBeDefined();
            expect(error).toMatch(`Delete error: recipe with id variantId not found`);
            done();
          }
        );
    }); // end 'should fail to remove a recipe from recipe master due to missing recipe' test

    test('should remove a recipe master from the list', done => {
      recipeService.updateRecipeStorage = jest
        .fn();

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
      ]);

      recipeService.removeRecipeMasterFromList(_mockRecipeMasterActive._id)
        .subscribe(() => {
          const masterList = recipeService.recipeMasterList$.value;
          expect(masterList.length).toBe(1);
          expect(_mockRecipeMasterActive._id).not.toMatch(masterList[0].value._id);
          done();
        });
    }); // end 'should remove a recipe master from the list' test

    test('should fail to remove a recipe master due to missing master', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
      ]);

      recipeService.removeRecipeMasterFromList(_mockRecipeMasterInactive._id)
        .subscribe(
          () => { },
          error => {
            expect(error).toBeDefined();
            expect(error).toMatch(`Delete error: Recipe master with id ${_mockRecipeMasterInactive._id} not found`);
            done();
          }
        );
    }); // end 'should fail to remove a recipe master due to missing master' test

    test('should remove a recipe as the master', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeVariantComplete = _mockRecipeMasterActive.variants[0];
      const _mockRecipeVariantIncomplete = _mockRecipeMasterActive.variants[1];

      recipeService.removeRecipeAsMaster(_mockRecipeMasterActive, 0);

      expect(_mockRecipeMasterActive.master).toMatch(_mockRecipeVariantIncomplete._id);
      expect(_mockRecipeVariantComplete.isMaster).toBe(false);
      expect(_mockRecipeVariantIncomplete.isMaster).toBe(true);
    }); // end 'should remove a recipe as the master' test

    test('should set a recipe as the master', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeVariantComplete = _mockRecipeMasterActive.variants[0];
      const _mockRecipeVariantIncomplete = _mockRecipeMasterActive.variants[1];

      recipeService.setRecipeAsMaster(_mockRecipeMasterActive, 1);

      expect(_mockRecipeMasterActive.master).toMatch(_mockRecipeVariantIncomplete.cid);
      expect(_mockRecipeVariantComplete.isMaster).toBe(false);
      expect(_mockRecipeVariantIncomplete.isMaster).toBe(true);
    });

    test('should call to update recipe storage', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.recipeMasterList$.next(
        [
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        ]
      );

      storage.setRecipes = jest
        .fn()
        .mockReturnValue(of({}));

      const storageSpy = jest.spyOn(storage, 'setRecipes');

      recipeService.updateRecipeStorage();

      expect(storageSpy).toHaveBeenCalledWith(
        [
          _mockRecipeMasterActive,
          _mockRecipeMasterInactive
        ]
      );
    }); // 'should call to update recipe storage' test

    test('should get error response when update storage fails', () => {
      storage.setRecipes = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error'));

      const consoleSpy = jest.spyOn(console, 'log');

      recipeService.updateRecipeStorage();

      const callCount = consoleSpy.mock.calls.length;
      expect(consoleSpy.mock.calls[callCount - 1][0]).toMatch('recipe store error');
      expect(consoleSpy.mock.calls[callCount - 1][1]).toMatch('error');
    }); // end 'should get error response when update storage fails' test

    test('should update a recipe master in the list', done => {
      recipeService.updateRecipeStorage = jest
        .fn();

      const _updatedMockRecipeMasterInactive = mockRecipeMasterInactive();
      _updatedMockRecipeMasterInactive.name = 'updated-name';
      _updatedMockRecipeMasterInactive['ignoreProp'] = 0;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeMasterInList(_updatedMockRecipeMasterInactive._id, _updatedMockRecipeMasterInactive)
        .subscribe((updated: RecipeMaster) => {
          expect(updated.name).toMatch(_updatedMockRecipeMasterInactive.name);
          expect(recipeService.recipeMasterList$.value[1].value._id).toMatch(updated._id);
          expect(updated['ignoreProp']).toBeUndefined();
          done();
        });
    }); // end 'should update a recipe master in the list' test

    test('should fail to update a recipe master due to missing master', done => {
      const _updatedMockRecipeMasterInactive = mockRecipeMasterInactive();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
      ]);

      recipeService.updateRecipeMasterInList(_updatedMockRecipeMasterInactive._id, _updatedMockRecipeMasterInactive)
        .subscribe(
          () => { },
          error => {
            expect(error).toBeDefined();
            expect(error).toMatch(`Recipe master with id ${_updatedMockRecipeMasterInactive._id} not found`);
            done();
          }
        );
    }); // end 'should fail to update a recipe master due to missing master' test

    test('should update a recipe of a recipe master in list', done => {
      recipeService.setRecipeAsMaster = jest
        .fn();

      recipeService.setRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      const _updatedMockRecipeIncomplete = mockRecipeVariantIncomplete();
      _updatedMockRecipeIncomplete.isMaster = true;
      _updatedMockRecipeIncomplete['ignoreProp'] = 0;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeOfMasterInList(recipeService.recipeMasterList$.value[0], _updatedMockRecipeIncomplete._id, _updatedMockRecipeIncomplete)
        .subscribe((updated: RecipeVariant) => {
          expect(updated._id).toMatch(recipeService.recipeMasterList$.value[0].value.variants[1]._id);
          expect(updated.isMaster).toBe(true);
          expect(updated['ignoreProp']).toBeUndefined();
          done();
        });
    }); // end 'should update a recipe of a recipe master in list' test

    test('should deselect a recipe variant as master', done => {
      recipeService.removeRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      const removeSpy = jest.spyOn(recipeService, 'removeRecipeAsMaster');
      const storageSpy = jest.spyOn(recipeService, 'updateRecipeStorage');

      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _updatedMockRecipeComplete = _mockRecipeMasterActive.variants[0];

      recipeService.updateRecipeOfMasterInList(new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive), _updatedMockRecipeComplete._id, { isMaster: false })
        .subscribe(() => {
          expect(removeSpy).toHaveBeenCalled();
          expect(storageSpy).toHaveBeenCalled();
          done();
        });
    }); // end 'should deselect a recipe variant as master' test

    test('should fail to update a recipe due to missing recipe', done => {
      const _updatedMockRecipeIncomplete = mockRecipeVariantIncomplete();
      _updatedMockRecipeIncomplete.isMaster = true;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeOfMasterInList(recipeService.recipeMasterList$.value[1], _updatedMockRecipeIncomplete._id, _updatedMockRecipeIncomplete)
        .subscribe(
          () => { },
          error => {
            expect(error).toBeDefined();
            expect(error).toMatch(`Recipe with id ${_updatedMockRecipeIncomplete._id} not found`);
            done();
          }
        );
    }); // end 'should fail to update a recipe due to missing recipe' test

  }); // end 'In memory actions' section

});
