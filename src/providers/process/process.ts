/* Module imports */
import { Events } from 'ionic-angular';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { catchError } from 'rxjs/operators/catchError';
import { concat } from 'rxjs/observable/concat';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { take } from 'rxjs/operators/take';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

/* Default imports */
import { defaultEnglish } from '../../shared/defaults/default-units';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { PrimaryValues } from '../../shared/interfaces/primary-values';
import { Process } from '../../shared/interfaces/process';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { SyncData, SyncMetadata, SyncResponse } from '../../shared/interfaces/sync';

/* Utility function imports */
import { getArrayFromObservables, normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';
import { getId, getIndexById, hasDefaultIdType, hasId, isMissingServerId } from '../../shared/utility-functions/id-helpers';

/* Provider imports */
import { CalculationsProvider } from '../calculations/calculations';
import { ClientIdProvider } from '../client-id/client-id';
import { ConnectionProvider } from '../connection/connection';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { RecipeProvider } from '../recipe/recipe';
import { StorageProvider } from '../storage/storage';
import { SyncProvider } from '../sync/sync';
import { UserProvider } from '../user/user';


@Injectable()
export class ProcessProvider {
  activeBatchList$: BehaviorSubject<BehaviorSubject<Batch>[]>
    = new BehaviorSubject<BehaviorSubject<Batch>[]>([]);
  archiveBatchList$: BehaviorSubject<BehaviorSubject<Batch>[]>
    = new BehaviorSubject<BehaviorSubject<Batch>[]>([]);
    syncArchiveRoute: string = `${this.syncBaseRoute}/archive`;
  syncBaseRoute: string = 'process/batch';
  syncErrors: string[] = [];

  constructor(
    public events: Events,
    public http: HttpClient,
    public calculationService: CalculationsProvider,
    public clientIdService: ClientIdProvider,
    public connectionService: ConnectionProvider,
    public processHttpError: ProcessHttpErrorProvider,
    public recipeService: RecipeProvider,
    public storageService: StorageProvider,
    public syncService: SyncProvider,
    public userService: UserProvider,
  ) {
    this.events.subscribe('init-batches', this.initializeBatchLists.bind(this));
    this.events.subscribe('clear-data', this.clearAllBatchLists.bind(this));
    this.events.subscribe('sync-batches-on-signup', this.syncOnSignup.bind(this));
    this.events.subscribe('connected', this.syncOnReconnect.bind(this, false));
  }

  /***** API access methods *****/

  /**
   * Complete a batch by marking it as archived; update database if connected
   * and logged in else set flag for sync
   *
   * @params: batchId - batch id to update; batch must have server id to update
   *                    database
   * @return: observable of ended batch
  **/
  endBatchById(batchId: string): Observable<Batch> {
    const batch$: BehaviorSubject<Batch> = this.getBatchById(batchId);

    if (batch$ === undefined) {
      return throwError(`Batch with id ${batchId} not found`);
    }

    const batch: Batch = batch$.value;
    batch.isArchived = true;

    return this.patchBatch(batch)
      .pipe(
        mergeMap((): Observable<Batch> => {
          return this.archiveActiveBatch(batchId);
        })
      );
  }

  /**
   * Fetch active and archive batches from server and populate memory
   *
   * @params: none
   *
   * @return: observable success requires no additional actions,
   *   using for error handling
  **/
  fetchBatches(): Observable<boolean> {
    return this.http
      .get<{activeBatches: Batch[], archiveBatches: Batch[]}>(
        `${BASE_URL}/${API_VERSION}/process/batch`
      )
      .pipe(
        map(
          (batchListResponse: {
            activeBatches: Batch[],
            archiveBatches: Batch[]
          }) => {
            console.log('batches from server', batchListResponse);

            this.mapBatchArrayToSubjectArray(
              true,
              batchListResponse.activeBatches
            );

            this.mapBatchArrayToSubjectArray(
              false,
              batchListResponse.archiveBatches
            );

            this.updateBatchStorage(true);
            this.updateBatchStorage(false);

            return true;
          }
        ),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
  }

  /**
   * Go to next step of a batch's schedule; update database if connected and
   * logged in else set flag for sync
   *
   * @params: batchId - batch id to update; batch must have server id to update
   *                    database
   * @params: nextIndex - the next process schedule step or -1 to end the batch
   *
   * @return: observable of updated batch
  **/
  incrementCurrentStep(batchId: string, nextIndex: number): Observable<Batch> {
    if (nextIndex === -1) {
      return this.endBatchById(batchId);
    }

    const batch$: BehaviorSubject<Batch> = this.getBatchById(batchId);

    if (batch$ === undefined) {
      return throwError(`Batch with id ${batchId} not found`);
    }

    const batch: Batch = batch$.value;
    batch.process.currentStep = nextIndex;

    return this.patchBatch(batch)
      .pipe(
        map((): Batch => {
          batch$.next(batch);
          this.refreshBatchList(true);
          this.updateBatchStorage(true);
          return batch;
        })
      );
  }

  /**
   * Get all active and archive batches for user, create batch subjects, then
   * populate batch lists
   *
   * Get the batch lists from storage as well as request list from server.
   * If storage is present, load with this list first to help load the app
   * faster, or allow some functionality if offline. HTTP request the list from
   * the server and update the activeBatchList subject when available
   *
   * @params: none
   * @return: none
  **/
  initializeBatchLists(): void {
    this.loadBatchesFromStorage();

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      concat(
        this.syncOnConnection(true),
        this.fetchBatches()
      )
      .subscribe(
        () => {
          this.events.publish('init-inventory');
        },
        (error: ErrorObservable) => {
          // TODO error feedback
          console.log(
            `Batch init error: ${normalizeErrorObservableMessage(error)}`
          )
        }
      );
    } else {
      this.events.publish('init-inventory');
    }
  }

  /**
   * Update a batch; update database if connected and logged in else
   * set flag for sync
   *
   * @params: isActive - true for active batch, false for archive batch
   * @params: batchId - batch id to update; batch must have server id to update
   *                    database
   * @return: Observable of updated batch
  **/
  patchBatch(updatedBatch: Batch): Observable<Batch> {
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      if (isMissingServerId(updatedBatch._id)) {
        return throwError('Batch missing server id');
      }

      return this.http
        .patch<Batch>(
          `${BASE_URL}/${API_VERSION}/process/batch/${updatedBatch._id}`,
          updatedBatch
        )
        .pipe(
          catchError((error: HttpErrorResponse): ErrorObservable => {
            return this.processHttpError.handleError(error)
          })
        );
    }

    this.addSyncFlag('update', getId(updatedBatch));
    return of(updatedBatch);
  }

  /**
   * Patch a batch's measured values in annotations
   *
   * @params: isActive - true for active batch, false for archive batch
   * @params: batchId - id of the batch to update
   * @params: update - primary values to apply to batch
   *
   * @return: observable of updated batch
  **/
  patchMeasuredValues(
    isActive: boolean,
    batchId: string,
    update: PrimaryValues
  ): Observable<Batch> {
    try {
      const batch$: BehaviorSubject<Batch> = this.getBatchById(batchId);
      const batch: Batch = batch$.value;

      const master$: BehaviorSubject<RecipeMaster> = this.recipeService
        .getRecipeMasterById(batch.recipeMasterId);
      const master: RecipeMaster = master$.value;
      const variant: RecipeVariant = master.variants
        .find((variant: RecipeVariant) => {
          return hasId(variant, batch.recipeVariantId);
        });

      update.ABV = this.calculationService.getABV(
        update.originalGravity,
        update.finalGravity
      );
      update.IBU = this.calculationService.calculateTotalIBU(
        variant.hops,
        update.originalGravity,
        update.batchVolume,
        variant.boilVolume
      );
      update.SRM = this.calculationService.calculateTotalSRM(
        variant.grains,
        update.batchVolume
      );

      batch.annotations.measuredValues = update;

      return this.patchBatch(batch)
        .pipe(
          map((): Batch => {
            batch$.next(batch);
            this.refreshBatchList(isActive);
            this.updateBatchStorage(isActive);
            return batch;
          })
        );
    } catch(error) {
      console.log(
        `Update measured values error: ${normalizeErrorObservableMessage(error)}`
      );
      return throwError(error);
    }
  }

  /**
   * Update individual batch step; update database if connected and logged in
   * else set flag for sync
   *
   * @params: batchId - batch id to update; batch must have server id to update
   *                    database
   * @params: stepUpdate - step update object to apply
   *
   * @return: observable of updated batch
  **/
  patchStepById(batchId: string, stepUpdate: object): Observable<Batch> {
    const batch$: BehaviorSubject<Batch> = this.getBatchById(batchId);

    if (batch$ === undefined) {
      return throwError(`Active batch with id ${batchId} not found`);
    }

    const batch: Batch = batch$.value;

    if (batch.owner === null) {
      return throwError('Active batch is missing an owner id');
    }

    if (!stepUpdate.hasOwnProperty('id')) {
      return throwError('Step update missing an id');
    }

    const stepIndex: number = batch.process.schedule
      .findIndex((step: Process) => hasId(step, stepUpdate['id']));

    if (stepIndex === -1) {
      return throwError(`Active batch missing step with id ${stepUpdate['id']}`);
    }

    batch.process.alerts = batch.process.alerts
      .concat(stepUpdate['update']['alerts']);

    batch.process.schedule[stepIndex]['startDatetime']
      = stepUpdate['update']['startDatetime'];

    return this.patchBatch(batch)
      .pipe(
        map((): Batch => {
          batch$.next(batch);
          this.updateBatchStorage(true);
          return batch;
        })
      );
  }

  /**
   * Start a new batch process and add new batch to active list; update database
   * if connected and logged in else set flag for sync; user and recipe must
   * have server id to update database
   *
   * @params: userId - client user's id
   * @params: recipeMasterId - recipe master id that contains the recipe
   * @params: recipeVariantId - recipe variant id to base batch on
   *
   * @return: observable of new batch
  **/
  startNewBatch(
    userId: string,
    recipeMasterId: string,
    recipeVariantId: string
  ): Observable<Batch> {
    return this.generateBatchFromRecipe(userId, recipeMasterId, recipeVariantId)
      .pipe(
        mergeMap((newBatch: Batch) => {
          if (newBatch === undefined) {
            return throwError('Unable to generate new batch: missing recipe');
          }

          if (
            this.connectionService.isConnected()
            && this.userService.isLoggedIn()
          ) {
            return this.http
              .post<Batch>(
                `${BASE_URL}/${API_VERSION}/process/user/${userId}/master/${recipeMasterId}/variant/${recipeVariantId}`,
                newBatch
              )
              .pipe(
                mergeMap((batchResponse: Batch): Observable<Batch> => {
                  return this.addBatchToActiveList(batchResponse);
                }),
                catchError((error: HttpErrorResponse): ErrorObservable => {
                  return this.processHttpError.handleError(error)
                })
              );
          }

          this.addSyncFlag('create', newBatch.cid)
          return this.addBatchToActiveList(newBatch);
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
    if (index >= this.syncErrors.length || index < 0) {
      throw new Error('Invalid sync error index');
    }
    this.syncErrors.splice(index, 1);
  }

  /**
   * Get an array of batches that have sync flags
   *
   * @params: isActive - true for active batch, false for archive batch
   *
   * @return: Array of behavior subjects of batches
  **/
  getFlaggedBatches(isActive: boolean): BehaviorSubject<Batch>[] {
    return this.getBatchList(isActive)
      .value
      .filter((batch$: BehaviorSubject<Batch>): boolean => {
        return this.syncService.getAllSyncFlags()
          .some((syncFlag: SyncMetadata): boolean => {
            return hasId(batch$.value, syncFlag.docId);
          });
      });
  }

  /**
   * Process sync successes to update in memory docs
   *
   * @params: syncedData - an array of successfully synced docs; deleted docs
   *                       contain additional isDeleted flag
   *
   * @return: none
  **/
  processSyncSuccess(syncData: (Batch | SyncData)[]): void {
    syncData.forEach((_syncData: Batch | SyncData): void => {
      if (_syncData['isDeleted'] === undefined) {
        const batch$: BehaviorSubject<Batch>
          = this.getBatchById((<Batch>_syncData).cid);

        if (batch$ === undefined) {
          this.syncErrors.push(
            `Batch with id: '${(<Batch>_syncData).cid}' not found`
          );
        } else {
          batch$.next(<Batch>_syncData);
        }
      }
    });

    this.getBatchList(true).next(this.getBatchList(true).value);
    this.getBatchList(false).next(this.getBatchList(false).value);
  }

  /**
   * Process all sync flags on a login or reconnect event
   *
   * @params: onLogin - true if calling at login, false on reconnect
   *
   * @return: none
  **/
  syncOnConnection(onLogin: boolean): Observable<boolean> {
    // Ignore reconnects if not logged in
    if (!onLogin && !this.userService.isLoggedIn()) {
      return of(false);
    }

    const requests
      : (Observable<
          HttpErrorResponse
          | Batch
          | SyncData
        >)[] = [];

    this.syncService.getSyncFlagsByType('batch')
      .forEach((syncFlag: SyncMetadata): void => {
        const batch$: BehaviorSubject<Batch> = this.getBatchById(syncFlag.docId);

        if (batch$ === undefined && syncFlag.method !== 'delete') {
          requests.push(
            throwError(
              `Sync error: Batch with id '${syncFlag.docId}' not found`
            )
          );
          return;
        } else if (syncFlag.method === 'delete') {
          requests.push(
            this.syncService.deleteSync(
              `${this.syncBaseRoute}/${syncFlag.docId}`
            )
          );
          return;
        }

        const batch: Batch = batch$.value;

        if (hasDefaultIdType(batch.recipeMasterId)) {
          const recipeMaster$: BehaviorSubject<RecipeMaster>
            = this.recipeService.getRecipeMasterById(batch.recipeMasterId);

          if (
            recipeMaster$ === undefined
            || hasDefaultIdType(recipeMaster$.value._id)
          ) {
            requests.push(
              throwError(
                'Sync error: Cannot get batch owner\'s id'
              )
            );
            return;
          }
          batch.recipeMasterId = recipeMaster$.value._id;
        }

        if (syncFlag.method === 'update' && isMissingServerId(batch._id)) {
          requests.push(
            throwError(
              `Batch with id: ${batch.cid} is missing its server id`
            )
          );
        } else if (syncFlag.method === 'create') {
          batch['forSync'] = true;
          requests.push(
            this.syncService.postSync(
              this.syncBaseRoute,
              batch
            )
          );
        } else if (
          syncFlag.method === 'update'
          && !isMissingServerId(batch._id)
        ) {
          requests.push(
            this.syncService.patchSync(
              `${this.syncBaseRoute}/${batch._id}`,
              batch
            )
          );
        } else {
          requests.push(
            throwError(
              `Sync error: Unknown sync flag method '${syncFlag.method}'`
            )
          );
        }
      });

    return this.syncService.sync('batch', requests)
      .pipe(
        map((responses: SyncResponse): boolean => {
          if (!onLogin) {
            this.processSyncSuccess(<(Batch | SyncData)[]>(responses.successes));
            this.updateBatchStorage(true);
            this.updateBatchStorage(false);
          }
          this.syncErrors = responses.errors;
          return true;
        })
      );
  }

  /**
   * Network reconnect event handler; process sync flags on reconnect - only if
   * signed in
   *
   * @params: none
   * @params: none
  **/
  syncOnReconnect(): void {
    this.syncOnConnection(false)
      .subscribe(
        (): void => {}, // Nothing further required if successful
        (error: ErrorObservable): void => {
          // TODO error feedback (toast?)
          console.log(normalizeErrorObservableMessage(error));
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
    console.log('batch on signup');
    const requests: (Observable<HttpErrorResponse | Batch>)[] = [];

    const batchList: BehaviorSubject<Batch>[] = this.getAllBatchesList();

    batchList.forEach((batch$: BehaviorSubject<Batch>): void => {
      const recipe$: BehaviorSubject<RecipeMaster>
        = this.recipeService.getRecipeMasterById(batch$.value.recipeMasterId);

      if (recipe$ === undefined || isMissingServerId(recipe$.value._id)) {
        requests.push(
          throwError(
            `Recipe with id ${batch$.value.recipeMasterId} not found`
          )
        );
        return;
      }

      const payload: Batch = batch$.value;
      payload['recipeMasterId'] = recipe$.value._id;
      payload['forSync'] = true;
      requests.push(
        this.syncService.postSync(
          this.syncBaseRoute,
          payload
        )
      );
    });

    this.syncService.sync('batch', requests)
      .subscribe((responses: SyncResponse): void => {
        this.processSyncSuccess(<(Batch | SyncData)[]>(responses.successes));
        this.syncErrors = responses.errors;
        this.updateBatchStorage(true);
        this.events.publish('sync-inventory-on-signup');
      });
  }

  /***** End Sync methods *****/


  /***** Utility methods *****/

  /**
   * Add a new batch to the list of active batches
   *
   * @params: newBatch - the new batch to with which to create a subject and add
   *                     active batch list to list
   *
   * @return: Observable of the new batch
  **/
  addBatchToActiveList(newBatch: Batch): Observable<Batch> {
    const batchList$: BehaviorSubject<BehaviorSubject<Batch>[]>
      = this.getBatchList(true);
    const batchList: BehaviorSubject<Batch>[] = batchList$.value;
    const batchSubject$: BehaviorSubject<Batch>
      = new BehaviorSubject<Batch>(newBatch);

    batchList.push(batchSubject$);
    batchList$.next(batchList);
    this.updateBatchStorage(true);
    return batchSubject$;
  }

  /**
   * Change an active batch to an archive batch; update their respective lists
   *
   * @params: batchId - batch id to convert
   *
   * @return: none
  **/
  archiveActiveBatch(batchId: string): Observable<Batch> {
    const batch$: BehaviorSubject<Batch> = this.getBatchById(batchId);

    if (batch$ === undefined) {
      return throwError(
        `Active batch with id: ${batchId} could not be archived`
      );
    }

    const batch: Batch = batch$.value;
    batch.isArchived = true;
    batch$.next(batch);

    const archiveList$: BehaviorSubject<BehaviorSubject<Batch>[]>
      = this.getBatchList(false);
    const archiveList: BehaviorSubject<Batch>[] = archiveList$.value;

    archiveList.push(batch$);
    archiveList$.next(archiveList);

    this.updateBatchStorage(false);

    return this.removeBatchFromList(true, batchId);
  }

  /**
   * Clear active or archive list
   *
   * @params: isActive - true for active batch list, false for archive batch list
   *
   * @return: none
  **/
  clearBatchList(isActive: boolean): void {
    const batchList$: BehaviorSubject<BehaviorSubject<Batch>[]>
      = this.getBatchList(isActive);

    batchList$.value.forEach((batch$: BehaviorSubject<Batch>): void => {
      batch$.complete()
    });
    batchList$.next([]);

    this.storageService.removeBatches(isActive);
  }

  /**
   * Clear all active and archive batches and clear storage on user logout
   *
   * @params: none
   * @return: none
  **/
  clearAllBatchLists(): void {
    this.clearBatchList(true);
    this.clearBatchList(false);
  }

  /**
   * Create a batch using a recipe process schedule as template
   *
   * @params: userId - the user's id
   * @params: recipeMasterId - the recipe's master id
   * @params: recipeVariantId - the recipe variant id from which to copy the schedule
   *
   * @return: Observable of new batch
  **/
  generateBatchFromRecipe(
    userId: string,
    recipeMasterId: string,
    recipeVariantId: string
  ): Observable<Batch> {
    const recipeMaster$: BehaviorSubject<RecipeMaster> = this.recipeService
      .getRecipeMasterById(recipeMasterId);

    return recipeMaster$
      .pipe(
        take(1),
        map((recipeMaster: RecipeMaster): Batch => {
          if (recipeMaster === undefined) {
            return undefined;
          }

          const variant = recipeMaster.variants
            .find((variant: RecipeVariant): boolean => {
              return hasId(variant, recipeVariantId)
            });

          if (variant === undefined) {
            return undefined;
          }

          const newBatch: Batch = {
            cid: this.clientIdService.getNewId(),
            createdAt: (new Date()).toISOString(),
            owner: userId,
            recipeMasterId: recipeMasterId,
            recipeVariantId: recipeVariantId,
            isArchived: false,
            annotations: {
              styleId: recipeMaster.style._id,
              units: defaultEnglish,
              targetValues: {
                efficiency: variant.efficiency,
                originalGravity: variant.originalGravity,
                finalGravity: variant.finalGravity,
                batchVolume: variant.batchVolume,
                ABV: variant.ABV,
                IBU: variant.IBU,
                SRM: variant.SRM
              },
              measuredValues: {
                efficiency: -1,
                originalGravity: -1,
                finalGravity: -1,
                batchVolume: -1,
                ABV: -1,
                IBU: -1,
                SRM: -1
              },
              notes: []
            },
            process: {
              currentStep: 0,
              alerts: [],
              schedule: Array.from(
                variant.processSchedule,
                (process: Process): Process => {
                  const copy: object = { cid: this.clientIdService.getNewId() };
                  for (const key in process) {
                    if (key !== '_id') {
                      copy[key] = process[key];
                    }
                  }
                  return <Process>copy;
                }
              )
            },
            contextInfo: {
              recipeMasterName: recipeMaster.name,
              recipeVariantName: variant.variantName,
              recipeImageURL: recipeMaster.labelImageURL
            }
          };
          return newBatch;
        })
      );
  }

  /**
   * Get a combined list of active and archive batches
   *
   * @params: none
   *
   * @return: array of batch behavior subjects
  **/
  getAllBatchesList(): BehaviorSubject<Batch>[] {
    return this.getBatchList(true).value.concat(this.getBatchList(false).value);
  }

  /**
   * Search both active and archive lists and get a batch by its id
   *
   * @params: batchId - id to search
   *
   * @return: Batch behavior subject or undefined if not found
  **/
  getBatchById(batchId: string): BehaviorSubject<Batch> {
    const active$: BehaviorSubject<Batch> = this.getBatchList(true).value
      .find((batch$: BehaviorSubject<Batch>): boolean => {
        return hasId(batch$.value, batchId);
      });

    if (active$ !== undefined) return active$;

    return this.getBatchList(false).value
      .find((batch$: BehaviorSubject<Batch>): boolean => {
        return hasId(batch$.value, batchId);
      });
  }

  /**
   * Get active or archive batch list subject
   *
   * @params: isActive - true for active batch, false for archive batch
   *
   * @return: subject of array of batch subjects
  **/
  getBatchList(isActive: boolean): BehaviorSubject<BehaviorSubject<Batch>[]> {
    return isActive ? this.activeBatchList$: this.archiveBatchList$;
  }

  /**
   * Convert an array of active or archive batches into a BehaviorSubject of an
   * array of BehaviorSubjects of the respective batches; Combine with any
   * batch subjects already in the list that have an outstanding sync flag
   *
   * @params: isActive - true for active batches, false for archive batches
   * @params: batchList - array of batches
   *
   * @return: none
  **/
  mapBatchArrayToSubjectArray(isActive: boolean, batchList: Batch[]): void {
    const currentBatchList$: BehaviorSubject<BehaviorSubject<Batch>[]>
      = this.getBatchList(isActive);
    const syncList: BehaviorSubject<Batch>[] = this.getFlaggedBatches(isActive);

    currentBatchList$.next(
      batchList
        .map((batch: Batch): BehaviorSubject<Batch> => {
          return new BehaviorSubject<Batch>(batch);
        })
        .concat(syncList)
    );
  }

  refreshBatchList(isActive: boolean): void {
    const list$: BehaviorSubject<BehaviorSubject<Batch>[]>
      = this.getBatchList(isActive);
    list$.next(list$.value);
  }

  /**
   * Remove a batch from a batch list
   *
   * @params: isActive - true for active batch, false for archive batch
   * @params: batchId - batch id to remove from list
   *
   * @return: Observable of null, using for error throw/handling
  **/
  removeBatchFromList(isActive: boolean, batchId: string): Observable<Batch> {
    const batchList$: BehaviorSubject<BehaviorSubject<Batch>[]>
      = this.getBatchList(isActive);
    const batchList: BehaviorSubject<Batch>[] = batchList$.value;

    const indexToRemove: number
      = getIndexById(batchId, getArrayFromObservables(batchList));

    if (indexToRemove === -1) {
      return throwError(
        `Delete error: ${isActive ? 'Active': 'Archive'} batch with id ${batchId} not found`
      );
    }

    batchList[indexToRemove].complete();
    batchList.splice(indexToRemove, 1);
    this.refreshBatchList(isActive);
    this.updateBatchStorage(isActive);

    return of(null);
  }

  /**
   * Update a step of a batch in an active batch
   *
   * @params: batch - the batch the step belongs to
   * @params: stepUpdate - updated step values to apply
   *
   * @return the updated parent batch of the updated step
  **/
  updateStepOfBatchInList(batch: Batch, stepUpdate: object): Batch {
    const activeBatch$: BehaviorSubject<Batch> = this.getBatchById(getId(batch));

    if (activeBatch$ === undefined) {
      throw new Error(
        `Active batch with id ${getId(batch)} not found`
      );
    }

    const activeBatch: Batch = activeBatch$.value;
    if (activeBatch.owner === null) {
      throw new Error(
        `Active batch is missing an owner id`
      );
    }

    const stepIndex: number = activeBatch.process.schedule
      .findIndex((step: Process): boolean => hasId(step, stepUpdate['id']));

    if (stepIndex === -1) {
      throw new Error(
        `Active batch missing step with id ${stepUpdate['id']}`
      );
    }

    activeBatch.process.alerts
      = activeBatch.process.alerts.concat(stepUpdate['update']['alerts']);
    activeBatch.process.schedule[stepIndex]['startDatetime']
      = stepUpdate['update']['startDatetime'];

    activeBatch$.next(activeBatch);
    this.updateBatchStorage(true);

    return activeBatch;
  }

  /***** End utility methods *****/


  /***** Storage methods *****/

  /**
   * Load active and archive batches from storage
   *
   * @params: none
   * @return: none
  **/
  loadBatchesFromStorage(): void {
    // Get active batches from storage, do not overwrite if batches from server
    this.storageService.getBatches(true)
      .subscribe(
        (activeBatchList: Batch[]): void => {
          console.log('active batches from storage');
          if (this.activeBatchList$.value.length === 0) {
            this.mapBatchArrayToSubjectArray(true, activeBatchList);
          }
        },
        (error: ErrorObservable): void => {
          console.log(
            `${normalizeErrorObservableMessage(error)}: awaiting active batch data from server`
          )
        }
      );

    // Get archive batches from storage, do not overwrite if batches from server
    this.storageService.getBatches(false)
      .subscribe(
        (archiveBatchList: Batch[]): void => {
          console.log('archived batches from storage');
          if (this.archiveBatchList$.value.length === 0) {
            this.mapBatchArrayToSubjectArray(false, archiveBatchList);
          }
        },
        (error: ErrorObservable): void => {
          console.log(
            `${normalizeErrorObservableMessage(error)}: awaiting archive batch data from server`
          )
        }
      );
  }

  /**
   * Update active or archive batch storage
   *
   * @params: isActive - true for active batches, false for archive batches
   *
   * @return: none
  **/
  updateBatchStorage(isActive: boolean): void {
    const batchList$: BehaviorSubject<BehaviorSubject<Batch>[]> =
      this.getBatchList(isActive);

    this.storageService.setBatches(
      isActive,
      batchList$.value.map(
        (batch$: BehaviorSubject<Batch>): Batch => batch$.value
      )
    )
    .subscribe(
      (): void => {
        console.log(`stored ${ isActive ? 'active': 'archive' } batches`)
      },
      (error: ErrorObservable): void => {
        console.log(
          `${ isActive ? 'active': 'archive' } batch store error: ${normalizeErrorObservableMessage(error)}`
        );
      }
    );
  }

  /***** End storage methods *****/

}
