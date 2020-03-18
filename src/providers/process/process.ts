/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import 'rxjs/add/operator/catch';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { Process } from '../../shared/interfaces/process';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';

@Injectable()
export class ProcessProvider {
  activeBatchList$: BehaviorSubject<Array<BehaviorSubject<Batch>>> = new BehaviorSubject<Array<BehaviorSubject<Batch>>>([]);

  constructor(public http: HttpClient,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider) { }

  /***** API access methods *****/

  /**
   * Complete a batch
   *
   * @params: batchId - batch to end
   *
   * @return: observable of database response of ended batch
  **/
  endBatchById(batchId: string): Observable<Batch> {
    return this.http.delete(`${baseURL}/${apiVersion}/process/in-progress/${batchId}`)
      .map((dbRes: Batch) => {
        this.removeBatchFromList(dbRes);
        return dbRes;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Request server move process to next step, then update local active batch
   *
   * @params: batchId - batch to update
   *
   * @return: observable of updated batch response from server
  **/
  incrementCurrentStep(batchId: string): Observable<Batch> {
    return this.http.get(`${baseURL}/${apiVersion}/process/in-progress/${batchId}/next`)
      .map((updatedBatchResponse: Batch) => {
        this.updateBatchInList(updatedBatchResponse);
        return updatedBatchResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
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
        (recipeMasterList: any) => {
          this.mapActiveBatchArrayToSubjects(recipeMasterList);
        },
        (error: ErrorObservable) => {
          console.log(`${error.error}: awaiting data from server`);
        }
      );
    this.http.get(`${baseURL}/${apiVersion}/process/in-progress`)
      .catch(error => this.processHttpError.handleError(error))
      .subscribe(batchList => {
        this.mapActiveBatchArrayToSubjects(batchList);
        this.updateCache();
      });
  }

  /**
   * Http PATCH update batch
   *
   * @params: batchId - batch id to update
   * @params: update - batch update to apply
   *
   * @return: observable of updated batch response
  **/
  patchBatchById(batchId: string, update: any): Observable<Batch> {
    return this.http.patch(`${baseURL}/${apiVersion}/process/in-progress/${batchId}`, update)
      .map((updatedBatchResponse: Batch) => {
        this.updateBatchInList(updatedBatchResponse);
        return updatedBatchResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
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
  patchStepById(batchId: string, stepId: string, stepUpdate: object): Observable<Process> {
    return this.http.patch(`${baseURL}/${apiVersion}/process/in-progress/${batchId}/step/${stepId}`, stepUpdate)
      .map((updatedBatchResponse: Batch) => {
        this.updateBatchInList(updatedBatchResponse);
        return updatedBatchResponse.schedule[updatedBatchResponse.currentStep];
      })
      .catch(error => this.processHttpError.handleError(error));
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
  startNewBatch(userId: string, masterRecipeId: string, recipeId: string): Observable<Batch> {
    return this.http.get(`${baseURL}/${apiVersion}/process/user/${userId}/master/${masterRecipeId}/recipe/${recipeId}`)
      .map((batchResponse: Batch) => {
        this.addBatchToList(batchResponse);
        return batchResponse;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /***** End API access methods *****/


  /***** Utility methods *****/

  /**
   * Add a new batch to the list of active batches
   *
   * @params: newBatch - the new batch to create a subject of and add to list
   *
   * @return: none
  **/
  addBatchToList(newBatch: Batch): void {
    const batchSubject$ = new BehaviorSubject<Batch>(newBatch);
    const list = this.activeBatchList$.value;
    list.push(batchSubject$);
    this.activeBatchList$.next(list);
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
    this.storageService.removeProcesses();
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
  removeBatchFromList(toRemove: Batch): void {
    const list = this.activeBatchList$.value;
    const toRemoveIndex = list.findIndex(batch$ => batch$.value._id === toRemove._id);
    if (toRemoveIndex !== -1) {
      list[toRemoveIndex].complete();
      list.splice(toRemoveIndex, 1);
      this.activeBatchList$.next(list);
    } else {
      // TODO error feedback on missing batch
    }
  }

  /**
   * Update a batch subject in active batch list
   *
   * @params: updatedBatch - updated batch data
   *
   * @return: none
  **/
  updateBatchInList(updatedBatch: Batch): void {
    const list = this.activeBatchList$.value;
    const batchIndex = list.findIndex(batch$ => {
      return batch$.value._id === updatedBatch._id
    });
    if (batchIndex !== -1 && updatedBatch.currentStep < updatedBatch.schedule.length) {
      list[batchIndex].next(updatedBatch);
      this.activeBatchList$.next(list);
    } else {
      // TODO error feedback on missing batch
    }
  }

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
