/* Module imports */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { _throw as throwError } from 'rxjs/observable/throw';
import { map } from 'rxjs/operators/map';
import { catchError } from 'rxjs/operators/catchError';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { of } from 'rxjs/observable/of';
import { concat } from 'rxjs/observable/concat';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { syncMethods } from '../../shared/constants/sync-methods';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { Process } from '../../shared/interfaces/process';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { SyncResponse } from '../../shared/interfaces/sync-response';
import { SyncMetadata } from '../../shared/interfaces/sync-metadata';

/* Utility function imports */
import { getIndexById } from '../../shared/utility-functions/utilities';
import { getArrayFromObservables } from '../../shared/utility-functions/utilities';
import { getId } from '../../shared/utility-functions/utilities';
import { hasId } from '../../shared/utility-functions/utilities';
import { missingServerId } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { UserProvider } from '../user/user';
import { RecipeProvider } from '../recipe/recipe';
import { ConnectionProvider } from '../connection/connection';
import { SyncProvider } from '../sync/sync';
import { ClientIdProvider } from '../client-id/client-id';


@Injectable()
export class ProcessProvider {
  activeBatchList$: BehaviorSubject<Array<BehaviorSubject<Batch>>> = new BehaviorSubject<Array<BehaviorSubject<Batch>>>([]);
  syncErrors: Array<string> = [];
  syncBaseRoute: string = 'process/batch';

  constructor(
    public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public userService: UserProvider,
    public recipeService: RecipeProvider,
    public connectionService: ConnectionProvider,
    public syncService: SyncProvider,
    public clientIdService: ClientIdProvider
  ) {
    this.events.subscribe('init-data', this.initializeActiveBatchList.bind(this));
    this.events.subscribe('clear-data', this.clearProcesses.bind(this));
    this.events.subscribe('sync-on-signup', this.syncOnSignup.bind(this));
    this.events.subscribe('connected', this.syncOnReconnect.bind(this, false));
  }

  /***** API access methods *****/

  /**
   * Complete a batch; update database if connected and logged in else set
   * flag for sync
   *
   * @params: batchId - batch to end
   *
   * @return: observable of ended batch
  **/
  endBatchById(batchId: string): Observable<Batch> {
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.delete(`${baseURL}/${apiVersion}/process/batch/${batchId}`)
        .pipe(
          mergeMap(() => {
            return this.removeBatchFromList(batchId);
          }),
          catchError((error: HttpErrorResponse) => this.processHttpError.handleError(error))
        );
    } else {
      this.addSyncFlag('delete', batchId);
    }
    return this.removeBatchFromList(batchId);
  }

  /**
   * Go to next step of a batch's schedule; update database if connected and
   * logged in else set flag for sync
   *
   * @params: batchId - batch to update
   * @params: nextIndex - the next process schedule step to go to, -1 to end the batch
   *
   * @return: observable of updated batch
  **/
  incrementCurrentStep(batch: Batch, nextIndex: number): Observable<Batch> {
    if (nextIndex === -1) return this.endBatchById(getId(batch));

    try {
      batch.currentStep = nextIndex;
      const updatedBatch: Batch = this.updateBatchInList(batch);
      if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
        return this.http.patch(`${baseURL}/${apiVersion}/process/batch/${batch._id}`, updatedBatch)
          .pipe(catchError((error: HttpErrorResponse) => this.processHttpError.handleError(error)));
      } else {
        this.addSyncFlag('update', getId(batch));
      }
      return of(updatedBatch);
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
        (activeBatchList: Array<Batch>) => {
          console.log('batches from storage');
          if (this.activeBatchList$.value.length === 0) {
            this.mapActiveBatchArrayToSubjects(activeBatchList);
          }
        },
        (error: ErrorObservable) => console.log(`${error}: awaiting data from server`)
      );
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      concat(
        this.syncOnConnection(true),
        this.http.get(`${baseURL}/${apiVersion}/process/batch`)
          .pipe(
            map((activeBatchArrayResponse: Array<Batch>) => {
              console.log('batches from server');
              this.mapActiveBatchArrayToSubjects(activeBatchArrayResponse);
              this.updateBatchStorage();
            }),
            catchError((error: HttpErrorResponse) => this.processHttpError.handleError(error))
          )
      )
      .subscribe(
        () => {}, // Nothing further required if successful
        error => {
          // TODO error feedback
          console.log('batch init error', error);
        }
      );
    }
  }

  /**
   * Update an active batch; update database if connected and logged in else
   * set flag for sync
   *
   * @params: batchId - batch id to update
   *
   * @return: Observable of updated batch
  **/
  patchBatch(batch: Batch): Observable<Batch> {
    try {
      const updatedBatch: Batch = this.updateBatchInList(batch);
      if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
        return this.http.patch<Batch>(`${baseURL}/${apiVersion}/process/batch/${batch._id}`, batch)
          .pipe(catchError((error: HttpErrorResponse) => this.processHttpError.handleError(error)));
      }
      this.addSyncFlag('update', getId(batch));
      return of(updatedBatch);
    } catch(error) {
      return throwError(error.message);
    }
  }

  /**
   * Update individual batch step; update database if connected and logged in
   * else set flag for sync
   *
   * @params: batchId - batch id to update
   * @params: stepId - step id to update
   * @params: stepUpdate - step update to apply
   *
   * @return: observable of updated batch
  **/
  patchBatchStepById(batch: Batch, stepId: string, stepUpdate: object): Observable<Batch> {
    try {
      const updatedBatch: Batch = this.updateStepOfBatchInList(batch, stepId, stepUpdate)
      if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
        return this.http.patch<Batch>(`${baseURL}/${apiVersion}/process/batch/${batch._id}`, updatedBatch)
          .pipe(catchError((error: HttpErrorResponse) => this.processHttpError.handleError(error)));
      }
      this.addSyncFlag('update', getId(batch));
      return of(updatedBatch);
    } catch(error) {
      return throwError(error.message);
    }
  }

  /**
   * Start a new batch process and add new batch to list; update database if
   * connected and logged in else set flag for sync
   *
   * @params: userId - client user's id
   * @params: recipeMasterId - recipe master id that contains the recipe
   * @params: recipeVariantId - recipe variant id to base batch on
   *
   * @return: observable of new batch
  **/
  startNewBatch(userId: string, recipeMasterId: string, recipeVariantId: string): Observable<Batch | any> {
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.get(`${baseURL}/${apiVersion}/process/user/${userId}/master/${recipeMasterId}/variant/${recipeVariantId}`)
        .pipe(
          mergeMap((batchResponse: Batch) => {
            return this.addBatchToList(batchResponse);
          }),
          catchError((error: HttpErrorResponse) => this.processHttpError.handleError(error))
        );
    }
    return this.generateBatchFromRecipe(recipeMasterId, recipeVariantId, userId)
      .pipe(
        mergeMap((batch: Batch) => {
          this.addSyncFlag('create', batch.cid)
          return this.addBatchToList(batch);
        })
      );
  }

  /***** End API access methods *****/


  /***** Sync methods *****/

  /**
   * Add a sync flag for a batch
   *
   * @params: method - options: 'create', 'update', or 'delete'
   * @params: docId - document id to apply sync
   *
   * @return: none
  **/
  addSyncFlag(method: string, docId: string): void {
    this.syncService.addSyncFlag({
      method: method,
      docId: docId,
      docType: 'batch'
    });
  }

  /**
   * Clear all sync errors
   *
   * @params: none
   * @return: none
  **/
  dismissAllErrors(): void {
    this.syncErrors = [];
  }

  /**
   * Clear a sync error at the given index
   *
   * @params: index - error array index
   *
   * @return: none
  **/
  dismissError(index: number): void {
    if (index >= this.syncErrors.length || index < 0) throw new Error('Invalid sync error index');
    this.syncErrors.splice(index, 1);
  }

  /**
   * Get an array of batches that have sync flags
   *
   * @params: none
   *
   * @return: Array of behavior subjects of batches
  **/
  getFlaggedBatches(): Array<BehaviorSubject<Batch>> {
    return this.getActiveBatchesList()
      .value
      .filter(
          (activeBatch$: BehaviorSubject<Batch>) => {
          return this.syncService.getAllSyncFlags().some((syncFlag: SyncMetadata) => {
            return hasId(activeBatch$.value, syncFlag.docId);
          });
        }
      );
  }

  /**
   * Process sync successes to update in memory docs
   *
   * @params: syncedData - an array of successfully synced docs
   *
   * @return: none
  **/
  processSyncSuccess(syncData: Array<Batch | object>): void {
    syncData.forEach((_syncData: any) => {
      if (_syncData['isDeleted']) {
        this.removeBatchFromList(_syncData['data']['_id']);
      } else {
        const batch$: BehaviorSubject<Batch> = this.getActiveBatchById(_syncData.cid);
        if (batch$ === undefined) {
          this.syncErrors.push(`Batch with id: '${_syncData.cid}' not found`);
        } else {
          batch$.next(_syncData);
        }
      }
    });
  }

  /**
   * Process all sync flags on a login or reconnect event
   *
   * @params: onLogin - true if calling sync at login, false for sync on reconnect
   *
   * @return: none
  **/
  syncOnConnection(onLogin: boolean): Observable<boolean> {
    // Ignore reconnects if not logged in
    if (!onLogin && !this.userService.isLoggedIn()) return of(false);

    const requests: Array<any> = [];
    this.syncService.getSyncFlagsByType('batch').forEach((syncFlag: SyncMetadata) => {
      const batch$: BehaviorSubject<Batch> = this.getActiveBatchById(syncFlag.docId);

      if (syncMethods.includes(syncFlag.method)) {
        if (batch$ === undefined && syncFlag.method !== 'delete') {
          requests.push(throwError(`Sync error: Batch with id '${syncFlag.docId}' not found`));
        } else if (syncFlag.method === 'update' && missingServerId(batch$.value._id)) {
          requests.push(throwError(`Batch with id: ${batch$.value.cid} is missing its server id`));
        } else if (syncFlag.method === 'create') {
          batch$.value['forSync'] = true;
          requests.push(this.syncService.postSync(this.syncBaseRoute, batch$.value));
        } else if (syncFlag.method === 'update' && !missingServerId(batch$.value._id)) {
          requests.push(this.syncService.patchSync(`${this.syncBaseRoute}/${batch$.value._id}`, batch$.value));
        } else if (syncFlag.method === 'delete') {
          requests.push(this.syncService.deleteSync(`${this.syncBaseRoute}/${syncFlag.docId}`));
        }
      } else {
        requests.push(throwError(`Sync error: Unknown sync flag method '${syncFlag.method}'`));
      }
    });

    return this.syncService.sync('batch', requests)
      .pipe(
        map((responses: SyncResponse) => {
          console.log('sync complete');
          if (!onLogin) {
            this.processSyncSuccess(responses.successes);
            this.updateBatchStorage();
          }
          this.syncErrors = responses.errors;
          return true;
        })
      );
  }

  /**
   * Network reconnect event handler
   * Process sync flags on reconnect - only if signed in
   *
   * @params: none
   * @params: none
  **/
  syncOnReconnect(): void {
    this.syncOnConnection(false)
      .subscribe(
        () => {}, // Nothing further required if successful
        (error: ErrorObservable) => {
          // TODO error feedback (toast?)
          console.log(error);
        }
      );
  }

  /**
   * Post all stored batches to server
   *
   * @params: none
   * @return: none
  **/
  syncOnSignup(): void {
    const requests: Array<any> = [];
    const batchList$: BehaviorSubject<Array<BehaviorSubject<Batch>>> = this.getActiveBatchesList();
    const batchList: Array<BehaviorSubject<Batch>> = batchList$.value;

    batchList.forEach(batch$ => {
      const recipe$: BehaviorSubject<RecipeMaster> = this.recipeService.getRecipeMasterByRecipeId(batch$.value.recipe);

      if (recipe$ === undefined) {
        requests.push(throwError(`Recipe with id ${batch$.value.recipe} not found`));
        return;
      }

      const payload: Batch = batch$.value;
      payload['forSync'] = true;
      requests.push(this.syncService.postSync(this.syncBaseRoute, payload));
    });

    this.syncService.sync('batch', requests)
      .subscribe((responses: SyncResponse) => {
        this.processSyncSuccess(responses.successes);
        this.syncErrors = responses.errors;
        this.updateBatchStorage();
      });
  }

  /***** End Sync methods *****/


  /***** Utility methods *****/

  /**
   * Add a new batch to the list of active batches
   *
   * @params: newBatch - the new batch to create a subject of and add to list
   *
   * @return: Observable of the new batch
  **/
  addBatchToList(newBatch: Batch): Observable<Batch> {
    const batchSubject$: BehaviorSubject<Batch> = new BehaviorSubject<Batch>(newBatch);
    const batchList: Array<BehaviorSubject<Batch>> = this.activeBatchList$.value;
    batchList.push(batchSubject$);
    this.activeBatchList$.next(batchList);
    this.updateBatchStorage();
    return batchSubject$;
  }

  /**
   * Call complete for all recipes and clear activeBatchList on user logout
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
   * @params: recipeMasterId - the recipe's master id
   * @params: recipeVariantId - the recipe variant id from which to copy the schedule
   * @params: userId - the user's id
   *
   * @return: Observable of new batch
  **/
  generateBatchFromRecipe(recipeMasterId: string, recipeVariantId: string, userId: string): Observable<Batch> {
    return this.recipeService.getRecipeVariantById(recipeMasterId, recipeVariantId)
      .pipe(
        map((recipe: RecipeVariant) => {
          const newBatch: Batch = {
            cid: this.clientIdService.getNewId(),
            createdAt: (new Date()).toISOString(),
            owner: userId,
            currentStep: 0,
            recipe: getId(recipe),
            schedule: Array.from(
              recipe.processSchedule,
              process => {
                const copy: object = { cid: this.clientIdService.getNewId() };
                for (const key in process) {
                  if (key !== '_id') {
                    copy[key] = process[key];
                  }
                }
                return <Process>copy;
              }
            ),
            alerts: []
          };
          return newBatch;
        })
      );
  }

  /**
   * Get active batch from list by id
   *
   * @params: batchId - id of batch to retrieve
   *
   * @return: requested batch subject or undefined if not present
  **/
  getActiveBatchById(batchId: string): BehaviorSubject<Batch> {
    return this.activeBatchList$.value.find(batch$ => {
      return hasId(batch$.value, batchId);
    });
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
    const currentBatchList$: BehaviorSubject<Array<BehaviorSubject<Batch>>> = this.getActiveBatchesList();
    const syncList: Array<BehaviorSubject<Batch>> = this.getFlaggedBatches();
    currentBatchList$.next(
      activeBatchList
        .map(activeBatch => {
          return new BehaviorSubject<Batch>(activeBatch);
        })
        .concat(syncList)
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
    const batchList: Array<BehaviorSubject<Batch>> = this.activeBatchList$.value;
    const indexToRemove: number = getIndexById(batchId, getArrayFromObservables(batchList));

    if (indexToRemove === -1) return throwError(`Delete error: Active batch with id ${batchId} not found`);

    batchList[indexToRemove].complete();
    batchList.splice(indexToRemove, 1);
    this.activeBatchList$.next(batchList);
    this.updateBatchStorage();

    return of(null);
  }

  /**
   * Update a batch subject in active batch list
   *
   * @params: update - updated batch data may be complete or partial Batch
   *
   * @return: updated Batch
  **/
  updateBatchInList(update: Batch | object): Batch {
    const activeBatchList: Array<BehaviorSubject<Batch>> = this.activeBatchList$.value;
    const batchIndex: number = activeBatchList.findIndex(batch$ => hasId(batch$.value, getId(update)));

    if (batchIndex === -1) throw new Error(`Active batch with id ${update['_id']} not found`);

    const activeBatch$: BehaviorSubject<Batch> = activeBatchList[batchIndex];
    const activeBatch: Batch = activeBatch$.value;
    for (const key in update) {
      if (activeBatch.hasOwnProperty(key)) {
        activeBatch[key] = update[key];
      }
    }

    activeBatch$.next(activeBatch);
    this.activeBatchList$.next(activeBatchList);
    this.updateBatchStorage();

    return activeBatch;
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
    const activeBatch$: BehaviorSubject<Batch> = this.getActiveBatchById(getId(batch));
    if (activeBatch$ === undefined) throw new Error(`Active batch with id ${getId(batch)} not found`);

    const activeBatch: Batch = activeBatch$.value;
    if (activeBatch.owner === null) throw new Error('Active batch is missing an owner id');

    const stepIndex: number = activeBatch.schedule.findIndex(step => hasId(step, stepId));

    if (stepIndex === -1) throw new Error(`Active batch missing step with id ${stepId}`);

    activeBatch.alerts = activeBatch.alerts.concat(stepUpdate['alerts']);
    activeBatch.schedule[stepIndex]['startDatetime'] = stepUpdate['startDatetime'];

    activeBatch$.next(activeBatch);
    this.updateBatchStorage();
    return activeBatch;
  }

  /**
   * Update the storage with current active batch list
   *
   * @params: none
   * @return: none
  **/
  updateBatchStorage(): void {
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
