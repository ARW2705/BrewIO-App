/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';

/* Utility function imports */
import { getIndexById } from '../../shared/utility-functions/utilities';
import { getArrayFromObservables } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class RecipeProvider {
  recipeMasterList$: BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>> = new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>([]);

  constructor(public http: HttpClient,
    public processHttpError: ProcessHttpErrorProvider) { }

  /***** Public api access methods *****/

  /**
   * Http GET a public recipe master by its id
   *
   * @params: masterId - recipe master id string to search
   *
   * @return: Observable of recipe master
  **/
  getPublicMasterById(masterId: string): Observable<RecipeMaster> {
    return this.http.get(`${baseURL}/${apiVersion}/recipes/public/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Http GET all public recipe masters owned by a user
   *
   * @params: userId - user id string to search
   *
   * @return: Observable of an array of recipe masters
  **/
  getPublicMasterListByUser(userId: string): Observable<Array<RecipeMaster>> {
    return this.http.get(`${baseURL}/${apiVersion}/recipes/public/${userId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Http GET a public recipe by its id
   *
   * @params: masterId - recipe master id which requested recipe belongs
   * @params: recipeId - recipe id string to search
   *
   * @return: Observable of recipe
  **/
  getPublicRecipeById(masterId: string, recipeId: string): Observable<Recipe> {
    return this.http.get(`${baseURL}/${apiVersion}/recipes/public/master/${masterId}/recipe/${recipeId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /***** END public api access methods *****/


  /***** Private api access methods *****/

  /**
   * Http delete a recipe from its master
   *
   * @params: masterId - recipe's master's id
   * @params: recipeId - recipe id to delete
   *
   * @return: observable of the recipe that was deleted
  **/
  deleteRecipeById(masterId: string, recipeId: string): Observable<Recipe> {
    return this.http.delete(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}/recipe/${recipeId}`)
      .map((dbResponse: Recipe) => {
        this.removeRecipeFromMasterInList(masterId, dbResponse);
        return dbResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Http DELETE a recipe master and its child recipes from user
   *
   * @params: masterId - recipe master id string to search and delete
   *
   * @return: none
  **/
  deleteRecipeMasterById(masterId: string): void {
    this.http.delete(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error))
      .subscribe((deletedRecipeMasterResponse: RecipeMaster) => {
        this.removeRecipeMasterFromList(deletedRecipeMasterResponse);
      });
  }

  /**
   * Http GET all recipe masters for user, create recipe master subject, then
   * populate recipeMasterList$
   *
   * @params: none
   *
   * @return: observable of array of recipe master observables
  **/
  initializeRecipeMasterList(): void {
    this.http.get(`${baseURL}/${apiVersion}/recipes/private/user`)
      .catch(error => this.processHttpError.handleError(error))
      .subscribe((recipeMasterArrayResponse: Array<RecipeMaster>) => {
        this.recipeMasterList$.next(
          recipeMasterArrayResponse.map(recipeMaster => {
            return new BehaviorSubject<RecipeMaster>(recipeMaster);
          })
        );
      });
  }

  /**
   * Http PATCH a recipe master, update the in memory recipe master subject
   *
   * @params: masterId - recipe master id string to search
   * @params: update - key:value pairs to apply
   *
   * @return: observable of updated recipe master
  **/
  patchRecipeMasterById(masterId: string, update: object): Observable<RecipeMaster> {
    return this.http.patch(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}`, update)
      .map((updatedRecipeMasterResponse: RecipeMaster) => {
        this.updateRecipeMasterInList(updatedRecipeMasterResponse);
        return updatedRecipeMasterResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Http PATCH a recipe
   *
   * @params: masterId - recipe's master's id to search
   * @params: recipeId - recipe to update id
   * @params: update - key:value pairs of updated data to apply
   *
   * @return: observable of the update response recipe
  **/
  patchRecipeById(masterId: string, recipeId: string, update: object): Observable<Recipe> {
    return this.http.patch(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}/recipe/${recipeId}`, update)
      .map((updatedRecipeResponse: Recipe) => {
        this.updateRecipeOfMasterInList(masterId, updatedRecipeResponse);
        return updatedRecipeResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Http POST new recipe master to user
   *
   * @params: master - new master to add
   *
   * @return: observable of server response with recipe master
  **/
  postRecipeMaster(master: RecipeMaster): Observable<RecipeMaster> {
    return this.http.post(`${baseURL}/${apiVersion}/recipes/private/user`, master)
      .map((newRecipeMaster: RecipeMaster) => {
        this.addRecipeMasterToList(newRecipeMaster);
        return newRecipeMaster;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Http POST a new recipe to its master
   *
   * @params: masterId - recipe master id string to search
   * @params: recipe - the new recipe to add
   *
   * @return: observable of server response with new recipe
  **/
  postRecipeToMasterById(masterId: string, recipe: Recipe): Observable<Recipe> {
    return this.http.post(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}`, recipe)
      .map((newRecipeResponse: Recipe) => {
        this.addRecipeToMasterInList(masterId, newRecipeResponse);
        return newRecipeResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /***** END private access methods *****/


  /***** Utility methods *****/

  /**
   * Add recipe master list with a new recipe and update subject
   *
   * @params: newRecipeMaster - the new recipe master to add
   *
   * @return: none
  **/
  addRecipeMasterToList(newRecipeMaster: RecipeMaster): void {
    const recipeMasterSubject$ = new BehaviorSubject<RecipeMaster>(newRecipeMaster);
    const list = this.recipeMasterList$.value;
    list.push(recipeMasterSubject$);
    this.recipeMasterList$.next(list);
  }

  /**
   * Add a recipe to the recipe master and update subject
   *
   * @params: masterId - recipe's master's id
   * @params: recipe - recipe to add
   *
   * @return: none
  **/
  addRecipeToMasterInList(masterId: string, recipe: Recipe): void {
    const master$ = this.getMasterById(masterId);
    const master = master$.value;
    master.recipes.push(recipe);
    master$.next(master);
  }

  /**
   * Call complete for all recipes and clear recipeMasterList array on user logout
   *
   * @params: none
   * @return: none
  **/
  clearRecipes(): void {
    this.recipeMasterList$.value.forEach(recipe$ => {
      recipe$.complete();
    });
    this.recipeMasterList$.next([]);
  }

  /**
   * Get a recipe master that belongs to the user by its id
   *
   * @params: masterId - recipe master id string to search
   *
   * @return: observable of recipe master
  **/
  getMasterById(masterId: string): BehaviorSubject<RecipeMaster> {
    const master$ = this.recipeMasterList$.value.find(_recipeMaster$ => _recipeMaster$.value._id === masterId);
    return (master$ !== undefined) ? master$: null;
  }

  /**
   * Get list of recipe masters, fetch from server if list is empty
   *
   * @params: none
   *
   * @return: subject of array of recipe master subjects
  **/
  getMasterList(): BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>> {
    return this.recipeMasterList$;
  }

  /**
   * Get a recipe by its id using its master's id to help search
   *
   * @params: masterId - recipe's master's id
   * @params: recipeId - recipe's id
   *
   * @return: observable of requested recipe
  **/
  getRecipeById(masterId: string, recipeId: string): Observable<Recipe> {
    const master$ = this.recipeMasterList$.value.find(_master$ => {
      return _master$.value._id === masterId;
    });
    return Observable.of(master$.value.recipes.find(_recipe => _recipe._id === recipeId));
  }

  /**
   * A recipe will have a process if processSchedule has content
   *
   * @params: recipe - recipe to check for a process
   *
   * @return: true if at least one process is in the schedule
  **/
  isRecipeProcessPresent(recipe: Recipe): boolean {
    return  recipe
            ? recipe.processSchedule.length > 0
            : false;
  }

  /**
   * Remove a recipe in a recipe master in list
   *
   * @params: masterId - recipe's master's id
   * @params: dbResponse - database response with recipe data
   *
   * @return: none
  **/
  removeRecipeFromMasterInList(masterId: string, dbResponse: Recipe): void {
    const master$ = this.getMasterById(masterId);
    const master = master$.value;
    const recipeIndex = getIndexById(dbResponse._id, master.recipes);
    master.recipes.splice(recipeIndex, 1);
    master$.next(master);
  }

  /**
   * Remove a recipe master from the master list and update subject
   *
   * @params: toDelete - the recipe master to delete
   *
   * @return: none
  **/
  removeRecipeMasterFromList(toDelete: RecipeMaster): void {
    const list = this.recipeMasterList$.value;
    const toRemoveIndex = getIndexById(toDelete._id, getArrayFromObservables(list));
    if (toRemoveIndex !== -1) {
      list[toRemoveIndex].complete();
      list.splice(toRemoveIndex, 1);
      this.recipeMasterList$.next(list);
    } else {
      // TODO error feedback on missing recipe master
    }
  }

  /**
   * Update a recipe master subject in the master list
   *
   * @params: updatedRecipeMaster - recipe master with updated values
   *
   * @return: none
  **/
  updateRecipeMasterInList(updatedRecipeMaster: RecipeMaster): void {
    const list = this.recipeMasterList$.value;
    const recipeMaster = list.find(recipeMaster$ => recipeMaster$.value._id === updatedRecipeMaster._id);
    if (recipeMaster !== undefined) {
      recipeMaster.next(updatedRecipeMaster);
      this.recipeMasterList$.next(list);
    } else {
      // TODO error feedback on missing recipe master
    }
  }

  /**
   * Update a recipe in a recipe master in list
   *
   * @params: masterId - recipe's master's id
   * @params: updatedRecipe - recipe to update
   *
   * @return: none
  **/
  updateRecipeOfMasterInList(masterId: string, updatedRecipe: Recipe): void {
    const master$ = this.getMasterById(masterId);
    const master = master$.value;
    const recipeIndex = getIndexById(updatedRecipe._id, master.recipes);
    master.recipes[recipeIndex] = updatedRecipe;
    master$.next(master);
  }

    /***** End utility methods *****/

}
