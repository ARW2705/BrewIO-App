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

  constructor(public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public connectionService: ConnectionProvider) {
      this.events.subscribe('init-data', this.initializeActiveBatchList.bind(this));
      this.events.subscribe('clear-data', this.clearProcesses.bind(this));
  }

  /***** API access methods *****/

  /**
   * Complete a batch
   *
   * @params: batchId - batch to end
   *
   * @return: observable of database response of ended batch
  **/
  endBatchById(batchId: string): Observable<Batch> {
    if (this.connectionService.isConnected()) {
      return this.http.delete(`${baseURL}/${apiVersion}/process/in-progress/${batchId}`)
        .flatMap(() => { return this.removeBatchFromList(batchId); })
        .catch(error => this.processHttpError.handleError(error));
    }
    return this.removeBatchFromList(batchId);
  }

  /**
   * Request server move process to next step, then update local active batch
   *
   * @params: batchId - batch to update
   *
   * @return: observable of updated batch response from server
  **/
  incrementCurrentStep(batch: Batch, nextIndex: number): Observable<Batch> {
    if (nextIndex === -1) return this.endBatchById(batch._id);
    batch.currentStep = nextIndex;
    const updatedBatch = this.updateBatchInList(batch);
    if (this.connectionService.isConnected()) {
      return this.http.patch(`${baseURL}/${apiVersion}/process/in-progress/${batch._id}`, updatedBatch)
        .catch(error => this.processHttpError.handleError(error));
    }
    return Observable.of(updatedBatch);
  }

  /**
   * Http GET all active batches for user, create active batch subject, then
   * populate active batch list
   *
   * @params: none
   *
   * @return: none
  **/
  initializeActiveBatchList(): void {
    this.storageService.getProcesses()
      .subscribe(
        (activeBatchList: any) => {
          this.mapActiveBatchArrayToSubjects(activeBatchList);
        },
        (error: ErrorObservable) => console.log(`${error.error}: awaiting data from server`)
      );
    if (this.connectionService.isConnected()) {
      this.http.get(`${baseURL}/${apiVersion}/process/in-progress`)
        .catch(error => this.processHttpError.handleError(error))
        .subscribe(batchList => {
          this.mapActiveBatchArrayToSubjects(batchList);
          this.updateCache();
        });
    }
  }

  /**
   * Http PATCH update batch individual step
   *
   * @params: batchId - batch id to update
   * @params: stepId - step id to update
   * @params: update - step update to apply
   *
   * @return: observable of updated batch
  **/
  patchBatchStepById(batch: Batch, stepId: string, stepUpdate: object): Observable<Batch> {
    const updatedBatch = this.updateStepOfBatchInList(batch, stepId, stepUpdate)
    if (this.connectionService.isConnected()) {
      return this.http.patch<Batch>(`${baseURL}/${apiVersion}/process/in-progress/${batch._id}`, updatedBatch)
        .map((updatedBatchResponse: Batch) => {
          return updatedBatchResponse;
        })
        .catch(error => this.processHttpError.handleError(error));
    }
    return Observable.of(updatedBatch);
  }

  updateStepOfBatchInList(batch: Batch, stepId: string, stepUpdate: object): Batch {
    const activeBatch$ = this.getActiveBatchById(batch._id);
    const activeBatch = activeBatch$.value;

    if (activeBatch.owner === null) throw throwError('Active batch is missing an owner id');

    const stepIndex = activeBatch.schedule.findIndex(step => step._id === stepId);

    if (stepIndex === -1) throw throwError(`Active batch missing step with id ${stepId}`);

    activeBatch.alerts = activeBatch.alerts.concat(stepUpdate['alerts']);
    activeBatch.schedule[stepIndex]['startDatetime'] = stepUpdate['startDatetime'];

    activeBatch$.next(activeBatch);
    this.updateCache();
    return activeBatch;
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
        .map((batchResponse: Batch) => {
          return this.addBatchToList(batchResponse);
        })
        .catch(error => this.processHttpError.handleError(error));
    } else if (user._id === userId) {
      return this.generateBatchFromRecipe(masterRecipeId, recipeId, userId)
        .map((batch: Batch) => {
          return this.addBatchToList(batch);
        });
    }
    return throwError('Must be connected to internet to use a public recipe');
  }
  // startNewBatch(userId: string, masterRecipeId: string, recipeId: string): Observable<Batch> {
  //   return this.http.get(`${baseURL}/${apiVersion}/process/user/${userId}/master/${masterRecipeId}/recipe/${recipeId}`)
  //     .map((batchResponse: Batch) => {
  //       this.addBatchToList(batchResponse);
  //       return batchResponse;
  //     })
  //     .catch(error => this.processHttpError.handleError(error));
  // }



  /***** End API access methods *****/


  /***** Utility methods *****/

  /**
   * Add a new batch to the list of active batches
   *
   * @params: newBatch - the new batch to create a subject of and add to list
   *
   * @return: none
  **/
  addBatchToList(newBatch: Batch): Batch {
    const batchSubject$ = new BehaviorSubject<Batch>(newBatch);
    const batchList = this.activeBatchList$.value;
    batchList.push(batchSubject$);
    this.activeBatchList$.next(batchList);
    this.updateCache();
    return batchSubject$.value;
  }
  // addBatchToList(newBatch: Batch): void {
  //   const batchSubject$ = new BehaviorSubject<Batch>(newBatch);
  //   const list = this.activeBatchList$.value;
  //   list.push(batchSubject$);
  //   this.activeBatchList$.next(list);
  // }

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
    this.storageService.removeProcesses();
  }

  generateBatchFromRecipe(masterRecipeId: string, recipeId: string, userId: string): Observable<Batch> {
    const now = Date.now();
    return this.recipeService.getRecipeById(masterRecipeId, recipeId)
      .map((recipe: Recipe) => {
        const newBatch: Batch = {
          _id: Date.now().toString(),
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
    const found = this.activeBatchList$.value.find(batch$ => batch$.value._id == batchId);
    if (found !== undefined) {
      return found;
    } else {
      return new BehaviorSubject<Batch>({
        _id: null,
        owner: null,
        currentStep: null,
        recipe: null,
        schedule: null,
        alerts: null
      });
    }
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
   * @params: toRemove - batch to remove from list
   *
   * @return: none
  **/
  removeBatchFromList(batchId: string): Observable<Batch> {
    const batchList = this.activeBatchList$.value;
    const indexToRemove = getIndexById(batchId, getArrayFromObservables(batchList));

    if (indexToRemove === -1) throw throwError(`Delete error: Active batch with id ${batchId} not found`);

    batchList[indexToRemove].complete();
    batchList.splice(indexToRemove, 1);
    this.activeBatchList$.next(batchList);
    this.updateCache();
    return Observable.of(null);
  }
  // removeBatchFromList(toRemove: Batch): void {
  //   const list = this.activeBatchList$.value;
  //   const toRemoveIndex = list.findIndex(batch$ => batch$.value._id === toRemove._id);
  //   if (toRemoveIndex !== -1) {
  //     list[toRemoveIndex].complete();
  //     list.splice(toRemoveIndex, 1);
  //     this.activeBatchList$.next(list);
  //   } else {
  //     // TODO error feedback on missing batch
  //   }
  // }

  /**
   * Update a batch subject in active batch list
   *
   * @params: updatedBatch - updated batch data
   *
   * @return: none
  **/
  updateBatchInList(update: Batch | object): Batch {
    const activeBatchList = this.activeBatchList$.value;
    const batchIndex = activeBatchList.findIndex(batch$ => batch$.value._id === update['_id']);

    if (batchIndex === -1) throw throwError(`Active batch with id ${update['_id']} not found`);

    const activeBatch$ = activeBatchList[batchIndex];
    const activeBatch = activeBatch$.value;
    for (const key in update) {
      if (activeBatch.hasOwnProperty(key)) {
        activeBatch[key] = update[key];
      }
    }

    activeBatch$.next(activeBatch);
    this.activeBatchList$.next(activeBatchList);
    this.updateCache();
    return activeBatch;
  }
  // updateBatchInList(updatedBatch: Batch): void {
  //   const list = this.activeBatchList$.value;
  //   const batchIndex = list.findIndex(batch$ => {
  //     return batch$.value._id === updatedBatch._id
  //   });
  //   if (batchIndex !== -1 && updatedBatch.currentStep < updatedBatch.schedule.length) {
  //     list[batchIndex].next(updatedBatch);
  //     this.activeBatchList$.next(list);
  //   } else {
  //     // TODO error feedback on missing batch
  //   }
  // }

  /**
   * Update the cache with current active batch list
   *
   * @params: none
   * @return: none
  **/
  updateCache(): void {
    this.storageService.setProcesses(this.activeBatchList$.value.map((activeBatch$: BehaviorSubject<Batch>) => activeBatch$.value))
      .subscribe(
        () => console.log('stored active batches'),
        (error: ErrorObservable) => console.log('active batch store error', error)
      );
  }

  /***** End utility methods *****/

}
