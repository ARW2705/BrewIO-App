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
import { Batch } from '../../shared/interfaces/batch';
import { Process } from '../../shared/interfaces/process';
import { Recipe } from '../../shared/interfaces/recipe';

/* Utility function imports */
import { getIndexById } from '../../shared/utility-functions/utilities';
import { getArrayFromObservables } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { UserProvider } from '../user/user';
import { RecipeProvider } from '../recipe/recipe';
import { ConnectionProvider } from '../connection/connection';


@Injectable()
export class ProcessProvider {
  activeBatchList$: BehaviorSubject<Array<BehaviorSubject<Batch>>> = new BehaviorSubject<Array<BehaviorSubject<Batch>>>([]);

  constructor(
    public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public connectionService: ConnectionProvider
  ) {
    this.events.subscribe('init-data', this.initializeActiveBatchList.bind(this));
    this.events.subscribe('clear-data', this.clearProcesses.bind(this));
  }

  /***** API access methods *****/

  /**
   * Complete a batch, update database if connected and logged in
   *
   * @params: batchId - batch to end
   *
   * @return: observable of ended batch
  **/
  endBatchById(batchId: string): Observable<Batch> {
    if (this.connectionService.isConnected()) {
      return this.http.delete(`${baseURL}/${apiVersion}/process/in-progress/${batchId}`)
        .flatMap(() => {
          return this.removeBatchFromList(batchId);
        })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.removeBatchFromList(batchId);
  }

  /**
   * Go to next step of a batch's schedule, update database if connected and
   * logged in
   *
   * @params: batchId - batch to update
   * @params: nextIndex - the next process schedule step to go to, -1 to end the batch
   *
   * @return: observable of updated batch
  **/
  incrementCurrentStep(batch: Batch, nextIndex: number): Observable<Batch> {
    if (nextIndex === -1) return this.endBatchById(batch._id);

    try {
      batch.currentStep = nextIndex;
      const updatedBatch = this.updateBatchInList(batch);
      if (this.connectionService.isConnected()) {
        return this.http.patch(`${baseURL}/${apiVersion}/process/in-progress/${batch._id}`, updatedBatch)
          .catch(error => this.processHttpError.handleError(error));
      }
      return Observable.of(updatedBatch);
    } catch(error) {
      return throwError(error.message);
    }
  }

  /**
   * Get all active batches for user, create active batch subject, then
   * populate active batch list
   *
   * Get the active batches list from storage as well as request list from server.
   * If storage is present, load with this list first to help load the app faster,
   * or allow some functionality if offline. HTTP request the list from the
   * server and update the activeBatchList subject when available
   *
   * @params: none
   * @return: none
  **/
  initializeActiveBatchList(): void {
    this.storageService.getBatches()
      .subscribe(
        (activeBatchList: any) => {
          this.mapActiveBatchArrayToSubjects(activeBatchList);
        },
        (error: ErrorObservable) => console.log(`${error.error}: awaiting data from server`)
      );
    if (this.connectionService.isConnected()) {
      this.http.get(`${baseURL}/${apiVersion}/process/in-progress`)
        .catch(error => this.processHttpError.handleError(error))
        .subscribe(
          batchList => {
            this.mapActiveBatchArrayToSubjects(batchList);
            this.updateStorage();
          },
          error => {
            // TODO error feedback
            console.log(error);
          }
        );
    }
  }

  /**
   * Update individual batch step - update database if connected and logged in
   *
   * @params: batchId - batch id to update
   * @params: stepId - step id to update
   * @params: stepUpdate - step update to apply
   *
   * @return: observable of updated batch
  **/
  patchBatchStepById(batch: Batch, stepId: string, stepUpdate: object): Observable<Batch> {
    try {
      const updatedBatch = this.updateStepOfBatchInList(batch, stepId, stepUpdate)
      if (this.connectionService.isConnected()) {
        return this.http.patch<Batch>(`${baseURL}/${apiVersion}/process/in-progress/${batch._id}`, updatedBatch)
          .map((updatedBatchResponse: Batch) => {
            return updatedBatchResponse;
          })
          .catch(error => this.processHttpError.handleError(error));
      }
      return Observable.of(updatedBatch);
    } catch(error) {
      return throwError(error.message);
    }
  }

  /**
   * Start a new batch process, add new batch to list, then return the batch
   *
   * @params: userId - client user's id
   * @params: masterRecipeId - recipe master id that contains the recipe
   * @params: recipeId - recipe to base batch on
   *
   * @return: observable of new batch from server response
  **/
  startNewBatch(userId: string, masterRecipeId: string, recipeId: string): Observable<Batch | any> {
    const user = this.userService.getUser().value;
    if (this.connectionService.isConnected()) {
      return this.http.get(`${baseURL}/${apiVersion}/process/user/${userId}/master/${masterRecipeId}/recipe/${recipeId}`)
        .flatMap((batchResponse: Batch) => {
          return this.addBatchToList(batchResponse);
        })
        .catch(error => this.processHttpError.handleError(error));
    } else if (user._id === userId) {
      return this.generateBatchFromRecipe(masterRecipeId, recipeId, userId)
        .flatMap((batch: Batch) => {
          return this.addBatchToList(batch);
        });
    }
    return throwError('Must be connected to internet to use a public recipe');
  }

  /**
   * Update a step of a batch in activeBatchList
   *
   * @params: batch - the batch the step belongs to
   * @params: stepId - id of the step to update
   * @params: stepUpdate - updated step values to apply
   *
   * @return the updated parent batch of the updated step
  **/
  updateStepOfBatchInList(batch: Batch, stepId: string, stepUpdate: object): Batch {
    const activeBatch$ = this.getActiveBatchById(batch._id);
    const activeBatch = activeBatch$.value;

    if (activeBatch.owner === null) throw new Error('Active batch is missing an owner id');

    const stepIndex = activeBatch.schedule.findIndex(step => step._id === stepId);

    if (stepIndex === -1) throw new Error(`Active batch missing step with id ${stepId}`);

    activeBatch.alerts = activeBatch.alerts.concat(stepUpdate['alerts']);
    activeBatch.schedule[stepIndex]['startDatetime'] = stepUpdate['startDatetime'];

    activeBatch$.next(activeBatch);
    this.updateStorage();
    return activeBatch;
  }

  /***** End API access methods *****/


  /***** Utility methods *****/

  /**
   * Add a new batch to the list of active batches
   *
   * @params: newBatch - the new batch to create a subject of and add to list
   *
   * @return: Observable of the new batch
  **/
  addBatchToList(newBatch: Batch): Observable<Batch> {
    const batchSubject$ = new BehaviorSubject<Batch>(newBatch);
    const batchList = this.activeBatchList$.value;
    batchList.push(batchSubject$);
    this.activeBatchList$.next(batchList);
    this.updateStorage();
    return batchSubject$;
  }

  /**
   * Call complete for all recipes and clear recipeMasterList array on user logout
   *
   * @params: none
   * @return: none
  **/
  clearProcesses(): void {
    this.activeBatchList$.value.forEach(batch$ => {
      batch$.complete();
    });
    this.activeBatchList$.next([]);
    this.storageService.removeBatches();
  }

  /**
   * Create a batch using a recipe process schedule as template
   *
   * @params: masterRecipeId - the recipe's master id
   * @params: recipeId - the recipe id from which to copy the schedule
   * @params: userId - the user's id (offline)
   *
   * @return: Observable of new batch
  **/
  generateBatchFromRecipe(masterRecipeId: string, recipeId: string, userId: string): Observable<Batch> {
    const now = Date.now();
    return this.recipeService.getRecipeById(masterRecipeId, recipeId)
      .map((recipe: Recipe) => {
        const newBatch: Batch = {
          _id: Date.now().toString(),
          createdAt: (new Date()).toISOString(),
          owner: userId,
          currentStep: 0,
          recipe: recipeId,
          schedule: Array.from(recipe.processSchedule, (process, index) => {
            const copy = { _id: (now + index).toString() };
            for (const key in process) {
              if (key !== '_id') {
                copy[key] = process[key];
              }
            }
            return <Process>copy;
          }),
          alerts: []
        };
        return newBatch;
      });
  }

  /**
   * Get active batch from list by id
   *
   * @params: batchId - id of batch to retrieve
   *
   * @return: requested batch subject
  **/
  getActiveBatchById(batchId: string): BehaviorSubject<Batch> {
    const found = this.activeBatchList$.value.find(batch$ => batch$.value._id === batchId);
    return  (found !== undefined)
            ? found
            : null;
  }

  /**
   * Get the active batches list subject
   *
   * @params: none
   *
   * @return: subject of array of batch subjects
  **/
  getActiveBatchesList(): BehaviorSubject<Array<BehaviorSubject<Batch>>> {
    return this.activeBatchList$;
  }

  /**
   * Convert an array of active batches into a BehaviorSubject of an array of
   * BehaviorSubjects of active batches
   *
   * @params: activeBatchList - array of recipe masters
   *
   * @return: none
  **/
  mapActiveBatchArrayToSubjects(activeBatchList: Array<Batch>): void {
    this.activeBatchList$.next(
      activeBatchList.map(activeBatch => {
        return new BehaviorSubject<Batch>(activeBatch);
      })
    );
  }

  /**
   * Remove a batch from active batches
   *
   * @params: batchId - batch id to remove from list
   *
   * @return: Observable of null, using for error throw/handling
  **/
  removeBatchFromList(batchId: string): Observable<Batch> {
    const batchList = this.activeBatchList$.value;
    const indexToRemove = getIndexById(batchId, getArrayFromObservables(batchList));

    if (indexToRemove === -1) return throwError(`Delete error: Active batch with id ${batchId} not found`);

    batchList[indexToRemove].complete();
    batchList.splice(indexToRemove, 1);
    this.activeBatchList$.next(batchList);
    this.updateStorage();

    return Observable.of(null);
  }

  /**
   * Update a batch subject in active batch list
   *
   * @params: updatedBatch - updated batch data may be complete or partial Batch
   *
   * @return: updated Batch
  **/
  updateBatchInList(update: Batch | object): Batch {
    const activeBatchList = this.activeBatchList$.value;
    const batchIndex = activeBatchList.findIndex(batch$ => batch$.value._id === update['_id']);

    if (batchIndex === -1) throw new Error(`Active batch with id ${update['_id']} not found`);

    const activeBatch$ = activeBatchList[batchIndex];
    const activeBatch = activeBatch$.value;
    for (const key in update) {
      if (activeBatch.hasOwnProperty(key)) {
        activeBatch[key] = update[key];
      }
    }

    activeBatch$.next(activeBatch);
    this.activeBatchList$.next(activeBatchList);
    this.updateStorage();
    return activeBatch;
  }

  /**
   * Update the storage with current active batch list
   *
   * @params: none
   * @return: none
  **/
  updateStorage(): void {
    this.storageService.setBatches(
      this.activeBatchList$.value.map(
        (activeBatch$: BehaviorSubject<Batch>) => activeBatch$.value
      )
    )
    .subscribe(
      () => console.log('stored active batches'),
      (error: ErrorObservable) => console.log('active batch store error', error)
    );
  }

  /***** End utility methods *****/

}
