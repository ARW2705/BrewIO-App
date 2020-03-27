/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { OtherIngredients } from '../../shared/interfaces/other-ingredients';
import { Process } from '../../shared/interfaces/process';

/* Utility function imports */
import { clone } from '../../shared/utility-functions/utilities';
import { stripSharedProperties } from '../../shared/utility-functions/utilities';
import { getIndexById } from '../../shared/utility-functions/utilities';
import { getArrayFromObservables } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { UserProvider } from '../user/user';
import { ConnectionProvider } from '../connection/connection';


@Injectable()
export class RecipeProvider {
  recipeMasterList$: BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>> = new BehaviorSubject<Array<BehaviorSubject<RecipeMaster>>>([]);

  constructor(public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public userService: UserProvider,
    public connectionService: ConnectionProvider) {
      this.events.subscribe('init-data', this.initializeRecipeMasterList.bind(this));
      this.events.subscribe('clear-data', this.clearRecipes.bind(this))
  }

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
   * Delete a recipe from its master - update database if logged in and
   * connected to internet
   *
   * @params: masterId - recipe's master's id
   * @params: recipeId - recipe id to delete
   *
   * @return: Observable success does not need data, but using for error throw/handling
  **/
  deleteRecipeById(masterId: string, recipeId: string): Observable<boolean> {
    const master$ = this.getMasterById(masterId);
    if (master$.value.recipes.length < 2) return throwError('At least one recipe must remain');

    if (this.connectionService.isConnected()) {
      return this.http.delete(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}/recipe/${recipeId}`)
        .flatMap(() => { return this.removeRecipeFromMasterInList(master$, recipeId); })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.removeRecipeFromMasterInList(master$, recipeId);
  }

  /**
   * Delete a recipe master and its child recipes - update database if logged in
   * and connected to internet
   *
   * @params: masterId - recipe master id string to search and delete
   *
   * @return: Observable success does not need data, but using for error throw/handling
  **/
  deleteRecipeMasterById(masterId: string): Observable<boolean> {
    if (this.connectionService.isConnected()) {
      return this.http.delete(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}`)
        .flatMap(() => { return this.removeRecipeMasterFromList(masterId); })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.removeRecipeMasterFromList(masterId);
  }

  /**
   * Http GET all recipe masters for user, create recipe master subject, then
   * populate recipeMasterList$

   * Get the recipe master list from cache as well as request list from server.
   * If cache is present, load with this list first to help load the app faster,
   * or allow some functionality if offline. HTTP request the list from the
   * server and update the recipeMasterList subject when available
   *
   * @params: none
   * @return: none
  **/
  initializeRecipeMasterList(): void {
    this.storageService.getRecipes()
      .subscribe(
        (recipeMasterList: any) => {
          console.log('recipes from cache');
          this.mapRecipeMasterArrayToSubjects(recipeMasterList);
        },
        (error: ErrorObservable) => console.log(`${error.error}: awaiting data from server`)
      );
    if (this.connectionService.isConnected()) {
      this.http.get(`${baseURL}/${apiVersion}/recipes/private/user`)
        .catch(error => this.processHttpError.handleError(error))
        .subscribe((recipeMasterArrayResponse: Array<RecipeMaster>) => {
          console.log('recipes from server');
          this.mapRecipeMasterArrayToSubjects(recipeMasterArrayResponse);
          this.updateCache();
        });
    }
  }

  /**
   * Update a recipe master - update database if logged in and connected to internet
   *
   * @params: masterId - recipe master id string to search
   * @params: update - key:value pairs to apply
   *
   * @return: observable of updated recipe master
  **/
  patchRecipeMasterById(masterId: string, update: object): Observable<RecipeMaster> {
    if (this.connectionService.isConnected()) {
      return this.http.patch(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}`, update)
        .flatMap((updatedRecipeMasterResponse: RecipeMaster) => {
          return this.updateRecipeMasterInList(masterId, updatedRecipeMasterResponse);
        })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.updateRecipeMasterInList(masterId, update);
  }

  /**
   * Update a recipe - update database if logged in and connected to internet
   *
   * @params: masterId - recipe's master's id to search
   * @params: recipeId - recipe to update id
   * @params: update - key:value pairs of updated data to apply
   *
   * @return: observable of the updated recipe
  **/
  patchRecipeById(masterId: string, recipeId: string, update: object): Observable<Recipe> {
    const master$ = this.getMasterById(masterId);

    // ensure at least one recipe is marked as master
    if (
      update.hasOwnProperty('isMaster')
      && !update['isMaster']
      && master$.value.recipes.length < 2
    ) {
      return throwError('At least one recipe is required to be set as master');
    }

    if (this.connectionService.isConnected()) {
      return this.http.patch(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}/recipe/${recipeId}`, update)
        .flatMap((updatedRecipeResponse: Recipe) => { return this.updateRecipeOfMasterInList(master$, recipeId, updatedRecipeResponse); })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.updateRecipeOfMasterInList(master$, recipeId, update);
  }

  /**
   * Create a new recipe master to user - update database if logged in and
   * connected to internet
   *
   * @params: master - object with master data as well as an initial recipe
   *
   * @return: observable of new recipe master
  **/
  postRecipeMaster(master: object): Observable<RecipeMaster> {
    if (this.connectionService.isConnected()) {
      const _master = clone(master);
      const styleId = _master.master.style._id;
      stripSharedProperties(_master);
      _master.master.style = styleId;
      return this.http.post(`${baseURL}/${apiVersion}/recipes/private/user`, _master)
        .flatMap((newRecipeMaster: RecipeMaster) => {
          return this.addRecipeMasterToList(newRecipeMaster);
        })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.addRecipeMasterToList(master);
  }

  /**
   * Create a new recipe and add to its master's list - update database if
   * logged in and connected to internet
   *
   * @params: masterId - recipe master id string to search
   * @params: recipe - the new recipe to add
   *
   * @return: observable of server response with new recipe
  **/
  postRecipeToMasterById(masterId: string, recipe: Recipe): Observable<Recipe> {
    if (this.connectionService.isConnected()) {
      const _recipe = clone(recipe);
      stripSharedProperties(_recipe);
      return this.http.post(`${baseURL}/${apiVersion}/recipes/private/master/${masterId}`, _recipe)
        .flatMap((newRecipeResponse: Recipe) => {
          return this.addRecipeToMasterInList(masterId, newRecipeResponse);
        })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.addRecipeToMasterInList(masterId, recipe);
  }

  /***** END private access methods *****/


  /***** Utility methods *****/

  /**
   * Apply new recipe master to behavior subject
   *
   * @params: newRecipeMaster - the new recipe master to add, will already be a
   * properly formatted RecipeMaster if returned from server response, otherwise
   * formatting is performed here
   *
   * @return: Observable of new recipe master
  **/
  addRecipeMasterToList(newRecipeMasterData: object): Observable<RecipeMaster> {
    const user = this.userService.getUser().value;
    if (user._id === undefined) return throwError('Missing user id');

    let recipeMasterSubject$;

    if (this.connectionService.isConnected() && RegExp('^[^0-9]+$', 'g').test(newRecipeMasterData['_id'])) {
      recipeMasterSubject$ = new BehaviorSubject<RecipeMaster>(<RecipeMaster>newRecipeMasterData);
    } else {
      const now = Date.now();
      const recipeMasterId = newRecipeMasterData['_id'] === undefined ? now.toString(): newRecipeMasterData['_id'];

      const initialRecipe: Recipe = newRecipeMasterData['recipe'];

      if (newRecipeMasterData['_id'] === undefined) this.populateRecipeIds(initialRecipe);

      initialRecipe.isMaster = true;
      initialRecipe.owner = recipeMasterId;

      const masterData = newRecipeMasterData['master'];
      recipeMasterSubject$ = new BehaviorSubject<RecipeMaster>({
        _id: recipeMasterId,
        name: masterData.name,
        style: masterData.style,
        notes: masterData.notes,
        master: initialRecipe._id,
        owner: user._id,
        hasActiveBatch: false,
        isPublic: false,
        recipes: [initialRecipe]
      });
    }

    const list = this.recipeMasterList$.value;
    list.push(recipeMasterSubject$);
    this.recipeMasterList$.next(list);
    this.updateCache();
    return recipeMasterSubject$;
  }

  /**
   * Add a recipe to the recipe master and update behavior subject
   *
   * @params: masterId - recipe's master's id
   * @params: recipe - recipe to add, will already be a properly formatted Recipe
   * if returned from server response, otherwise formatting is performed here
   *
   * @return: Observable of new recipe
  **/
  addRecipeToMasterInList(masterId: string, recipe: Recipe): Observable<Recipe> {
    const master$ = this.getMasterById(masterId);
    const master = master$.value;
    recipe.owner = master._id;
    if (recipe._id === undefined || recipe._id === 'default') this.populateRecipeIds(recipe);
    master.recipes.push(recipe);

    if (recipe.isMaster) {
      this.setRecipeAsMaster(master, master.recipes.length - 1);
    }

    master$.next(master);
    this.updateCache();
    return Observable.of(recipe);
  }

  /**
   * Call complete for all recipes and clear recipeMasterList array
   *
   * @params: none
   * @return: none
  **/
  clearRecipes(): void {
    this.recipeMasterList$.value.forEach(recipe$ => {
      recipe$.complete();
    });
    this.recipeMasterList$.next([]);
    this.storageService.removeRecipes();
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
   * Convert an array of recipe masters into a BehaviorSubject of an array of
   * BehaviorSubjects of recipe masters
   *
   * @params: recipeMasterList - array of recipe masters
   *
   * @return: none
  **/
  mapRecipeMasterArrayToSubjects(recipeMasterList: Array<RecipeMaster>): void {
    this.recipeMasterList$.next(
      recipeMasterList.map(recipeMaster => {
        return new BehaviorSubject<RecipeMaster>(recipeMaster);
      })
    );
  }

  /**
   * Populate recipe _id fields with current unix timestamps if connection to
   * server is not present
   *
   * @params: recipe - Recipe object to update
   *
   * @return: none
  **/
  populateRecipeIds(recipe: Recipe): void {
    recipe._id = Date.now().toString();
    if (recipe.grains.length > 0) this.populateRecipeNestedIds(recipe.grains);
    if (recipe.hops.length > 0) this.populateRecipeNestedIds(recipe.hops);
    if (recipe.yeast.length > 0) this.populateRecipeNestedIds(recipe.yeast);
    if (recipe.otherIngredients.length > 0) this.populateRecipeNestedIds(recipe.otherIngredients);
    if (recipe.processSchedule.length > 0) this.populateRecipeNestedIds(recipe.processSchedule);
  }

  /**
   * Populate all _id fields of each object in array with current unix timestamps
   * if connection to server is not present
   *
   * @params: innerArr - array of objects that require an _id field
   *
   * @return: none
  **/
  populateRecipeNestedIds(innerArr: Array<GrainBill | HopsSchedule | YeastBatch | OtherIngredients | Process>): void {
    const now = Date.now();
    innerArr.forEach((item, index) => {
      item._id = (now + index).toString();
    });
  }

  /**
   * Remove a recipe in a recipe master in list
   *
   * @params: master$ - the recipe's master subject
   * @params: recipeId - recipe _id to remove
   *
   * @return: Observable - success requires no data, using for error throw/handling
  **/
  removeRecipeFromMasterInList(master$: BehaviorSubject<RecipeMaster>, recipeId: string): Observable<boolean> {
    const master = master$.value;
    const recipeIndex = getIndexById(recipeId, master.recipes);

    if (recipeIndex === -1) return throwError(`Delete error: recipe with id ${recipeId} not found`);

    this.removeRecipeAsMaster(master, recipeIndex);
    master.recipes.splice(recipeIndex, 1);
    master$.next(master);
    this.updateCache();
    return Observable.of(true);
  }

  /**
   * Remove a recipe master and its recipes from the master list and update subject
   *
   * @params: masterId - the recipe master to delete
   *
   * @return: Observable - success requires no data, using for error throw/handling
  **/
  removeRecipeMasterFromList(masterId: string): Observable<boolean> {
    const masterList = this.recipeMasterList$.value;
    const indexToRemove = getIndexById(masterId, getArrayFromObservables(masterList));

    if (indexToRemove === -1) return throwError(`Delete error: Recipe master with id ${masterId} not found`);

    masterList[indexToRemove].complete();
    masterList.splice(indexToRemove, 1);
    this.recipeMasterList$.next(masterList);
    this.updateCache();
    return Observable.of(true);
  }

  /**
   * Deselect a recipe as the master, set the first recipe variant in the array
   * that is not the currently selected variant as the new master
   *
   * @params: recipeMaster - the recipe master that the recipe variant belongs to
   * @params: changeIndex - the index of the recipe master's recipes array which
   *                        needs to be changed
   *
   * @return: none
  **/
  removeRecipeAsMaster(recipeMaster: RecipeMaster, changeIndex: number): void {
    recipeMaster.recipes[changeIndex].isMaster = false;
    const newMaster = recipeMaster.recipes[changeIndex === 0 ? 1: 0];
    newMaster.isMaster = true;
    recipeMaster.master = newMaster._id;
  }

  /**
   * Set a recipe variant as the master, deselect previous master
   *
   * @params: recipeMaster - the recipe master that the recipe variant belongs to
   * @params: changeIndex - the index of the recipe master's recipes array which
   *                        needs to be changed
   *
   * @return: none
  **/
  setRecipeAsMaster(recipeMaster: RecipeMaster, changeIndex: number): void {
    recipeMaster.recipes.forEach((recipe, index) => {
      recipe.isMaster = (index === changeIndex);
    });
    recipeMaster.master = recipeMaster.recipes[changeIndex]._id;
  }

  /**
   * Store the current recipe master list in cache
   *
   * @params: none
   * @return: none
  **/
  updateCache(): void {
    this.storageService.setRecipes(this.recipeMasterList$.value.map((recipeMaster$: BehaviorSubject<RecipeMaster>) => recipeMaster$.value))
      .subscribe(
        () => console.log('stored recipes'),
        (error: ErrorObservable) => console.log('recipe store error', error)
      );
  }

  /**
   * Update a recipe master subject in the master list
   *
   * @params: masterId - id of recipe master to update
   * @params: update - update may be either a complete or partial RecipeMaster
   *
   * @return: Observable of updated recipe master
  **/
  updateRecipeMasterInList(masterId: string, update: RecipeMaster | object): Observable<RecipeMaster> {
    const masterList = this.recipeMasterList$.value;
    const masterIndex = masterList.findIndex(recipeMaster$ => recipeMaster$.value._id === masterId);

    if (masterIndex === -1) return throwError(`Update error: Recipe master with id ${masterId} not found`);

    const master$ = masterList[masterIndex];
    const master = master$.value;
    for (const key in update) {
      if (master.hasOwnProperty(key)) {
        master[key] = update[key];
      }
    }

    master$.next(master);
    this.recipeMasterList$.next(masterList);
    this.updateCache();
    return Observable.of(master);
  }

  /**
   * Update a recipe in a recipe master in list and update the subject
   *
   * @params: master$ - recipe master subject the recipe belongs to
   * @params: update - update may be either a complete or partial Recipe
   *
   * @return: Observable of updated recipe
  **/
  updateRecipeOfMasterInList(master$: BehaviorSubject<RecipeMaster>, recipeId: string, update: Recipe | object): Observable<Recipe> {
    const master = master$.value;
    const recipeIndex = getIndexById(recipeId, master.recipes);
    if (recipeIndex === -1) return throwError(`Recipe with id ${recipeId} not found`);

    const recipe = master.recipes[recipeIndex];
    for (const key in update) {
      if (recipe.hasOwnProperty(key)) {
        recipe[key] = update[key];
      }
    }

    if (update.hasOwnProperty('isMaster') && update['isMaster']) {
      this.setRecipeAsMaster(master, recipeIndex);
    }

    master$.next(master);
    this.updateCache();
    return Observable.of(recipe);
  }

  /***** End utility methods *****/

}
