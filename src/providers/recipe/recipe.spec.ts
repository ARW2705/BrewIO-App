import { TestBed, getTestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Events } from 'ionic-angular';

import { RecipeProvider } from './recipe';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { mockRecipeMasterList } from '../../../test-config/mockmodels/mockRecipeMasterList';
import { mockRecipeMasterActive } from '../../../test-config/mockmodels/mockRecipeMasterActive';
import { mockRecipeMasterInactive } from '../../../test-config/mockmodels/mockRecipeMasterInactive';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';
import { mockRecipeIncomplete } from '../../../test-config/mockmodels/mockRecipeIncomplete';
import { clone } from '../../shared/utility-functions/utilities';

describe('Recipe Service', () => {
  let injector: TestBed;
  let recipeService: RecipeProvider;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule ],
      providers: [
        Events,
        RecipeProvider,
        ProcessHttpErrorProvider
      ]
    });
    injector = getTestBed();
    recipeService = injector.get(RecipeProvider);
    httpMock = injector.get(HttpTestingController);
  });

  describe('Public API http requests', () => {

    afterEach(() => {
      httpMock.verify();
    });

    test('should get an array of recipe masters from user', done => {
      const _mockRecipeMasterList = mockRecipeMasterList;

      recipeService.getPublicMasterListByUser('id').subscribe(list => {
        expect(list.length).toBe(2);
        expect(list).toEqual(_mockRecipeMasterList);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/public/id`);
      expect(req.request.method).toMatch('GET');
      req.flush(_mockRecipeMasterList);
    });

    test('should get recipe master by its id', done => {
      recipeService.getPublicMasterById('active').subscribe(master => {
        expect(master).toEqual(mockRecipeMasterActive);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/public/master/active`);
      expect(req.request.method).toMatch('GET');
      req.flush(mockRecipeMasterActive);
    });

    test('should get recipe by the recipe master id and recipe id', done => {
      recipeService.getPublicRecipeById('active', 'complete').subscribe(recipe => {
        expect(recipe).toEqual(mockRecipeComplete);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/public/master/active/recipe/complete`);
      expect(req.request.method).toMatch('GET');
      req.flush(mockRecipeComplete);
    });

  });

  describe('Private API http requests', () => {

    afterEach(() => {
      httpMock.verify();
    });

    test('should get master list from server', done => {
      recipeService.getMasterList().subscribe(list => {
        expect(list).toEqual(mockRecipeMasterList);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/user`);
      expect(req.request.method).toMatch('GET');
      req.flush(mockRecipeMasterList);
    });

    test('should get master list from memory', done => {
      recipeService.recipeMasterList = mockRecipeMasterList;

      recipeService.getMasterList().subscribe(list => {
        expect(list).toEqual(mockRecipeMasterList);
        done();
      });
    });

    test('should add recipe master to user', done => {
      recipeService.postRecipeMaster(mockRecipeMasterInactive).subscribe(response => {
        expect(response).toEqual(mockRecipeMasterInactive);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/user`);
      expect(req.request.method).toMatch('POST');
      req.flush(mockRecipeMasterInactive);
    });

    test('should get recipe master by its id from server', done => {
      recipeService.getMasterById('inactive').subscribe(master => {
        expect(master).toEqual(mockRecipeMasterInactive);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/inactive`);
      expect(req.request.method).toMatch('GET');
      req.flush(mockRecipeMasterInactive);
    });

    test('should get recipe master by its id from memory', done => {
      recipeService.recipeMasterList = mockRecipeMasterList;

      recipeService.getMasterById('inactive').subscribe(master => {
        expect(master).toEqual(mockRecipeMasterInactive);
        done();
      });
    });

    test('should post recipe by master id and recipe id', done => {
      recipeService.postRecipeToMasterById('inactive', mockRecipeComplete).subscribe(response => {
        expect(response).toEqual(mockRecipeComplete);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/inactive`);
      expect(req.request.method).toMatch('POST');
      req.flush(mockRecipeComplete);
    });

    test('should patch recipe master by its id', done => {
      const _updatedMockRecipeMaster = clone(mockRecipeMasterInactive);
      _updatedMockRecipeMaster.hasActiveBatch = true;
      _updatedMockRecipeMaster.name = 'updated';

      recipeService.patchRecipeMasterById('inactive', _updatedMockRecipeMaster).subscribe(response => {
        expect(response).toEqual(_updatedMockRecipeMaster);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/inactive`);
      expect(req.request.method).toMatch('PATCH');
      req.flush(_updatedMockRecipeMaster);
    });

    test('should delete a recipe master by its id', done => {
      recipeService.recipeMasterList = mockRecipeMasterList.map(master => clone(master, true));
      expect(recipeService.recipeMasterList.length).toBe(2);

      recipeService.deleteRecipeMasterById('inactive').subscribe(response => {
        expect(response).toEqual(mockRecipeMasterInactive);
        expect(recipeService.recipeMasterList.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/inactive`);
      expect(req.request.method).toMatch('DELETE');
      req.flush(mockRecipeMasterInactive);
    });

    test('should get recipe by the master id and recipe id from server', done => {
      recipeService.getRecipeById('inactive', 'complete').subscribe(recipe => {
        expect(recipe).toEqual(mockRecipeComplete);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/inactive/recipe/complete`);
      expect(req.request.method).toMatch('GET');
      req.flush(mockRecipeComplete);
    });

    test('should get recipe by the master id and recipe id from memory', done => {
      recipeService.recipeMasterList = mockRecipeMasterList;
      expect(recipeService.recipeMasterList.length).toBe(2);

      recipeService.getRecipeById('inactive', 'complete').subscribe(recipe => {
        expect(recipe).toEqual(mockRecipeComplete);
        done();
      });
    });

    test('should patch recipe by master id and recipe id', done => {
      const _updatedMockRecipe = clone(mockRecipeComplete);
      _updatedMockRecipe.efficiency = 75;
      _updatedMockRecipe.variantName = 'updated';

      recipeService.patchRecipeById('inactive', 'complete', _updatedMockRecipe).subscribe(response => {
        expect(response).toEqual(_updatedMockRecipe);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/inactive/recipe/complete`);
      expect(req.request.method).toMatch('PATCH');
      req.flush(_updatedMockRecipe);
    });

    test('should delete a recipe by its id', done => {
      recipeService.recipeMasterList = mockRecipeMasterList.map(master => clone(master, true));
      expect(recipeService.recipeMasterList[0].recipes.length).toBe(2);

      recipeService.deleteRecipeById('active', 'complete').subscribe(response => {
        expect(response).toEqual(mockRecipeComplete);
        expect(recipeService.recipeMasterList[0].recipes.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${baseURL}${apiVersion}/recipes/private/master/active/recipe/complete`);
      expect(req.request.method).toMatch('DELETE');
      req.flush(mockRecipeComplete);
    });
  });

  describe('Non-http request methods', () => {

    test('should have a process schedule', () => {
      expect(recipeService.isRecipeProcessPresent(mockRecipeComplete)).toBe(true);
    });

    test('should not have a process schedule', () => {
      expect(recipeService.isRecipeProcessPresent(mockRecipeIncomplete)).toBe(false);
    });

  });

});
