/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/catch';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { Process } from '../../shared/interfaces/process';

/* Utility function imports */
import { getIndexById } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class ProcessProvider {
  activeBatchList$: BehaviorSubject<Array<BehaviorSubject<Batch>>> = new BehaviorSubject<Array<BehaviorSubject<Batch>>>([]);

  constructor(public http: HttpClient,
    public processHttpError: ProcessHttpErrorProvider) { }

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
    this.http.get(`${baseURL}/${apiVersion}/process/in-progress`)
      .catch(error => this.processHttpError.handleError(error))
      .subscribe(batchList => {
        this.activeBatchList$.next(
          batchList.map(activeBatch => {
            return new BehaviorSubject<Batch>(activeBatch);
          })
        );
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
  patchStepById(batchId: string, stepId: string, stepUpdate: any): Observable<Process> {
    return this.http.patch(`${baseURL}/${apiVersion}/process/in-progress/${batchId}/step/${stepId}`, stepUpdate)
      .map((updatedStepResponse: Process) => {
        this.updateStepOfBatchInList(batchId, stepId, updatedStepResponse);
        return updatedStepResponse;
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
      console.log('completed process');
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
   * Update a specific step in a batch, then update the batch subject
   *
   * @params: batchId - id of parent batch
   * @params: stepId - step id to update
   * @params: updatedProcess - updated process step
   *
   * @return: none
  **/
  updateStepOfBatchInList(batchId: string, stepId: string, updatedProcess: Process): void {
    const list = this.activeBatchList$.value;
    const batch$ = list.find(_batch$ => _batch$.value._id === batchId);
    const batch = batch$.value;
    const stepIndex = getIndexById(stepId, batch.schedule);
    batch.schedule[stepIndex] = updatedProcess;
    batch$.next(batch);
  }

    /***** End utility methods *****/

}
