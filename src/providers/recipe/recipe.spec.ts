/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
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
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { mockRecipeIncomplete } from '../../../test-config/mockmodels/mockRecipeIncomplete';
import { mockUser } from '../../../test-config/mockmodels/mockUser';
import { mockOtherIngredient } from '../../../test-config/mockmodels/mockOtherIngredient';
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { User } from '../../shared/interfaces/user';

/* Provider imports */
import { RecipeProvider } from './recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { UserProvider } from '../user/user';
import { ConnectionProvider } from '../connection/connection';

describe('Recipe Service', () => {
  let injector: TestBed;
  let recipeService: RecipeProvider;
  let connectionService: ConnectionProvider;
  let userService: UserProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        IonicStorageModule.forRoot()
      ],
      providers: [
        RecipeProvider,
        ProcessHttpErrorProvider,
        StorageProvider,
        ConnectionProvider,
        UserProvider,
        Events,
        { provide: Network, useValue: {} }
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    recipeService = injector.get(RecipeProvider);
    connectionService = injector.get(ConnectionProvider);
    userService = injector.get(UserProvider);
    httpMock = injector.get(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Public API requests', () => {

    test('should get a recipe master by id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      recipeService.getPublicMasterById(_mockRecipeMasterActive._id)
        .subscribe(recipeMaster => {
          expect(recipeMaster._id).toMatch(_mockRecipeMasterActive._id);
          done();
        });

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/master/${_mockRecipeMasterActive._id}`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(_mockRecipeMasterActive);
    }); // end 'should get a recipe master by id' test

    test('should get a list of recipe masters by user id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      recipeService.getPublicMasterListByUser(_mockRecipeMasterActive.owner)
        .subscribe(masterList => {
          expect(masterList.length).toBe(2);
          expect(masterList[0].owner).toMatch(_mockRecipeMasterActive.owner);
          done();
        });

      const masterListReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/${_mockRecipeMasterActive.owner}`);
      expect(masterListReq.request.method).toMatch('GET');
      masterListReq.flush([_mockRecipeMasterActive, mockRecipeMasterInactive()]);
    }); // end 'should get a list of recipe masters by user id' test

    test('should get a public recipe by id', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeComplete = mockRecipeComplete();
      recipeService.getPublicRecipeById(_mockRecipeMasterActive._id, _mockRecipeComplete._id)
        .subscribe(recipe => {
          expect(recipe._id).toMatch(_mockRecipeComplete._id);
          done();
        });

      const recipeReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/public/master/${_mockRecipeMasterActive._id}/recipe/${_mockRecipeComplete._id}`);
      expect(recipeReq.request.method).toMatch('GET');
      recipeReq.flush(_mockRecipeComplete);
    }); // end 'should get a public recipe by id' test

  }); // end 'Public API requests' section

  describe('Private API requests', () => {

    describe('DELETE requests', () => {

      beforeEach(() => {
        recipeService.recipeMasterList$.next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive())
        ]);
      });

      test('should delete a recipe using its id [online]', done => {
        connectionService.connection = true;
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeComplete = mockRecipeComplete();
        expect(recipeService.recipeMasterList$.value[0].value.recipes.length).toBe(2);
        recipeService.deleteRecipeById(_mockRecipeMasterActive._id, _mockRecipeComplete._id)
          .subscribe(() => {
            expect(recipeService.recipeMasterList$.value[0].value.recipes.length).toBe(1);
            done();
          });

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}/recipe/${_mockRecipeComplete._id}`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush(_mockRecipeComplete);
      }); // end 'should delete a recipe using its id [online]' test

      test('should delete a recipe using its id [offline]', done => {
        connectionService.connection = false;
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeComplete = mockRecipeComplete();
        expect(recipeService.recipeMasterList$.value[0].value.recipes.length).toBe(2);
        recipeService.deleteRecipeById(_mockRecipeMasterActive._id, _mockRecipeComplete._id)
          .subscribe(() => {
            expect(recipeService.recipeMasterList$.value[0].value.recipes.length).toBe(1);
            done();
          });
      }); // end 'should delete a recipe using its id [offline]' test

      test('should fail to delete a recipe due to recipe count', done => {
        const _mockRecipeMasterInactive = mockRecipeMasterInactive()
        recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)]);
        recipeService.deleteRecipeById(_mockRecipeMasterInactive._id, mockRecipeComplete()._id)
          .subscribe(
            () => { },
            error => {
              expect(error).toBeDefined();
              expect(error).toMatch('At least one recipe must remain');
              done();
            }
          );
      }); // end 'should fail to delete a recipe due to recipe count' test

      test('should delete a recipe master using its id [online]', done => {
        connectionService.connection = true;
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        expect(recipeService.recipeMasterList$.value.length).toBe(1);
        recipeService.deleteRecipeMasterById(_mockRecipeMasterActive._id)
          .subscribe(() => {
            expect(recipeService.recipeMasterList$.value.length).toBe(0);
            done();
          });

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush(_mockRecipeMasterActive);
      }); // end 'should delete a recipe master using its id [online]' test

      test('should delete a recipe master using its id [offline]', done => {
        connectionService.connection = false;
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        expect(recipeService.recipeMasterList$.value.length).toBe(1);
        recipeService.deleteRecipeMasterById(_mockRecipeMasterActive._id)
          .subscribe(() => {
            expect(recipeService.recipeMasterList$.value.length).toBe(0);
            done();
          });
      }); // end 'should delete a recipe master using its id [offline]' test

    }); // end 'DELETE requests' section

    describe('GET requests', () => {

      test('should get recipe master list [online]', done => {
        connectionService.connection = true;
        const cacheSpy = jest.spyOn(recipeService.storageService, 'getRecipes');
        expect(recipeService.recipeMasterList$.value.length).toBe(0);
        recipeService.initializeRecipeMasterList();
        setTimeout(() => {
          expect(recipeService.recipeMasterList$.value.length).toBe(2);
          expect(cacheSpy).toHaveBeenCalled();
          done();
        }, 10);

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
        expect(getReq.request.method).toMatch('GET');
        getReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
      }); // end 'should get recipe master list [online]' test

      test('should get recipe master list [offline]', done => {
        connectionService.connection = false;
        const cacheSpy = jest.spyOn(recipeService.storageService, 'getRecipes');
        expect(recipeService.recipeMasterList$.value.length).toBe(0);
        recipeService.initializeRecipeMasterList();
        setTimeout(() => {
          expect(recipeService.recipeMasterList$.value.length).toBe(2);
          expect(cacheSpy).toHaveBeenCalled();
          done();
        }, 10);
      }); // end 'should get recipe master list [offline]' test

    }); // end 'GET requests' section

    describe('PATCH requests', () => {

      beforeEach(() => {
        recipeService.recipeMasterList$.next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);
      });

      test('should update a recipe master by its id [online]', done => {
        connectionService.connection = true;
        const updateToApply = {name: 'new-name'};
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockUpdateApplied = mockRecipeMasterActive();
        _mockUpdateApplied.name = updateToApply.name;

        combineLatest(
          recipeService.recipeMasterList$.value[0],
          recipeService.patchRecipeMasterById(_mockRecipeMasterActive._id, updateToApply)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject._id).toMatch(fromResponse._id);
          expect(fromSubject.name).toMatch(updateToApply.name);
          expect(fromResponse.name).toMatch(updateToApply.name);
          done();
        });

        const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}`);
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(_mockUpdateApplied);
      }); // end 'should update a recipe master by its id [online]' test

      test('should update a recipe master by its id [offline]', done => {
        connectionService.connection = false;
        const updateToApply = {name: 'new-name'};
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockUpdateApplied = mockRecipeMasterActive();
        _mockUpdateApplied.name = updateToApply.name;

        combineLatest(
          recipeService.recipeMasterList$.value[0],
          recipeService.patchRecipeMasterById(_mockRecipeMasterActive._id, updateToApply)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject._id).toMatch(fromResponse._id);
          expect(fromSubject.name).toMatch(updateToApply.name);
          expect(fromResponse.name).toMatch(updateToApply.name);
          done();
        });
      }); // end 'should update a recipe master by its id [offline]' test

      test('should update a recipe by its id [online]', done => {
        connectionService.connection = true;
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeComplete = mockRecipeComplete();
        const _copyMockRecipeComplete = mockRecipeComplete();
        const updateToApply = _copyMockRecipeComplete;
        updateToApply.variantName = 'new-name';
        const _mockUpdateApplied = _copyMockRecipeComplete;
        _mockUpdateApplied.variantName = updateToApply.variantName;

        combineLatest(
          recipeService.recipeMasterList$.value[0],
          recipeService.patchRecipeById(_mockRecipeMasterActive._id, _mockRecipeComplete._id, updateToApply)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.recipes.find(recipe => recipe.variantName === updateToApply.variantName)).not.toBeUndefined();
          expect(fromResponse.variantName).toMatch(updateToApply.variantName)
          done();
        });

        const patchReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}/recipe/${_mockRecipeComplete._id}`);
        expect(patchReq.request.method).toMatch('PATCH');
        patchReq.flush(_mockUpdateApplied);
      }); // end 'should update a recipe by its id [online]' test

      test('should update a recipe by its id [offline]', done => {
        connectionService.connection = false;
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeComplete = mockRecipeComplete();
        const updateToApply = mockRecipeComplete();
        updateToApply.variantName = 'new-name';

        combineLatest(
          recipeService.recipeMasterList$.value[0],
          recipeService.patchRecipeById(_mockRecipeMasterActive._id, _mockRecipeComplete._id, updateToApply)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.recipes.find(recipe => recipe.variantName === updateToApply.variantName)).not.toBeUndefined();
          expect(fromResponse.variantName).toMatch(updateToApply.variantName)
          done();
        });
      }); // end 'should update a recipe by its id [offline]' test

      test('should fail to change a recipe\'s isMaster property to false due to recipe count', done => {
        const _mockRecipeMasterInactive = mockRecipeMasterInactive()
        recipeService.recipeMasterList$.next([new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)]);
        recipeService.patchRecipeById(_mockRecipeMasterInactive._id, mockRecipeComplete()._id, { isMaster: false })
          .subscribe(
            () => { },
            error => {
              expect(error).toBeDefined();
              expect(error).toMatch('At least one recipe is required to be set as master');
              done();
            }
          );
      }); // end 'should fail to change a recipe\'s isMaster property to false due to recipe count' test

    }); // end 'PATCH requests' section

    describe('POST requests', () => {

      beforeEach(() => {
        recipeService.recipeMasterList$.next([]);
      });

      test('should post a new recipe master [online]', done => {
        connectionService.connection = true;
        userService.user$ = new BehaviorSubject<User>(mockUser());
        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        expect(recipeService.recipeMasterList$.value.length).toBe(0);

        combineLatest(
          recipeService.recipeMasterList$,
          recipeService.postRecipeMaster({ master: _mockRecipeMasterInactive, recipe: mockRecipeComplete() })
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.length).toBe(1);
          expect(fromSubject[0].value._id).toMatch(fromResponse._id);
          done();
        });

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeMasterInactive);
      }); // end 'should post a new recipe master [online]' test

      test('should post a new recipe master [offline]', done => {
        connectionService.connection = false;
        userService.user$ = new BehaviorSubject<User>(mockUser());
        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        expect(recipeService.recipeMasterList$.value.length).toBe(0);

        combineLatest(
          recipeService.recipeMasterList$,
          recipeService.postRecipeMaster({ master: _mockRecipeMasterInactive, recipe: mockRecipeComplete() })
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.length).toBe(1);
          expect(fromSubject[0].value._id).toMatch(fromResponse._id);
          done();
        });
      }); // end 'should post a new recipe master [offline]' test

      test('should post a new recipe to a recipe master [online]', done => {
        connectionService.connection = true;
        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        const _mockRecipeIncomplete = mockRecipeIncomplete();
        recipeService.recipeMasterList$.next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

        combineLatest(
          recipeService.recipeMasterList$.value[0],
          recipeService.postRecipeToMasterById(_mockRecipeMasterInactive._id, _mockRecipeIncomplete)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.recipes.length).toBe(2);
          expect(fromResponse._id).toMatch(_mockRecipeIncomplete._id);
          done();
        });

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterInactive._id}`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeIncomplete);
      }); // end 'should post a new recipe to a recipe master [online]' test

      test('should post a new recipe to a recipe master [offline]', done => {
        connectionService.connection = false;
        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        const _mockRecipeIncomplete = mockRecipeIncomplete();
        recipeService.recipeMasterList$.next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);

        combineLatest(
          recipeService.recipeMasterList$.value[0],
          recipeService.postRecipeToMasterById(_mockRecipeMasterInactive._id, _mockRecipeIncomplete)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.recipes.length).toBe(2);
          expect(fromResponse._id).toMatch(_mockRecipeIncomplete._id);
          done();
        });
      }); // end 'should post a new recipe to a recipe master [offline]' test

    }); // end 'POST requests' section

  }); // end 'Private API requests' section

  describe('In memory actions', () => {

    beforeEach(() => {
      recipeService.recipeMasterList$.next([]);
    });

    test('should add a recipe master to the list [online]', done => {
      connectionService.connection = true;
      userService.user$ = new BehaviorSubject<User>(mockUser());
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      recipeService.addRecipeMasterToList(_mockRecipeMasterActive)
        .subscribe((newRecipeMaster: RecipeMaster) => {
          expect(newRecipeMaster._id).toMatch(_mockRecipeMasterActive._id);
          expect(newRecipeMaster._id).toMatch(recipeService.recipeMasterList$.value[0].value._id);
          done();
        });
    }); // end 'should add a recipe master to the list [online]' test

    test('should add a recipe master to the list [offline]', done => {
      connectionService.connection = false;
      userService.user$ = new BehaviorSubject<User>(mockUser());
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      recipeService.addRecipeMasterToList({ master: _mockRecipeMasterActive, recipe: mockRecipeComplete() })
        .subscribe((newRecipeMaster: RecipeMaster) => {
          expect(newRecipeMaster._id).toMatch(new RegExp('^[0-9]+$', 'g'));
          expect(newRecipeMaster._id).toMatch(recipeService.recipeMasterList$.value[0].value._id);
          done();
        });
    }); // end 'should add a recipe master to the list [offline]' test

    test('should fail to add a recipe master with missing user id', done => {
      connectionService.connection = false;
      recipeService.addRecipeMasterToList({})
        .subscribe(
          () => { },
          error => {
            expect(error).toBeDefined();
            expect(error).toMatch('Missing user id');
            done();
          }
        );
    }); // end 'should fail to add a recipe master with missing user id' test

    test('should add a recipe to a master in the list [online]', done => {
      connectionService.connection = true;
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeIncomplete = mockRecipeIncomplete();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.addRecipeToMasterInList(_mockRecipeMasterInactive._id, _mockRecipeIncomplete)
        .subscribe((newRecipe: Recipe) => {
          expect(newRecipe._id).toMatch(_mockRecipeIncomplete._id);
          expect(recipeService.recipeMasterList$.value[0].value.recipes[1]._id).toMatch(newRecipe._id);
          done();
        });
    }); // end 'should add a recipe to a master in the list [online]' test

    test('should add a recipe to a master in the list [offline]', done => {
      connectionService.connection = true;
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeIncomplete = mockRecipeIncomplete();
      _mockRecipeIncomplete._id = undefined;
      _mockRecipeIncomplete.isMaster = true;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.addRecipeToMasterInList(_mockRecipeMasterInactive._id, _mockRecipeIncomplete)
        .subscribe((newRecipe: Recipe) => {
          expect(newRecipe._id).toMatch(new RegExp('^[0-9]+$', 'g'));
          expect(recipeService.recipeMasterList$.value[0].value.recipes[1]._id).toMatch(newRecipe._id);
          done();
        });
    }); // end 'should add a recipe to a master in the list [offline]' test

    test('should clear all recipe masters in list', done => {
      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.recipeMasterList$
        .skip(1)
        .subscribe(masterList => {
          expect(masterList.length).toBe(0);
          done();
        });

      recipeService.clearRecipes();
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
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeComplete = mockRecipeComplete();
      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.getRecipeById(_mockRecipeMasterInactive._id, _mockRecipeComplete._id)
        .subscribe(recipe => {
          expect(recipe._id).toMatch(_mockRecipeComplete._id);
          done();
        });
    }); // end 'should get a recipe by its id' test

    test('should check if a recipe has a process list', () => {
      expect(recipeService.isRecipeProcessPresent(mockRecipeComplete())).toBe(true);
    }); // end 'should check if a recipe has a process list' test

    test('should map an array of recipe masters to a behavior subject of array of behvior subjects', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      expect(recipeService.recipeMasterList$.value.length).toBe(0);
      recipeService.mapRecipeMasterArrayToSubjects([_mockRecipeMasterActive, _mockRecipeMasterInactive]);
      expect(recipeService.recipeMasterList$.value.length).toBe(2);
      expect(recipeService.recipeMasterList$.value[0].value).toStrictEqual(_mockRecipeMasterActive);
      expect(recipeService.recipeMasterList$.value[1].value).toStrictEqual(_mockRecipeMasterInactive);
    }); // end 'should map an array of recipe masters to a behavior subject of array of behvior subjects' test

    test('should populate recipe and nested _id fields with unix timestamps in [offline]', () => {
      const popSpy = jest.spyOn(recipeService, 'populateRecipeNestedIds');
      const _mockRecipeComplete = mockRecipeComplete();
      _mockRecipeComplete.otherIngredients = mockOtherIngredient();
      recipeService.populateRecipeIds(_mockRecipeComplete);
      expect(_mockRecipeComplete._id).toMatch(new RegExp('^[0-9]+$', 'g'));
      expect(popSpy.mock.calls.length).toBe(5);
    }); // end 'should populate recipe and nested _id fields with unix timestamps in [offline]' test

    test('should populate _id fields in objects in array', () => {
      const _mockGrainBill = mockGrainBill();
      recipeService.populateRecipeNestedIds(_mockGrainBill);
      _mockGrainBill.forEach(grains => {
        expect(grains._id).toMatch(new RegExp('^[0-9]{3,}$', 'g'));
      });
    }); // end 'should populate _id fields in objects in array' test

    test('should remove a recipe from a recipe master in the list', done => {
      const _mockRecipeComplete = mockRecipeComplete();
      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.removeRecipeFromMasterInList(recipeService.recipeMasterList$.value[0], _mockRecipeComplete._id)
        .subscribe(() => {
          const master = recipeService.recipeMasterList$.value[0].value;
          expect(master.recipes.length).toBe(1);
          expect(_mockRecipeComplete._id).not.toMatch(master.recipes[0]._id);
          done();
        });
    }); // end 'should remove a recipe from a recipe master in the list' test

    test('should fail to remove a recipe from recipe master due to missing recipe', done => {
      const _mockRecipeIncomplete = mockRecipeIncomplete();
      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.removeRecipeFromMasterInList(recipeService.recipeMasterList$.value[1], _mockRecipeIncomplete._id)
        .subscribe(
          () => { },
          error => {
            expect(error).toBeDefined();
            expect(error).toMatch(`Delete error: recipe with id ${_mockRecipeIncomplete._id} not found`);
            done();
          }
        );
    }); // end 'should fail to remove a recipe from recipe master due to missing recipe' test

    test('should remove a recipe master from the list', done => {
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
      const _mockRecipeComplete = _mockRecipeMasterActive.recipes[0];
      const _mockRecipeIncomplete = _mockRecipeMasterActive.recipes[1];
      recipeService.removeRecipeAsMaster(_mockRecipeMasterActive, 0);
      expect(_mockRecipeMasterActive.master).toMatch(_mockRecipeIncomplete._id);
      expect(_mockRecipeComplete.isMaster).toBe(false);
      expect(_mockRecipeIncomplete.isMaster).toBe(true);
    }); // end 'should remove a recipe as the master' test

    test('should set a recipe as the master', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeComplete = _mockRecipeMasterActive.recipes[0];
      const _mockRecipeIncomplete = _mockRecipeMasterActive.recipes[1];
      recipeService.setRecipeAsMaster(_mockRecipeMasterActive, 1);
      expect(_mockRecipeMasterActive.master).toMatch(_mockRecipeIncomplete._id);
      expect(_mockRecipeComplete.isMaster).toBe(false);
      expect(_mockRecipeIncomplete.isMaster).toBe(true);
    });

    test('should call to update recipe cache', () => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      recipeService.recipeMasterList$.next(
        [
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterActive),
          new BehaviorSubject<RecipeMaster>(_mockRecipeMasterInactive)
        ]
      );
      const cacheSpy = jest.spyOn(recipeService.storageService, 'setRecipes');
      recipeService.updateCache();
      expect(cacheSpy).toHaveBeenCalledWith(
        [
          _mockRecipeMasterActive,
          _mockRecipeMasterInactive
        ]
      );
    }); // 'should call to update recipe cache' test

    test('should update a recipe master in the list', done => {
      const _updatedMockRecipeMasterInactive = mockRecipeMasterInactive();
      _updatedMockRecipeMasterInactive.name = 'updated-name';

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeMasterInList(_updatedMockRecipeMasterInactive._id, _updatedMockRecipeMasterInactive)
        .subscribe((updated: RecipeMaster) => {
          expect(updated.name).toMatch(_updatedMockRecipeMasterInactive.name);
          expect(recipeService.recipeMasterList$.value[1].value._id).toMatch(updated._id);
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
      const _updatedMockRecipeIncomplete = mockRecipeIncomplete();
      _updatedMockRecipeIncomplete.isMaster = true;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeOfMasterInList(recipeService.recipeMasterList$.value[0], _updatedMockRecipeIncomplete)
        .subscribe((updated: Recipe) => {
          expect(updated._id).toMatch(recipeService.recipeMasterList$.value[0].value.recipes[1]._id);
          expect(updated.isMaster).toBe(true);
          done();
        });
    }); // end 'should update a recipe of a recipe master in list' test

    test('should fail to update a recipe due to missing recipe', done => {
      const _updatedMockRecipeIncomplete = mockRecipeIncomplete();
      _updatedMockRecipeIncomplete.isMaster = true;

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.updateRecipeOfMasterInList(recipeService.recipeMasterList$.value[1], _updatedMockRecipeIncomplete)
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
