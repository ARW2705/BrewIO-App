/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
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

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';

/* Provider imports */
import { RecipeProvider } from './recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

describe('Recipe Service', () => {
  let injector: TestBed;
  let recipeService: RecipeProvider;
  let httpMock: HttpTestingController;
  configureTestBed();

  beforeAll(done => (async() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        RecipeProvider,
        ProcessHttpErrorProvider
      ]
    });
  })()
  .then(done)
  .catch(done.fail));

  beforeEach(() => {
    injector = getTestBed();
    recipeService = injector.get(RecipeProvider);
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

      test('should delete a recipe using its id', done => {
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeComplete = mockRecipeComplete();
        expect(recipeService.recipeMasterList$.value[0].value.recipes.length).toBe(2);
        recipeService.deleteRecipeById(_mockRecipeMasterActive._id, _mockRecipeComplete._id)
          .subscribe(dbResponse => {
            expect(recipeService.recipeMasterList$.value[0].value.recipes.length).toBe(1);
            expect(dbResponse._id).toMatch(_mockRecipeComplete._id);
            done();
          });

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}/recipe/${_mockRecipeComplete._id}`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush(_mockRecipeComplete);
      }); // end 'should delete a recipe using its id' test

      test('should delete a recipe master using its id', () => {
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        expect(recipeService.recipeMasterList$.value.length).toBe(1);
        recipeService.deleteRecipeMasterById(_mockRecipeMasterActive._id)

        const deleteReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/master/${_mockRecipeMasterActive._id}`);
        expect(deleteReq.request.method).toMatch('DELETE');
        deleteReq.flush(_mockRecipeMasterActive);
      }); // end 'should delete a recipe master using its id' test

    }); // end 'DELETE requests' section

    describe('GET requests', () => {

      test('should get recipe master list', done => {
        expect(recipeService.recipeMasterList$.value.length).toBe(0);
        recipeService.initializeRecipeMasterList();
        setTimeout(() => {
          expect(recipeService.recipeMasterList$.value.length).toBe(2);
          done();
        }, 100);

        const getReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
        expect(getReq.request.method).toMatch('GET');
        getReq.flush([mockRecipeMasterActive(), mockRecipeMasterInactive()]);
      }); // end 'should get recipe master list' test

    }); // end 'GET requests' section

    describe('PATCH requests', () => {

      beforeEach(() => {
        recipeService.recipeMasterList$.next([
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
          new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
        ]);
      });

      test('should update a recipe master by its id', done => {
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
      }); // end 'should update a recipe master by its id' test

      test('should update a recipe by its id', done => {
        const updateToApply = {variantName: 'new-name'};
        const _mockRecipeMasterActive = mockRecipeMasterActive();
        const _mockRecipeComplete = mockRecipeComplete();
        const _mockUpdateApplied = mockRecipeComplete();
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
      }); // end 'should update a recipe by its id' test

    }); // end 'PATCH requests' section

    describe('POST requests', () => {

      beforeEach(() => {
        recipeService.recipeMasterList$.next([]);
      });

      test('should post a new recipe master', done => {
        const _mockRecipeMasterInactive = mockRecipeMasterInactive();
        expect(recipeService.recipeMasterList$.value.length).toBe(0);

        combineLatest(
          recipeService.recipeMasterList$,
          recipeService.postRecipeMaster(_mockRecipeMasterInactive)
        ).subscribe(([fromSubject, fromResponse]) => {
          expect(fromSubject.length).toBe(1);
          expect(fromSubject[0].value._id).toMatch(fromResponse._id);
          done();
        });

        const postReq = httpMock.expectOne(`${baseURL}/${apiVersion}/recipes/private/user`);
        expect(postReq.request.method).toMatch('POST');
        postReq.flush(_mockRecipeMasterInactive);
      }); // end 'should post a new recipe master' test

      test('should post a new recipe to a recipe master', done => {
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
      }); // end 'should post a new recipe to a recipe master' test

    }); // end 'POST requests' section

  }); // end 'Private API requests' section

  describe('In memory actions', () => {

    beforeEach(() => {
      recipeService.recipeMasterList$.next([]);
    });

    test('should add a recipe master to the list', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      recipeService.recipeMasterList$
        .skip(1)
        .subscribe(recipeMasterList => {
          expect(recipeMasterList.length).toBe(1);
          expect(recipeMasterList[0].value._id).toMatch(_mockRecipeMasterActive._id);
          done();
        });

      recipeService.addRecipeMasterToList(_mockRecipeMasterActive);
    }); // end 'should add a recipe master to the list' test

    test('should add a recipe to a master in the list', done => {
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeIncomplete = mockRecipeIncomplete();

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.recipeMasterList$.value[0]
        .skip(1)
        .subscribe(recipeMaster => {
          expect(recipeMaster.recipes.length).toBe(2);
          expect(recipeMaster.recipes[1]._id).toMatch(_mockRecipeIncomplete._id);
          done();
        });

      recipeService.addRecipeToMasterInList(_mockRecipeMasterInactive._id, _mockRecipeIncomplete);
    }); // end 'should add a recipe to a master in the list' test

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

    test('should remove a recipe from a recipe master in the list', done => {
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      const _mockRecipeComplete = mockRecipeComplete();
      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.recipeMasterList$.value[1]
        .skip(1)
        .subscribe(() => {
          expect(recipeService.recipeMasterList$.value[1].value.recipes.find(recipe => recipe._id === _mockRecipeComplete._id)).toBeUndefined();
          done();
        });

      recipeService.removeRecipeFromMasterInList(_mockRecipeMasterInactive._id, _mockRecipeComplete);
    }); // end 'should remove a recipe from a recipe master in the list' test

    test('should remove a recipe master from the list', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _mockRecipeMasterInactive = mockRecipeMasterInactive();
      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.recipeMasterList$
        .skip(1)
        .subscribe(masterList => {
          expect(masterList.length).toBe(1);
          expect(masterList[0].value._id).toMatch(_mockRecipeMasterInactive._id);
          done();
        });

      recipeService.removeRecipeMasterFromList(_mockRecipeMasterActive);
    }); // end 'should remove a recipe master from the list' test

    test('should update a recipe master in the list', done => {
      const _updatedMockRecipeMasterInactive = mockRecipeMasterInactive();
      _updatedMockRecipeMasterInactive.name = 'updated-name';

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.recipeMasterList$.value[1]
        .skip(1)
        .subscribe(recipeMaster => {
          expect(recipeMaster.name).toMatch('updated-name');
          done();
        });

      recipeService.updateRecipeMasterInList(_updatedMockRecipeMasterInactive);
    }); // end 'should update a recipe master in the list' test

    test('should update a recipe of a recipe master in list', done => {
      const _mockRecipeMasterActive = mockRecipeMasterActive();
      const _updatedMockRecipeIncomplete = mockRecipeIncomplete();
      _updatedMockRecipeIncomplete.variantName = 'updated-name';

      recipeService.recipeMasterList$.next([
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterActive()),
        new BehaviorSubject<RecipeMaster>(mockRecipeMasterInactive())
      ]);

      recipeService.recipeMasterList$.value[0]
        .skip(1)
        .subscribe(recipeMaster => {
          const updatedRecipe = recipeMaster.recipes.find(recipe => recipe._id === _updatedMockRecipeIncomplete._id);
          expect(updatedRecipe).not.toBeUndefined();
          expect(updatedRecipe.variantName).toMatch(_updatedMockRecipeIncomplete.variantName);
          done();
        });

      recipeService.updateRecipeOfMasterInList(_mockRecipeMasterActive._id, _updatedMockRecipeIncomplete);
    }); // end 'should update a recipe of a recipe master in list' test

  }); // end 'In memory actions' section

});
