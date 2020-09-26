/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { of } from 'rxjs/observable/of';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { EventsMock } from '../../../test-config/mocks-ionic';
import { mockErrorResponse } from '../../../test-config/mockmodels/mockErrorResponse';
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';
import { mockHopsSchedule } from '../../../test-config/mockmodels/mockHopsSchedule';
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
import { Author } from '../../shared/interfaces/author';
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
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

    test('should get user\'s recipe author', done => {
      const _mockUser: User = mockUser();

      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));

      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();
      _mockRecipeMasterInactive.owner = _mockUser._id;

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        );

      recipeService.getPublicAuthorByRecipeId('found')
        .subscribe(
          (response: Author): void => {
            expect(response).toStrictEqual({
              username: _mockUser.username,
              userImageURL: 'user-image-url',
              labelImageURL: 'label-image-url'
            });
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should get user\'s recipe author' test

    test('should get public recipe author', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      const _mockUser: User = mockUser();
      _mockUser._id = 'other-id';
      _mockUser.cid = 'other-id';

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        );

      const author: Author = {
        username: _mockUser.username,
        userImageURL: _mockUser.userImage,
        labelImageURL: _mockUser.labelImage
      };

      recipeService.getPublicAuthorByRecipeId('other-id')
        .subscribe(
          (response: Author): void => {
            expect(response).toStrictEqual(author);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const getReq: TestRequest = httpMock.expectOne(
        `${BASE_URL}/${API_VERSION}/recipes/public/master/other-id/author`
      );
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(author);
    }); // end 'should get public recipe author' test

    test('should fail to get public recipe author', done => {
      connectionService.isConnected = jest
        .fn()
        .mockReturnValue(true);

      const _mockUser: User = mockUser();
      _mockUser._id = 'other-id';
      _mockUser.cid = 'other-id';

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        );

      recipeService.getPublicAuthorByRecipeId('other-id')
        .subscribe(
          (response: Author): void => {
            expect(response).toStrictEqual({
              username: 'Not Found',
              userImageURL: '',
              labelImageURL: ''
            });
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const getReq: TestRequest = httpMock.expectOne(
        `${BASE_URL}/${API_VERSION}/recipes/public/master/other-id/author`
      );
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(null, mockErrorResponse(404, 'Author not found'));
    }); // end 'should fail to get public recipe author' test

    test('should fail to get author due to missing search server id', done => {
      const _mockUser: User = mockUser();

      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(true);
      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(_mockUser));

      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();
      _mockRecipeMasterInactive._id = undefined;
      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        );

      recipeService.getPublicAuthorByRecipeId('0123456789012')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Missing server id');
            done();
          }
        );
    }); // end 'should fail to get author due to missing search server id' test

    test('should get a recipe master by id', done => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

      recipeService.getPublicRecipeMasterById(_mockRecipeMasterActive._id)
        .subscribe(
          (recipeMaster: RecipeMaster): void => {
            expect(recipeMaster._id).toMatch(_mockRecipeMasterActive._id);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      const recipeReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/recipes/public/master/${_mockRecipeMasterActive._id}`
        );
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(_mockRecipeMasterActive);
    }); // end 'should get a recipe master by id' test

    test('should fail to get a recipe master by user id due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Recipe master not found'));

      recipeService.getPublicRecipeMasterById('masterId')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> Recipe master not found');
            done();
          }
        );

      const getReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/recipes/public/master/masterId`
        );
      expect(getReq.request.method).toMatch('GET');
      getReq.flush(null, mockErrorResponse(404, 'Recipe master not found'));
    }); // end 'should fail to get a recipe master by user id due to error response' test

    test('should get a list of recipe masters by user id', done => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

      recipeService.getPublicRecipeMasterListByUser(
        _mockRecipeMasterActive.owner
      )
      .subscribe(
        (masterList: RecipeMaster[]): void => {
          expect(masterList.length).toBe(2);
          expect(masterList[0].owner).toMatch(_mockRecipeMasterActive.owner);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

      const masterListReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/recipes/public/${_mockRecipeMasterActive.owner}`
        );
      expect(masterListReq.request.method).toMatch('GET');
      masterListReq.flush([_mockRecipeMasterActive, mockRecipeMasterInactive()]);
    }); // end 'should get a list of recipe masters by user id' test

    test('should fail to get a list of recipe masters by user id due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> User not found'));

      recipeService.getPublicRecipeMasterListByUser('userId')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> User not found');
            done();
          }
        );

      const recipeReq: TestRequest = httpMock
        .expectOne(`${BASE_URL}/${API_VERSION}/recipes/public/userId`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(null, mockErrorResponse(404, 'User not found'));
    }); // end 'should fail to get a list of recipe masters by user id due to error response' test

    test('should get a public recipe by id', done => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeVariantComplete: RecipeVariant
        = mockRecipeVariantComplete();

      recipeService.getPublicRecipeVariantById(
        _mockRecipeMasterActive._id,
        _mockRecipeVariantComplete._id
      )
      .subscribe(
        (recipe: RecipeVariant): void => {
          expect(recipe._id).toMatch(_mockRecipeVariantComplete._id);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );

      const recipeReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/recipes/public/master/${_mockRecipeMasterActive._id}/variant/${_mockRecipeVariantComplete._id}`
        );
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(_mockRecipeVariantComplete);
    }); // end 'should get a public recipe by id' test

    test('should fail to get a public recipe due to error response', done => {
      processHttpError.handleError = jest
        .fn()
        .mockReturnValue(new ErrorObservable('<404> Recipe not found'));

      recipeService.getPublicRecipeVariantById('masterId', 'recipeId')
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

      const recipeReq: TestRequest = httpMock
        .expectOne(
          `${BASE_URL}/${API_VERSION}/recipes/public/master/masterId/variant/recipeId`
        );
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(null, mockErrorResponse(404, 'Recipe not found'));
    }); // end 'should fail to get a public recipe due to error response' test

  }); // end 'Public API requests' section

  describe('Private API requests', () => {

    describe('DELETE requests', () => {

      beforeEach(() => {
        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
          );
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
            (response: boolean): void => {
              expect(response).toBe(true);
              done();
            },
            (error: any): void => {
              console.log('Should not get an error', error);
              expect(true).toBe(false);
            });

        const deleteReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/masterId/variant/variantId`
          );
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush({});
      }); // end 'should delete a recipe variant using its id [online]' test

      test('should delete a recipe variant using its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'addSyncFlag');

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            (): void => {
              expect(flagSpy).toHaveBeenCalledWith(
                'update',
                'masterId'
              );
              done();
            },
            (error: any): void => {
              console.log('Should not get an error', error);
              expect(true).toBe(false);
            }
          );
      }); // end 'should delete a recipe variant using its id [offline]' test

      test('should fail to delete a recipe variant due to variant count', done => {
        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive()));

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
              expect(error).toMatch('At least one recipe must remain');
              done();
            }
          );
      }); // end 'should fail to delete a recipe variant due to variant count' test

      test('should fail to delete a recipe variant due to recipe master not found', done => {
        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(undefined);

        recipeService.deleteRecipeVariantById('masterId', 'variantId')
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
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
          .mockReturnValue(
            new ErrorObservable('<404> Recipe with id: recipeId not found')
          );

        recipeService.deleteRecipeVariantById('masterId', 'recipeId')
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
              expect(error).toMatch('<404> Recipe with id: recipeId not found');
              done();
            }
          );

        const deleteReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/masterId/variant/recipeId`
          );
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq
          .flush(
            null,
            mockErrorResponse(404, 'Recipe with id: recipeId not found')
          );
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
            (response: boolean): void => {
              expect(response).toBe(true);
              done();
            },
            (error: any): void => {
              console.log('Should not get an error', error);
              expect(true).toBe(false);
            }
          );

        const deleteReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/masterId`
          );
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush({});
      }); // end 'should delete a recipe master using its id [online]' test

      test('should delete a recipe master using its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'addSyncFlag');

        recipeService.deleteRecipeMasterById('masterId')
          .subscribe(
            (response: boolean): void => {
              expect(response).toBe(true);
              expect(flagSpy).toHaveBeenCalledWith(
                'delete',
                'masterId'
              );
              done();
            },
            (error: any): void => {
              console.log('Should not get an error', error);
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
          .mockReturnValue(
            new ErrorObservable(
              '<404> Recipe master with id: masterId not found'
            )
          );

        recipeService.deleteRecipeMasterById('masterId')
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
              expect(error)
                .toMatch('<404> Recipe master with id: masterId not found');
              done();
            }
          );

        const deleteReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/masterId`
          );
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq
          .flush(
            null,
            mockErrorResponse(404, 'Recipe master with id: masterId not found'
          )
        );
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

        const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'getRecipes');
        const mapSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'mapRecipeMasterArrayToSubjects');

        recipeService.initializeRecipeMasterList();

        setTimeout(() => {
          expect(storageSpy).toHaveBeenCalled();
          expect(mapSpy.mock.calls[0][0].length).toBe(2);
          done();
        }, 10);

        const getReq: TestRequest = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/recipes/private`);
        expect(getReq.request.method).toMatch('GET');
        getReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
      }); // end 'should get recipe master list [online]' test

      test('should get recipe master list [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        storage.getRecipes = jest
          .fn()
          .mockReturnValue(
            of(
              [mockRecipeMasterActive(), mockRecipeMasterActive()]
            )
          );

        recipeService.mapRecipeMasterArrayToSubjects = jest
          .fn();

        const mapSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'mapRecipeMasterArrayToSubjects');

        recipeService.initializeRecipeMasterList();
        setTimeout(() => {
          expect(mapSpy.mock.calls[0][0].length).toEqual(2);
          done();
        }, 10);
      }); // end 'should get recipe master list [offline]' test

      test('should fail to get recipe master list due to error response', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        recipeService.syncOnConnection = jest
          .fn()
          .mockReturnValue(of(true));

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> User not found'));

        storage.getRecipes = jest
          .fn()
          .mockReturnValue(of([]));

        const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

        recipeService.initializeRecipeMasterList();

        setTimeout(() => {
          expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
            .toMatch('<404> User not found');
          done();
        }, 10);

        const getReq: TestRequest = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/recipes/private`);
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

        const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

        recipeService.initializeRecipeMasterList();

        setTimeout(() => {
          expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
            .toMatch('Recipe list not found: awaiting data from server');
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

        const updateToApply: object = {name: 'new-name'};
        const _mockUpdateApplied: RecipeMaster = mockRecipeMasterActive();
        _mockUpdateApplied.name = updateToApply['name'];

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(_mockUpdateApplied)
          );

        recipeService.updateRecipeMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockUpdateApplied));

        recipeService.patchRecipeMasterById(
          _mockUpdateApplied.cid,
          updateToApply
        )
        .subscribe(
          (response: RecipeMaster): void => {
            expect(response).toStrictEqual(_mockUpdateApplied);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

        const patchReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/${_mockUpdateApplied._id}`
          );
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(_mockUpdateApplied);
      }); // end 'should update a recipe master by its id [online]' test

      test('should update a recipe master by its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const updateToApply: object = {name: 'new-name'};
        const _mockUpdateApplied: RecipeMaster = mockRecipeMasterActive();
        _mockUpdateApplied.name = updateToApply['name'];

        recipeService.updateRecipeMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockUpdateApplied));

        const flagSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'addSyncFlag');

        recipeService.patchRecipeMasterById(
          _mockUpdateApplied._id,
          updateToApply
        )
        .subscribe(
          (response: RecipeMaster): void => {
            expect(response).toStrictEqual(_mockUpdateApplied);
            expect(flagSpy).toHaveBeenCalledWith(
              'update',
              _mockUpdateApplied._id
            );
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
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

        const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

        recipeService.patchRecipeMasterById(_mockRecipeMasterActive._id, {})
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
              expect(error).toMatch('<404> Error message');
              done();
            }
          );

        const patchReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/${_mockRecipeMasterActive._id}`
          );
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

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(undefined);

        recipeService.patchRecipeMasterById('0000000000000', {})
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
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

        const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();
        _mockRecipeMasterInactive._id = undefined;

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
          );

        recipeService.patchRecipeMasterById(_mockRecipeMasterInactive.cid, {})
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
              expect(error)
                .toMatch(
                  `Found recipe with id: ${_mockRecipeMasterInactive.cid}, but unable to perform request at this time`
                );
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

        const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
        const _mockRecipeVariantComplete: RecipeVariant
          = mockRecipeVariantComplete();
        const _copyMockRecipeComplete: RecipeVariant
          = mockRecipeVariantComplete();

        const updateToApply: RecipeVariant = _copyMockRecipeComplete;
        updateToApply.variantName = 'new-name';

        const _mockUpdateApplied: RecipeVariant = _copyMockRecipeComplete;
        _mockUpdateApplied.variantName = updateToApply.variantName;

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
          );

        recipeService.updateRecipeVariantOfMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockUpdateApplied));

        recipeService.patchRecipeVariantById(
          _mockRecipeMasterActive._id,
          _mockRecipeVariantComplete._id,
          updateToApply
        )
        .subscribe(
          (response: RecipeVariant): void => {
            expect(response).toStrictEqual(_mockUpdateApplied);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

        const patchReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/${_mockRecipeMasterActive._id}/variant/${_mockRecipeVariantComplete._id}`
          );
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(_mockUpdateApplied);
      }); // end 'should update a recipe variant by its id [online]' test

      test('should update a recipe variant by its id [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'addSyncFlag');

        const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
        const _mockRecipeVariantComplete: RecipeVariant
          = mockRecipeVariantComplete();
        const updateToApply: RecipeVariant = mockRecipeVariantComplete();
        updateToApply.variantName = 'new-name';

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
          );

        recipeService.updateRecipeVariantOfMasterInList = jest
          .fn()
          .mockReturnValue(of(updateToApply));

        recipeService.patchRecipeVariantById(
          _mockRecipeMasterActive._id,
          _mockRecipeVariantComplete._id,
          updateToApply
        )
        .subscribe(
          (response: RecipeVariant): void => {
            expect(response).toStrictEqual(updateToApply);
            expect(flagSpy).toHaveBeenCalledWith(
              'update',
              _mockRecipeMasterActive._id
            );
            done();
          },
          (error: string): void => {
            console.log('Should not get an error', error);
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

        const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
          );

        processHttpError.handleError = jest
          .fn()
          .mockReturnValue(new ErrorObservable('<404> Error message'));

        recipeService.patchRecipeVariantById(
          _mockRecipeMasterActive._id,
          'recipeId',
          {}
        )
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> Error message');
            done();
          }
        );

        const patchReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/${_mockRecipeMasterActive._id}/variant/recipeId`
          );
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(null, mockErrorResponse(404, 'Error message'));
      }); // end 'should fail to update a recipe variant due to error response' test

      test('should fail to change a recipe variant\'s isMaster property to false due to recipe count', done => {
        const _mockRecipeMasterInactive: RecipeMaster
          = mockRecipeMasterInactive();

        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(
            new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
          );

        recipeService.patchRecipeVariantById(
          _mockRecipeMasterInactive._id,
          mockRecipeVariantComplete()._id,
          { isMaster: false }
        )
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch('At least one recipe is required to be set as master');
            done();
          }
        );
      }); // end 'should fail to change a recipe variant\'s isMaster property to false due to recipe count' test

      test('should fail to update recipe variant due to recipe master not found', done => {
        recipeService.getRecipeMasterById = jest
          .fn()
          .mockReturnValue(undefined);

        recipeService.patchRecipeVariantById('masterId', 'variantId', {})
          .subscribe(
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
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

        const _mockRecipeMasterInactive: RecipeMaster
          = mockRecipeMasterInactive();

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

        const postReq: TestRequest = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/recipes/private`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeMasterInactive);
      }); // end 'should post a new recipe master [online]' test

      test('should post a new recipe master [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'addSyncFlag');

        const _mockRecipeMasterInactive: RecipeMaster
          = mockRecipeMasterInactive();

        recipeService.formatNewRecipeMaster = jest
          .fn()
          .mockReturnValue(_mockRecipeMasterInactive);

        recipeService.postRecipeMaster({})
          .subscribe(
            (response: RecipeMaster): void => {
              expect(response).toStrictEqual(_mockRecipeMasterInactive);
              expect(flagSpy).toHaveBeenCalledWith(
                'create',
                _mockRecipeMasterInactive.cid
              );
              done();
            },
            (error: string): void => {
              console.log('Should not get an error', error);
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
            (response: any): void => {
              console.log('Should not get a response', response);
              expect(true).toBe(false);
            },
            (error: string): void => {
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
          .mockReturnValue(
            new ErrorObservable('<404> User with id userid not found')
          );

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

        const postReq: TestRequest = httpMock
          .expectOne(`${BASE_URL}/${API_VERSION}/recipes/private`);
        expect(postReq.request.method).toMatch('POST');
        postReq
          .flush(null, mockErrorResponse(404, 'User with id userid not found'));
      }); // end 'should fail to post a new recipe master due to error response' test

      test('should post a new recipe to a recipe master [online]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(true);

        userService.isLoggedIn = jest
          .fn()
          .mockReturnValue(true);

        const _mockRecipeMasterInactive: RecipeMaster
          = mockRecipeMasterInactive();
        const _mockRecipeVariantIncomplete: RecipeVariant
          = mockRecipeVariantIncomplete();

        recipeService.addRecipeVariantToMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockRecipeVariantIncomplete));

        recipeService.postRecipeToMasterById(
          _mockRecipeMasterInactive._id,
          _mockRecipeVariantIncomplete
        )
        .subscribe(
          (response: RecipeVariant): void => {
            expect(response).toStrictEqual(_mockRecipeVariantIncomplete);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

        const postReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/${_mockRecipeMasterInactive._id}`
          );
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeVariantIncomplete);
      }); // end 'should post a new recipe to a recipe master [online]' test

      test('should post a new recipe variant to a recipe master [offline]', done => {
        connectionService.isConnected = jest
          .fn()
          .mockReturnValue(false);

        const flagSpy: jest.SpyInstance = jest
          .spyOn(recipeService, 'addSyncFlag');

        const _mockRecipeMasterInactive: RecipeMaster
          = mockRecipeMasterInactive();
        const _mockRecipeVariantIncomplete: RecipeVariant
          = mockRecipeVariantIncomplete();

        recipeService.addRecipeVariantToMasterInList = jest
          .fn()
          .mockReturnValue(of(_mockRecipeVariantIncomplete));

        recipeService.postRecipeToMasterById(
          _mockRecipeMasterInactive._id,
          _mockRecipeVariantIncomplete
        )
        .subscribe(
          (response: RecipeVariant): void => {
            expect(response).toStrictEqual(_mockRecipeVariantIncomplete);
            expect(flagSpy).toHaveBeenCalledWith(
              'update',
              _mockRecipeMasterInactive._id
            );
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
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
          .mockReturnValue(
            new ErrorObservable(
              '<404> Recipe Master with id: missingId not found'
            )
          );

        recipeService.postRecipeToMasterById(
          'missingId',
          mockRecipeVariantComplete()
        )
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('<404> Recipe Master with id: missingId not found');
            done();
          }
        );

        const postReq: TestRequest = httpMock
          .expectOne(
            `${BASE_URL}/${API_VERSION}/recipes/private/master/missingId`
          );
        expect(postReq.request.method).toMatch('POST');
        postReq
          .flush(
            null,
            mockErrorResponse(404, 'Recipe Master with id: missingId not found')
          );
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

      const flagSpy: jest.SpyInstance = jest.spyOn(sync, 'addSyncFlag');

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
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      sync.getAllSyncFlags = jest
        .fn()
        .mockReturnValue([{
          method: 'update',
          docId: _mockRecipeMasterActive._id,
          docType: 'recipe'
        }]);

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        ]);

      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>(
            [
              new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
              new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
            ]
          )
        );

      const flagged: BehaviorSubject<RecipeMaster>[]
        = recipeService.getFlaggedRecipeMasters();

      expect(flagged.length).toBe(1);
      expect(flagged[0].value._id).toMatch(_mockRecipeMasterActive._id);
    }); // end 'should get array of recipe masters that are flagged for sync' test

    test('should process sync success responses', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      _mockRecipeMasterActive._id = undefined;

      const _mockRecipeMasterDeleted = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
        ]);

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(recipeService.recipeMasterList$.value[0]);

      _mockRecipeMasterActive._id = 'active'
      recipeService.processSyncSuccess([
        _mockRecipeMasterActive,
        { isDeleted: true, data: _mockRecipeMasterDeleted }
      ]);

      expect(recipeService.recipeMasterList$.value[0].value._id)
        .toMatch('active');
    }); // end 'should process a sync success response' test

    test('should set sync error if missing recipe master', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      _mockRecipeMasterActive._id = undefined;

      const _mockRecipeMasterMissingId = mockRecipeMasterInactive();
      _mockRecipeMasterMissingId._id = undefined;
      _mockRecipeMasterMissingId.cid = '0000000000000';

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
      ]);

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValueOnce(recipeService.recipeMasterList$.value[0])
        .mockReturnValueOnce(undefined);

      _mockRecipeMasterActive._id = 'active'
      recipeService.processSyncSuccess([
        _mockRecipeMasterActive,
        _mockRecipeMasterMissingId
      ]);

      expect(recipeService.recipeMasterList$.value[0].value._id)
        .toMatch('active');
      expect(recipeService.syncErrors[0])
        .toMatch('Recipe with id: \'0000000000000\' not found');
    }); // end 'should set sync error if missing recipe master' test

    test('should handle sync requests on connection', done => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

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

      const _mockUserId: User = mockUser();
      const _mockUserId$: BehaviorSubject<User>
        = new BehaviorSubject<User>(_mockUserId);

      const _mockUserIdMissing: User = mockUser();
      _mockUserIdMissing._id = undefined;
      const _mockUserIdMissing$: BehaviorSubject<User>
        = new BehaviorSubject<User>(_mockUserIdMissing);

      userService.getUser = jest
        .fn()
        .mockReturnValueOnce(_mockUserId$)
        .mockReturnValueOnce(_mockUserIdMissing$)
        .mockReturnValueOnce(undefined);

      const successSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'processSyncSuccess');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'updateRecipeStorage');

      const _mockOfflineSync: RecipeMaster = mockRecipeMasterInactive();
      _mockOfflineSync._id = undefined;
      const _mockOfflineSync$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(_mockOfflineSync);

      const _mockOnlineSync: RecipeMaster = mockRecipeMasterInactive();
      _mockOnlineSync.name = 'updated';
      const _mockOnlineSync$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(_mockOnlineSync);

      const _mockDeleteSync: RecipeMaster = mockRecipeMasterInactive();
      _mockDeleteSync._id = 'delete';
      const _mockDeleteSync$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(_mockDeleteSync);

      const _mockMissingId: RecipeMaster = mockRecipeMasterInactive();
      _mockMissingId._id = undefined;
      _mockMissingId.cid = '21098765431';
      const _mockMissingId$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(_mockMissingId);

      const _mockDefaultId: RecipeMaster = mockRecipeMasterInactive();
      _mockDefaultId.owner = '0123456789012';
      const _mockDefaultId$: BehaviorSubject<RecipeMaster>
        =new BehaviorSubject<RecipeMaster>(_mockDefaultId);

      const _mockDefaultIdFail: RecipeMaster = mockRecipeMasterInactive();
      _mockDefaultIdFail.owner = '1234567890123';
      const _mockDefaultIdFail$: BehaviorSubject<RecipeMaster>
        =new BehaviorSubject<RecipeMaster>(_mockDefaultIdFail);

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(_mockOfflineSync$)
        .mockReturnValueOnce(_mockOfflineSync$)
        .mockReturnValueOnce(_mockOnlineSync$)
        .mockReturnValueOnce(_mockDeleteSync$)
        .mockReturnValueOnce(_mockOfflineSync$)
        .mockReturnValueOnce(_mockMissingId$)
        .mockReturnValueOnce(_mockDefaultId$)
        .mockReturnValueOnce(_mockDefaultIdFail$)
        .mockReturnValueOnce(_mockDefaultIdFail$);

      _mockOfflineSync._id = 'inactive';

      sync.sync = jest
        .fn()
        .mockReturnValue(of({
          successes: [
            _mockRecipeMasterInactive,
            _mockRecipeMasterInactive,
            _mockOnlineSync,
            { isDeleted: true },
            _mockDefaultId
          ],
          errors: [
            'Sync error: Recipe master with id \'missing\' not found',
            'Sync error: Unknown sync flag method \'bad flag\'',
            `Recipe with id: ${_mockMissingId.cid} is missing its server id`,
            'Sync error: Cannot get recipe owner\'s id',
            'Sync error: Cannot get recipe owner\'s id'
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
          },
          {
            method: 'create',
            docId: _mockDefaultId.cid,
            docType: 'recipe'
          },
          {
            method: 'create',
            docId: _mockDefaultIdFail.cid,
            docType: 'recipe'
          },
          {
            method: 'create',
            docId: _mockDefaultIdFail.cid,
            docType: 'recipe'
          }
        ]);

      const syncSpy: jest.SpyInstance = jest.spyOn(sync, 'sync');

      recipeService.syncOnConnection(false)
        .subscribe(
          () => {},
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );

      setTimeout(() => {
        // Errors should be in indicies 0, 5, 6; the rest are undefined from mock returns
        expect(syncSpy.mock.calls[0][1][0].error)
          .toMatch('Sync error: Recipe master with id \'missing\' not found');
        expect(syncSpy.mock.calls[0][1][5].error)
          .toMatch('Sync error: Unknown sync flag method \'bad flag\'');
        expect(syncSpy.mock.calls[0][1][6].error)
          .toMatch(
            `Recipe with id: ${_mockMissingId.cid} is missing its server id`
          );
        expect(syncSpy.mock.calls[0][1][8].error)
          .toMatch('Sync error: Cannot get recipe owner\'s id');
        expect(syncSpy.mock.calls[0][1][9].error)
          .toMatch('Sync error: Cannot get recipe owner\'s id');

        expect(successSpy.mock.calls[0][0].length).toBe(5);
        expect(successSpy.mock.calls[0][0][0])
          .toStrictEqual(_mockRecipeMasterInactive);
        expect(successSpy.mock.calls[0][0][1])
          .toStrictEqual(_mockRecipeMasterInactive);
        expect(successSpy.mock.calls[0][0][2])
          .toStrictEqual(_mockOnlineSync);
        expect(successSpy.mock.calls[0][0][3])
          .toStrictEqual({ isDeleted: true });
        expect(successSpy.mock.calls[0][0][4])
          .toStrictEqual(_mockDefaultId);

        expect(recipeService.syncErrors.length).toBe(5);
        expect(recipeService.syncErrors[0])
          .toMatch('Sync error: Recipe master with id \'missing\' not found');
        expect(recipeService.syncErrors[1])
          .toMatch('Sync error: Unknown sync flag method \'bad flag\'');
        expect(recipeService.syncErrors[2])
          .toMatch(
            `Recipe with id: ${_mockMissingId.cid} is missing its server id`
          );
        expect(recipeService.syncErrors[3])
          .toMatch('Sync error: Cannot get recipe owner\'s id');
        expect(recipeService.syncErrors[4])
          .toMatch('Sync error: Cannot get recipe owner\'s id');
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync requests on connection' test

    test('should not perform a sync on connection if not logged in', done => {
      userService.isLoggedIn = jest
        .fn()
        .mockReturnValue(false);

      recipeService.syncOnConnection(false)
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
      recipeService.syncOnConnection = jest
        .fn()
        .mockReturnValue(of());

      const syncSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'syncOnConnection');

      recipeService.syncOnReconnect();

      expect(syncSpy).toHaveBeenCalledWith(false);
    }); // end 'should call connection sync on reconnect' test

    test('should get error response after calling connection sync on reconnect', done => {
      recipeService.syncOnConnection = jest
        .fn()
        .mockReturnValue(new ErrorObservable('Error syncing on reconnect'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      recipeService.syncOnReconnect();

      setTimeout(() => {
        expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
          .toMatch('Error syncing on reconnect');
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

      userService.getUser = jest
        .fn()
        .mockReturnValue(new BehaviorSubject<User>(mockUser()));

      const _mockSync: RecipeMaster = mockRecipeMasterInactive();
      _mockSync._id = undefined;
      const _mockRecipeMasterResponse: RecipeMaster = mockRecipeMasterInactive();

      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>(
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

      const successSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'processSyncSuccess');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'updateRecipeStorage');

      recipeService.syncOnSignup();

      setTimeout(() => {
        expect(successSpy.mock.calls[0][0][0])
          .toStrictEqual(_mockRecipeMasterResponse);
        expect(recipeService.syncErrors.length).toBe(0);
        expect(storageSpy).toHaveBeenCalled();
        done();
      }, 10);
    }); // end 'should handle sync on signup' test

    test('should fail sync on signup due to missing owner', done => {
      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>([])
        );
      recipeService.processSyncSuccess = jest
        .fn();
      recipeService.updateRecipeStorage = jest
        .fn();

      userService.getUser = jest
        .fn();

      const syncSpy: jest.SpyInstance = jest.spyOn(sync, 'sync');

      recipeService.syncOnSignup();

      setTimeout(() => {
        expect(syncSpy.mock.calls[1][1][0].error)
          .toMatch('Sync error: Cannot get recipe owner\'s id');
        done();
      }, 10);
    }); // end 'should fail sync on signup due to missing owner' test

  }); // end 'Sync handling' section


  describe('In memory actions', () => {

    beforeEach(() => {
      recipeService.recipeMasterList$.next([]);
    });

    afterEach(() => {
      recipeService.recipeMasterList$.value
        .forEach((recipe$: BehaviorSubject<RecipeMaster>) => {
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

      const _mockDefaultRecipeMaster: RecipeMaster = defaultRecipeMaster();
      const _mockDefaultRecipeVariant: RecipeVariant = defaultRecipeVariant();

      const formatted: object = recipeService.formatNewRecipeMaster({
        master: _mockDefaultRecipeMaster,
        variant: _mockDefaultRecipeVariant
      });

      expect(formatted['name']).toMatch(_mockDefaultRecipeMaster.name);
      expect(formatted['variants'][0].variantName)
        .toMatch(_mockDefaultRecipeVariant.variantName);
    }); // end 'should format a new recipe master' test

    test('should fail to format a new recipe master with missing user id', () => {
      const _mockUser: User = mockUser();
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

      const _mockRecipeMasterInactive: RecipeMaster
        = mockRecipeMasterInactive();
      const _mockRecipeVariantIncomplete: RecipeVariant
        = mockRecipeVariantIncomplete();
      _mockRecipeVariantIncomplete.owner = _mockRecipeMasterInactive._id;
      _mockRecipeVariantIncomplete.isMaster = true;

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        );

      recipeService.populateRecipeIds = jest
        .fn();

      recipeService.setRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      recipeService.addRecipeVariantToMasterInList(
        _mockRecipeMasterInactive._id,
        _mockRecipeVariantIncomplete
      )
      .subscribe(
        (response: RecipeVariant): void => {
          expect(response).toStrictEqual(_mockRecipeVariantIncomplete);
          done();
        },
        (error: string): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should add a variant to a master in the list [online]' test

    test('should fail to add recipe to a recipe master with invalid id', done => {
      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(undefined);

      recipeService.addRecipeVariantToMasterInList(
        'masterId',
        mockRecipeVariantComplete()
      )
      .subscribe(
        (response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        },
        (error: string): void => {
          expect(error).toMatch('Recipe master with id masterId not found');
          done();
        }
      );
    }); // end 'should fail to add recipe to a recipe master with invalid id' test

    test('should clear all recipe masters in list', () => {
      storage.removeRecipes = jest
        .fn();

      const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'removeRecipes');

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

      recipeService.clearRecipes();

      expect(recipeService.recipeMasterList$.value.length).toEqual(0);
      expect(storageSpy).toHaveBeenCalled();
    }); // end 'should clear all recipe masters in list' test

    test('should refresh the master list', () => {
      const nextSpy: jest.SpyInstance = jest
        .spyOn(recipeService.recipeMasterList$, 'next');

      recipeService.emitListUpdate();

      expect(nextSpy).toHaveBeenCalled();
    }); // end 'should refresh the master list' test

    test('should combine hops schedule', () => {
      const __mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
      const _mockHopsSchedule: HopsSchedule[] = [
        __mockHopsSchedule[1],
        __mockHopsSchedule[0],
        __mockHopsSchedule[2],
        __mockHopsSchedule[0]
      ];

      const combined: HopsSchedule[]
        = recipeService.getCombinedHopsSchedule(_mockHopsSchedule);

      expect(combined.length).toEqual(3);
      expect(combined[0].quantity).toEqual(2);
      expect(combined[1].quantity).toEqual(0.5);
    }); // end 'should combine hops schedule' test

    test('should fail to combine a missing hops schedule', () => {
      expect(recipeService.getCombinedHopsSchedule(undefined)).toBeUndefined();
    }); // end 'should fail to combine a missing hops schedule' test

    test('should get a recipe master by its id', done => {
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

      recipeService.getRecipeMasterById(_mockRecipeMasterInactive._id)
        .subscribe(
          (recipeMaster: RecipeMaster): void => {
            expect(recipeMaster._id).toMatch(_mockRecipeMasterInactive._id);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should get a recipe master by its id' test

    test('should get the recipe master list', () => {
      expect(recipeService.getMasterList())
        .toBe(recipeService.recipeMasterList$);
    }); // end 'should get the recipe master list' test

    test('should get a recipe by its id', done => {
      const _mockRecipeMasterActive: RecipeMaster
        = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster
        = mockRecipeMasterInactive();
      const _mockRecipeVariantComplete: RecipeVariant
        = mockRecipeVariantComplete();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        ]);

      recipeService.getRecipeMasterById = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        );

      recipeService.getRecipeVariantById(
        _mockRecipeMasterInactive._id,
        _mockRecipeVariantComplete._id
      )
      .subscribe(
        (recipe: RecipeVariant): void => {
          expect(recipe._id).toMatch(_mockRecipeVariantComplete._id);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should get a recipe by its id' test

    test('should fail to get a recipe with invalid id', done => {
      recipeService.getRecipeVariantById('masterId', 'recipeId')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error).toMatch('Recipe master with id masterId not found');
            done();
          }
        );
    }); // end 'should fail to get a recipe with invalid id' test

    test('should get a recipe master using the variant id', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        ]);

      const searchRecipe: RecipeVariant = _mockRecipeMasterActive.variants[1];

      const recipeMaster: BehaviorSubject<RecipeMaster>
        = recipeService.getRecipeMasterByRecipeId(searchRecipe._id);

      expect(recipeMaster.value)
        .toStrictEqual(recipeService.recipeMasterList$.value[0].value);
    }); // end 'should get a recipe master using the variant id' test

    test('should fail to find a recipe master with given variant id', () => {
      expect(recipeService.getRecipeMasterByRecipeId('')).toBeUndefined();
    }); // end 'should fail to find a recipe master with given variant id' test

    test('should check if a recipe has a process list', () => {
      expect(recipeService.isRecipeProcessPresent(mockRecipeVariantComplete()))
        .toBe(true);
    }); // end 'should check if a recipe has a process list' test

    test('should map an array of recipe masters to a behavior subject of array of behvior subjects', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      recipeService.getMasterList = jest
        .fn()
        .mockReturnValue(recipeService.recipeMasterList$);

      recipeService.getFlaggedRecipeMasters = jest
        .fn()
        .mockReturnValue(
          new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>([])
        );

      recipeService.mapRecipeMasterArrayToSubjects(
        [
          _mockRecipeMasterActive,
          _mockRecipeMasterInactive
        ]
      );

      expect(recipeService.recipeMasterList$.value[0].value)
        .toStrictEqual(_mockRecipeMasterActive);
      expect(recipeService.recipeMasterList$.value[1].value)
        .toStrictEqual(_mockRecipeMasterInactive);
    }); // end 'should map an array of recipe masters to a behavior subject of array of behvior subjects' test

    test('should populate recipe and nested _id fields with unix timestamps in [offline]', () => {
      recipeService.populateRecipeNestedIds = jest
        .fn();

      const popSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'populateRecipeNestedIds');

      clientIdService.getNewId = jest
        .fn()
        .mockReturnValue('1234567890123');

      const _mockRecipeVariantComplete: RecipeVariant
        = mockRecipeVariantComplete();
      _mockRecipeVariantComplete.otherIngredients = mockOtherIngredient();

      recipeService.populateRecipeIds(_mockRecipeVariantComplete);

      expect(_mockRecipeVariantComplete.cid).toMatch(RegExp(/^[\d]{13,23}$/g));
      expect(popSpy.mock.calls.length).toBe(5);
    }); // end 'should populate recipe and nested _id fields with unix timestamps in [offline]' test

    test('should populate recipe variant with no ingredients', () => {
      const popSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'populateRecipeNestedIds');

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

      const _mockGrainBill: GrainBill[] = mockGrainBill();

      recipeService.populateRecipeNestedIds(_mockGrainBill);

      _mockGrainBill
        .forEach((grains: GrainBill) => {
          expect(grains.cid).toMatch(RegExp(/^[\d]{13,23}$/g));
        });
    }); // end 'should populate _id fields in objects in array' test

    test('should remove a recipe from a recipe master in the list', done => {
      recipeService.removeRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      const _mockRecipeVariantComplete: RecipeVariant
        = mockRecipeVariantComplete();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

      recipeService.removeRecipeFromMasterInList(
        recipeService.recipeMasterList$.value[0],
        _mockRecipeVariantComplete._id
      )
      .subscribe(
        (response: boolean): void => {
          const master: RecipeMaster
            = recipeService.recipeMasterList$.value[0].value;
          expect(master.variants.length).toBe(1);
          expect(_mockRecipeVariantComplete._id)
            .not
            .toMatch(master.variants[0]._id);
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should remove a recipe from a recipe master in the list' test

    test('should fail to remove a recipe from recipe master due to missing recipe', done => {
      const master$: BehaviorSubject<RecipeMaster>
        = new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive());

      recipeService.removeRecipeFromMasterInList(master$, 'variantId')
        .subscribe(
          (response: any): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch(`Delete error: recipe with id variantId not found`);
            done();
          }
        );
    }); // end 'should fail to remove a recipe from recipe master due to missing recipe' test

    test('should remove a recipe master from the list', done => {
      recipeService.updateRecipeStorage = jest
        .fn();

      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        ]);

      recipeService.removeRecipeMasterFromList(_mockRecipeMasterActive._id)
        .subscribe(
          (response: boolean): void => {
            const masterList: BehaviorSubject<RecipeMaster>[]
              = recipeService.recipeMasterList$.value;
            expect(masterList.length).toBe(1);
            expect(_mockRecipeMasterActive._id)
              .not
              .toMatch(masterList[0].value._id);
            done();
          },
          (error: any): void => {
            console.log('Should not get an error', error);
            expect(true).toBe(false);
          }
        );
    }); // end 'should remove a recipe master from the list' test

    test('should fail to remove a recipe master due to missing master', done => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive)
        ]);

      recipeService.removeRecipeMasterFromList(_mockRecipeMasterInactive._id)
        .subscribe(
          (response: boolean): void => {
            console.log('Should not get a response', response);
            expect(true).toBe(false);
          },
          (error: string): void => {
            expect(error)
              .toMatch(
                `Delete error: Recipe master with id ${_mockRecipeMasterInactive._id} not found`
              );
            done();
          }
        );
    }); // end 'should fail to remove a recipe master due to missing master' test

    test('should remove a recipe as the master', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeVariantComplete: RecipeVariant
        = _mockRecipeMasterActive.variants[0];
      const _mockRecipeVariantIncomplete: RecipeVariant
        = _mockRecipeMasterActive.variants[1];

      recipeService.removeRecipeAsMaster(_mockRecipeMasterActive, 0);

      expect(_mockRecipeMasterActive.master)
        .toMatch(_mockRecipeVariantIncomplete._id);
      expect(_mockRecipeVariantComplete.isMaster).toBe(false);
      expect(_mockRecipeVariantIncomplete.isMaster).toBe(true);
    }); // end 'should remove a recipe as the master' test

    test('should set a recipe as the master', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeVariantComplete: RecipeVariant
        = _mockRecipeMasterActive.variants[0];
      const _mockRecipeVariantIncomplete: RecipeVariant
        = _mockRecipeMasterActive.variants[1];

      recipeService.setRecipeAsMaster(_mockRecipeMasterActive, 1);

      expect(_mockRecipeMasterActive.master)
        .toMatch(_mockRecipeVariantIncomplete.cid);
      expect(_mockRecipeVariantComplete.isMaster).toBe(false);
      expect(_mockRecipeVariantIncomplete.isMaster).toBe(true);
    }); // end 'should set a recipe as the master' test

    test('should call to update recipe storage', () => {
      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _mockRecipeMasterInactive: RecipeMaster = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
      .next([
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
      ]);

      storage.setRecipes = jest
        .fn()
        .mockReturnValue(of({}));

      const storageSpy: jest.SpyInstance = jest.spyOn(storage, 'setRecipes');

      recipeService.updateRecipeStorage();

      expect(storageSpy)
        .toHaveBeenCalledWith([
          _mockRecipeMasterActive,
          _mockRecipeMasterInactive
        ]);
    }); // 'should call to update recipe storage' test

    test('should get error response when update storage fails', () => {
      storage.setRecipes = jest
        .fn()
        .mockReturnValue(new ErrorObservable('error'));

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      recipeService.updateRecipeStorage();

      expect(consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0])
        .toMatch('recipe store error: error');
    }); // end 'should get error response when update storage fails' test

    test('should update a recipe master in the list', done => {
      recipeService.updateRecipeStorage = jest
        .fn();

      const _updatedMockRecipeMasterInactive: RecipeMaster
        = mockRecipeMasterInactive();
      _updatedMockRecipeMasterInactive.name = 'updated-name';
      _updatedMockRecipeMasterInactive['ignoreProp'] = 0;

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

      recipeService.updateRecipeMasterInList(
        _updatedMockRecipeMasterInactive._id,
        _updatedMockRecipeMasterInactive
      )
      .subscribe(
        (updated: RecipeMaster): void => {
          expect(updated.name).toMatch(_updatedMockRecipeMasterInactive.name);
          expect(recipeService.recipeMasterList$.value[1].value._id)
            .toMatch(updated._id);
          expect(updated['ignoreProp']).toBeUndefined();
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should update a recipe master in the list' test

    test('should fail to update a recipe master due to missing master', done => {
      const _updatedMockRecipeMasterInactive: RecipeMaster
        = mockRecipeMasterInactive();

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
        ]);

      recipeService.updateRecipeMasterInList(
        _updatedMockRecipeMasterInactive._id,
        _updatedMockRecipeMasterInactive
      )
      .subscribe(
        (response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        },
        (error: string): void => {
          expect(error)
            .toMatch(
              `Recipe master with id ${_updatedMockRecipeMasterInactive._id} not found`
            );
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

      const _updatedMockRecipeIncomplete: RecipeVariant
        = mockRecipeVariantIncomplete();
      _updatedMockRecipeIncomplete.isMaster = true;
      _updatedMockRecipeIncomplete['ignoreProp'] = 0;

      recipeService.recipeMasterList$
        .next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

      recipeService.updateRecipeVariantOfMasterInList(
        recipeService.recipeMasterList$.value[0],
        _updatedMockRecipeIncomplete._id,
        _updatedMockRecipeIncomplete
      )
      .subscribe(
        (updated: RecipeVariant) => {
          expect(updated._id)
            .toMatch(
              recipeService.recipeMasterList$.value[0].value.variants[1]._id
            );
          expect(updated.isMaster).toBe(true);
          expect(updated['ignoreProp']).toBeUndefined();
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should update a recipe of a recipe master in list' test

    test('should deselect a recipe variant as master', done => {
      recipeService.removeRecipeAsMaster = jest
        .fn();

      recipeService.updateRecipeStorage = jest
        .fn();

      const removeSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'removeRecipeAsMaster');
      const storageSpy: jest.SpyInstance = jest
        .spyOn(recipeService, 'updateRecipeStorage');

      const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
      const _updatedMockRecipeComplete: RecipeVariant
        = _mockRecipeMasterActive.variants[0];

      recipeService.updateRecipeVariantOfMasterInList(
        new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
        _updatedMockRecipeComplete._id,
        { isMaster: false }
      )
      .subscribe(
        (response: RecipeVariant): void => {
          expect(removeSpy).toHaveBeenCalled();
          expect(storageSpy).toHaveBeenCalled();
          done();
        },
        (error: any): void => {
          console.log('Should not get an error', error);
          expect(true).toBe(false);
        }
      );
    }); // end 'should deselect a recipe variant as master' test

    test('should fail to update a recipe due to missing recipe', done => {
      const _updatedMockRecipeIncomplete: RecipeVariant
        = mockRecipeVariantIncomplete();
      _updatedMockRecipeIncomplete.isMaster = true;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeVariantOfMasterInList(
        recipeService.recipeMasterList$.value[1],
        _updatedMockRecipeIncomplete._id,
        _updatedMockRecipeIncomplete
      )
      .subscribe(
        (response: any): void => {
          console.log('Should not get a response', response);
          expect(true).toBe(false);
        },
        (error: string): void => {
          expect(error)
            .toMatch(
              `Recipe with id ${_updatedMockRecipeIncomplete._id} not found`
            );
          done();
        }
      );
    }); // end 'should fail to update a recipe due to missing recipe' test

  }); // end 'In memory actions' section

});
