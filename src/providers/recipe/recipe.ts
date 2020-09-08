/* Module imports */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators/catchError';
import { concat } from 'rxjs/observable/concat';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

/* Interface imports */
import { Author } from '../../shared/interfaces/author';
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { OtherIngredients } from '../../shared/interfaces/other-ingredients';
import { Process } from '../../shared/interfaces/process';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { SyncData, SyncMetadata, SyncResponse } from '../../shared/interfaces/sync';
import { User } from '../../shared/interfaces/user';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';

/* Utility function imports */
import { getId, getIndexById, hasDefaultIdType, hasId, isMissingServerId } from '../../shared/utility-functions/id-helpers';
import { getArrayFromObservables, normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Provider imports */
import { ClientIdProvider } from '../client-id/client-id';
import { ConnectionProvider } from '../connection/connection';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { SyncProvider } from '../sync/sync';
import { UserProvider } from '../user/user';


@Injectable()
export class RecipeProvider {
  recipeMasterList$: BehaviorSubject<BehaviorSubject<RecipeMaster>[]>
    = new BehaviorSubject<BehaviorSubject<RecipeMaster>[]>([]);
  syncBaseRoute: string = 'recipes/private';
  syncErrors: string[] = [];
  syncKey: string = 'recipe';

  constructor(
    public events: Events,
    public http: HttpClient,
    public clientIdService: ClientIdProvider,
    public connectionService: ConnectionProvider,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public syncService: SyncProvider,
    public userService: UserProvider
  ) {
    this.events.subscribe('init-recipes', this.initializeRecipeMasterList.bind(this));
    this.events.subscribe('clear-data', this.clearRecipes.bind(this));
    this.events.subscribe('sync-recipes-on-signup', this.syncOnSignup.bind(this));
    this.events.subscribe('connected', this.syncOnReconnect.bind(this, false));
  }

  /***** Public api access methods *****/

  /**
   * Get recipe author data
   *
   * @params: masterId - recipe master to use as base for user search
   *
   * @return: observable of author data
  **/
  getPublicAuthorByRecipeId(masterId: string): Observable<Author> {
    let searchId: string = masterId;

    const master$: BehaviorSubject<RecipeMaster>
      = this.getRecipeMasterById(searchId);

    const user$: BehaviorSubject<User> = this.userService.getUser();
    const user: User = user$.value;

    if (hasId(user, master$.value.owner)) {
      return of({
        username: user.username,
        userImageURL: user.userImage,
        labelImageURL: user.labelImage
      });
    }

    if (hasDefaultIdType(searchId)) {
      searchId = master$.value._id;
      if (searchId === undefined) {
        return throwError('Missing server id');
      }
    }

    return this.http.get<Author>(
      `${BASE_URL}/${API_VERSION}/recipes/public/master/${searchId}/author`
    )
    .pipe(
      catchError((error: HttpErrorResponse): Observable<Author> => {
        console.log('Error fetching author', error);
        const author: Author ={
          username: 'Not Found',
          userImageURL: '',
          labelImageURL: ''
        };
        return of(author);
      })
    );
  }

  /**
   * Get a public recipe master by its id
   *
   * @params: masterId - recipe master id string to search
   *
   * @return: Observable of recipe master
  **/
  getPublicRecipeMasterById(masterId: string): Observable<RecipeMaster> {
    return this.http.get(
      `${BASE_URL}/${API_VERSION}/recipes/public/master/${masterId}`
    )
    .pipe(
      catchError((error: HttpErrorResponse): ErrorObservable => {
        return this.processHttpError.handleError(error);
      })
    );
  }

  /**
   * Get all public recipe masters owned by a user
   *
   * @params: userId - user id string to search
   *
   * @return: Observable of an array of recipe masters
  **/
  getPublicRecipeMasterListByUser(userId: string): Observable<RecipeMaster[]> {
    return this.http.get(
      `${BASE_URL}/${API_VERSION}/recipes/public/${userId}`
    )
    .pipe(
      catchError((error: HttpErrorResponse): ErrorObservable => {
        return this.processHttpError.handleError(error);
      })
    );
  }

  /**
   * Get a public recipe variant by its id
   *
   * @params: masterId - recipe master id which requested recipe belongs
   * @params: variantId - recipe id string to search
   *
   * @return: Observable of recipe
  **/
  getPublicRecipeVariantById(
    masterId: string,
    variantId: string
  ): Observable<RecipeVariant> {
    return this.http.get(
      `${BASE_URL}/${API_VERSION}/recipes/public/master/${masterId}/variant/${variantId}`
    )
    .pipe(
      catchError((error: HttpErrorResponse): ErrorObservable => {
        return this.processHttpError.handleError(error);
      })
    );
  }

  /***** END public api access methods *****/


  /***** Private api access methods *****/

  /**
   * Delete a recipe variant from its master; then update database if logged in and
   * connected to internet or flag for sync otherwise
   *
   * @params: masterId - recipe's master's id
   * @params: variantId - recipe id to delete
   *
   * @return: Observable - success does not need data, using for error throw/handling
  **/
  deleteRecipeVariantById(
    masterId: string,
    variantId: string
  ): Observable<boolean> {
    const master$: BehaviorSubject<RecipeMaster>
      = this.getRecipeMasterById(masterId);

    if (master$ === undefined) {
      return throwError(`Recipe master with id ${masterId} not found`);
    }

    if (master$.value.variants.length < 2) {
      return throwError('At least one recipe must remain');
    }

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.delete(
        `${BASE_URL}/${API_VERSION}/recipes/private/master/${masterId}/variant/${variantId}`
      )
      .pipe(
        mergeMap((): Observable<boolean> => {
          return this.removeRecipeFromMasterInList(master$, variantId);
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error);
        })
      );
    }

    this.addSyncFlag('update', masterId);
    return this.removeRecipeFromMasterInList(master$, variantId);
  }

  /**
   * Delete a recipe master and its variants; then update database if logged in
   * and connected to internet or flag for sync otherwise
   *
   * @params: masterId - recipe master id string to search and delete
   *
   * @return: Observable - success does not need data, using for error throw/handling
  **/
  deleteRecipeMasterById(masterId: string): Observable<boolean> {
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.delete(
        `${BASE_URL}/${API_VERSION}/recipes/private/master/${masterId}`
      )
      .pipe(
        mergeMap((): Observable<boolean> => {
          return this.removeRecipeMasterFromList(masterId);
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error);
        })
      );
    }

    this.addSyncFlag('delete', masterId);
    return this.removeRecipeMasterFromList(masterId);
  }

  /**
   * Get all recipe masters for user from storage and/or server, create recipe
   * master subjects, then populate recipeMasterList
   *
   * Get the recipe master list from storage as well as request list from server.
   * If storage is present, load with this list first to help load the data faster,
   * or allow some functionality if offline. If recipe sync is pending, perform
   * sync operations and HTTP request the list from the server to update the
   * recipeMasterList subject when available
   *
   * @params: none
   * @return: none
  **/
  initializeRecipeMasterList(): void {
    console.log('init recipes', this.recipeMasterList$.value);
    // Get recipes from storage
    this.storageService.getRecipes()
      .subscribe(
        (recipeMasterList: Array<RecipeMaster>): void => {
          console.log('recipes from storage');
          if (!this.recipeMasterList$.value.length && recipeMasterList.length) {
            this.mapRecipeMasterArrayToSubjects(recipeMasterList);
          }
        },
        (error: ErrorObservable): void => {
          console.log(
            `${normalizeErrorObservableMessage(error)}: awaiting data from server`
          );
        }
      );

    // Process sync flags if present, then get recipes from server
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      console.log('try concat')
      concat(
        this.syncOnConnection(true),
        this.http.get(`${BASE_URL}/${API_VERSION}/recipes/private`)
          .pipe(
            map((recipeMasterArrayResponse: Array<RecipeMaster>): void => {
              console.log('recipes from server');
              this.mapRecipeMasterArrayToSubjects(recipeMasterArrayResponse);
              this.updateRecipeStorage();
            }),
            catchError((error: HttpErrorResponse): ErrorObservable => {
              return this.processHttpError.handleError(error);
            })
          )
      )
      .subscribe(
        (): void => {
          this.events.publish('init-batches');
        },
        (error: ErrorObservable): void => {
          // TODO error feedback (toast?)
          console.log(
            `Initialization error: ${normalizeErrorObservableMessage(error)}`
          );
        }
      );
    } else {
      this.events.publish('init-batches');
    }
  }

  /**
   * Update a recipe master; then update database if logged in and connected to
   * internet or flag for sync otherwise
   *
   * @params: masterId - recipe master id string to search
   * @params: update - object containing update data
   *
   * @return: observable of updated recipe master
  **/
  patchRecipeMasterById(masterId: string, update: object): Observable<RecipeMaster> {
    let requestId: string = masterId;

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      // A server id is required for request; if a cid is given, try to find the
      // associated document's server id
      if (hasDefaultIdType(masterId)) {
        const master$: BehaviorSubject<RecipeMaster>
          = this.getRecipeMasterById(masterId);

        if (master$ === undefined) {
          return throwError(`Recipe with id: ${masterId} not found`);
        }

        const id: string = getId(master$.value);

        if (hasDefaultIdType(id)) {
          return throwError(
            `Found recipe with id: ${masterId}, but unable to perform request at this time`
          );
        } else {
          requestId = id;
        }
      }

      return this.http.patch(
        `${BASE_URL}/${API_VERSION}/recipes/private/master/${requestId}`,
        update
      )
      .pipe(
        mergeMap(
          (updatedRecipeMasterResponse: RecipeMaster)
          : Observable<RecipeMaster> => {
            return this.updateRecipeMasterInList(
              masterId,
              updatedRecipeMasterResponse
            );
          }
        ),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error);
        })
      );
    }

    this.addSyncFlag('update', masterId);
    return this.updateRecipeMasterInList(masterId, update);
  }

  /**
   * Update a recipe variant; update database if logged in and connected to
   * internet or flag for sync otherwise
   *
   * @params: masterId - recipe variant's parent master id
   * @params: variantId - variant to update id
   * @params: update - object containing update data
   *
   * @return: observable of the updated recipe
  **/
  patchRecipeVariantById(
    masterId: string,
    variantId: string,
    update: object
  ): Observable<RecipeVariant> {
    const master$: BehaviorSubject<RecipeMaster>
      = this.getRecipeMasterById(masterId);

    if (master$ === undefined) {
      return throwError(`Recipe master with id ${masterId} not found`);
    }

    // ensure at least one recipe is marked as master
    if (
      update.hasOwnProperty('isMaster')
      && !update['isMaster']
      && master$.value.variants.length < 2
    ) {
      return throwError('At least one recipe is required to be set as master');
    }

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.patch(
        `${BASE_URL}/${API_VERSION}/recipes/private/master/${masterId}/variant/${variantId}`,
        update
      )
      .pipe(
        mergeMap(
          (updatedRecipeResponse: RecipeVariant): Observable<RecipeVariant> => {
            return this.updateRecipeVariantOfMasterInList(
              master$,
              variantId,
              updatedRecipeResponse
            );
          }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error);
        })
      );
    }

    this.addSyncFlag('update', masterId);
    return this.updateRecipeVariantOfMasterInList(master$, variantId, update);
  }

  /**
   * Create a new recipe master and add to recipeMasterList; then update database
   * and ids if logged in and connected to internet or flag for sync otherwise
   *
   * @params: newMasterValues - object with master data and an initial recipe
   * variant, but is not yet formatted as a RecipeMaster and RecipeVariant
   *
   * @return: observable of new recipe master
  **/
  postRecipeMaster(newMasterValues: object): Observable<RecipeMaster> {
    try {
      const newMaster: RecipeMaster = this.formatNewRecipeMaster(newMasterValues);
      const list: BehaviorSubject<RecipeMaster>[] = this.getMasterList().value;

      if (
        this.connectionService.isConnected()
        && this.userService.isLoggedIn()
      ) {
        delete newMaster.variants[0].owner;
        return this.http.post<RecipeMaster>(
          `${BASE_URL}/${API_VERSION}/recipes/private`,
          newMaster
        )
        .pipe(
          map((newMasterResponse: RecipeMaster): RecipeMaster => {
            list.push(new BehaviorSubject<RecipeMaster>(newMasterResponse));
            this.emitListUpdate();
            this.updateRecipeStorage();
            return newMasterResponse;
          }),
          catchError((error: HttpErrorResponse): ErrorObservable => {
            return this.processHttpError.handleError(error);
          })
        );
      }
      this.addSyncFlag('create', newMaster.cid);

      // if not connected, add new subject with offline '_id's set
      list.push(new BehaviorSubject<RecipeMaster>(newMaster));
      this.emitListUpdate();
      this.updateRecipeStorage();
      return of(newMaster);
    } catch(error) {
      return throwError(error.message);
    }
  }

  /**
   * Create a new recipe; then update database and update ids if logged in and
   * connected to internet
   *
   * @params: masterId - recipe master id string to search
   * @params: variant - the new RecipeVariant to add
   *
   * @return: observable of new variant
  **/
  postRecipeToMasterById(
    masterId: string,
    variant: RecipeVariant
  ): Observable<RecipeVariant> {
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.post(
        `${BASE_URL}/${API_VERSION}/recipes/private/master/${masterId}`,
        variant
      )
      .pipe(
        mergeMap(
          (newRecipeResponse: RecipeVariant): Observable<RecipeVariant> => {
            return this.addRecipeVariantToMasterInList(
              masterId,
              newRecipeResponse
            );
          }
        ),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error);
        })
      );
    }

    this.addSyncFlag('update', masterId);
    return this.addRecipeVariantToMasterInList(masterId, variant);
  }

  /***** END private access methods *****/


  /***** Sync pending requests to server *****/

  /**
   * Add a sync flag for a recipe
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
      docType: 'recipe'
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
   * @params: index - error array index to remove
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
   * Get an array of recipe masters that have sync flags
   *
   * @params: none
   *
   * @return: Array of behavior subjects of recipe masters
  **/
  getFlaggedRecipeMasters(): BehaviorSubject<RecipeMaster>[] {
    return this.getMasterList()
      .value
      .filter((recipeMaster$: BehaviorSubject<RecipeMaster>): boolean => {
        return this.syncService
          .getAllSyncFlags()
          .some((syncFlag: SyncMetadata): boolean => {
            return hasId(recipeMaster$.value, syncFlag.docId);
          });
      });
  }

  /**
   * Process sync successes to update in memory docs
   *
   * @params: syncedData - an array of successfully synced docs; deleted docs
   * will contain a special flag to avoid searching for a removed doc in memory
   *
   * @return: none
  **/
  processSyncSuccess(syncData: (RecipeMaster | SyncData)[]): void {
    syncData.forEach((_syncData: (RecipeMaster | SyncData)): void => {
      if (_syncData['isDeleted'] === undefined) {
        const recipeMaster$: BehaviorSubject<RecipeMaster>
          = this.getRecipeMasterById((<RecipeMaster>_syncData).cid);

        if (recipeMaster$ === undefined) {
          this.syncErrors.push(
            `Recipe with id: '${(<RecipeMaster>_syncData).cid}' not found`
          );
        } else {
          recipeMaster$.next(<RecipeMaster>_syncData);
        }
      }
    });

    // Must call next on the list subject to trigger subscribers with new data
    this.emitListUpdate();
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
    if (!onLogin && !this.userService.isLoggedIn()) {
      return of(false);
    }

    const requests
      : (Observable<
          HttpErrorResponse
          | RecipeMaster
          | SyncData
        >)[] = [];

    this.syncService.getSyncFlagsByType('recipe')
      .forEach((syncFlag: SyncMetadata): void => {
        const recipeMaster$: BehaviorSubject<RecipeMaster>
          = this.getRecipeMasterById(syncFlag.docId);

        if (recipeMaster$ === undefined && syncFlag.method !== 'delete') {
          requests.push(
            throwError(
              `Sync error: Recipe master with id '${syncFlag.docId}' not found`
            )
          );
          return;
        } else if (syncFlag.method === 'delete') {
          requests.push(
            this.syncService.deleteSync(
              `${this.syncBaseRoute}/master/${syncFlag.docId}`
            )
          );
          return;
        }

        const recipeMaster: RecipeMaster = recipeMaster$.value;

        if (hasDefaultIdType(recipeMaster.owner)) {
          const user$: BehaviorSubject<User> = this.userService.getUser();

          if (user$ === undefined || user$.value._id === undefined) {
            requests.push(
              throwError(
                'Sync error: Cannot get recipe owner\'s id'
              )
            );
            return;
          }
          recipeMaster.owner = user$.value._id;
        }

        if (
          syncFlag.method === 'update'
          && isMissingServerId(recipeMaster._id)
        ) {
          requests.push(
            throwError(
              `Recipe with id: ${recipeMaster.cid} is missing its server id`
            )
          );
        } else if (syncFlag.method === 'create') {
          recipeMaster['forSync'] = true;
          requests.push(
            this.syncService.postSync(
              this.syncBaseRoute,
              recipeMaster
            )
          );
        } else if (
          syncFlag.method === 'update'
          && !isMissingServerId(recipeMaster._id)
        ) {
          requests.push(
            this.syncService.patchSync(
              `${this.syncBaseRoute}/master/${recipeMaster._id}`,
              recipeMaster
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

    return this.syncService.sync('recipe', requests)
      .pipe(
        map((responses: SyncResponse): boolean => {
          if (!onLogin) {
            this.processSyncSuccess(
              <(RecipeMaster | SyncData)[]>responses.successes
            );
            this.updateRecipeStorage();
          }
          this.syncErrors = responses.errors;
          return true;
        })
      );
  }

  /**
   * Network reconnect event handler
   * Process sync flags on reconnect only if signed in
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
          console.log(
            `${normalizeErrorObservableMessage(error)}: error on reconnect sync`
          );
        }
      );
  }

  /**
   * Post all stored recipes to server
   *
   * @params: none
   * @return: none
  **/
  syncOnSignup(): void {
    const requests: (Observable<HttpErrorResponse | RecipeMaster>)[] = [];

    const masterList$: BehaviorSubject<BehaviorSubject<RecipeMaster>[]>
      = this.getMasterList();

    const masterList: BehaviorSubject<RecipeMaster>[] = masterList$.value;
    const user$: BehaviorSubject<User> = this.userService.getUser();

    if (user$ === undefined || user$.value._id === undefined) {
      requests.push(
        throwError(
          'Sync error: Cannot get recipe owner\'s id'
        )
      );
    } else {
      masterList.forEach(
        (recipeMaster$: BehaviorSubject<RecipeMaster>): void => {
          const payload: RecipeMaster = recipeMaster$.value;
          payload['owner'] = user$.value._id;
          payload['forSync'] = true;
          requests.push(
            this.syncService.postSync(
              `${this.syncBaseRoute}`,
              payload
            )
          );
        }
      );
    }

    this.syncService.sync('recipe', requests)
      .subscribe((responses: SyncResponse): void => {
        this.processSyncSuccess(
          <(RecipeMaster | SyncData)[]>responses.successes
        );
        this.syncErrors = responses.errors;
        this.updateRecipeStorage();
        this.events.publish('sync-batches-on-signup');
      });
  }

  /***** End sync pending requests to server *****/


  /***** Utility methods *****/

  /**
   * Format a new RecipeMaster from initial values
   *
   * @params: newMasterValues - object with recipe master and initial recipe variant values
   *
   * @return: a new recipe master
  **/
  formatNewRecipeMaster(newMasterValues: object): RecipeMaster {
    const user: User = this.userService.getUser().value;

    if (getId(user) === undefined) {
      throw new Error('Client Validation Error: Missing User ID');
    }

    const recipeMasterId: string = this.clientIdService.getNewId();
    const initialRecipe: RecipeVariant = newMasterValues['variant'];

    this.populateRecipeIds(initialRecipe);

    initialRecipe.isMaster = true;
    initialRecipe.owner = recipeMasterId;

    const masterData: object = newMasterValues['master'];
    const newMaster: RecipeMaster = {
      cid: recipeMasterId,
      name: masterData['name'],
      style: masterData['style'],
      notes: masterData['notes'],
      master: initialRecipe.cid,
      owner: getId(user),
      isPublic: false,
      isFriendsOnly: false,
      variants: [ initialRecipe ]
    };

    return newMaster;
  }

  /**
   * Add a recipe to the recipe master and update behavior subject
   *
   * @params: masterId - recipe's master's id
   * @params: variant - new RecipeVariant to add to a master
   *
   * @return: Observable of new recipe
  **/
  addRecipeVariantToMasterInList(
    masterId: string,
    variant: RecipeVariant
  ): Observable<RecipeVariant> {
    const master$: BehaviorSubject<RecipeMaster>
      = this.getRecipeMasterById(masterId);

    if (master$ === undefined) {
      return throwError(`Recipe master with id ${masterId} not found`);
    }

    const master: RecipeMaster = master$.value;
    variant.owner = getId(master);

    this.populateRecipeIds(variant);

    master.variants.push(variant);

    if (variant.isMaster) {
      this.setRecipeAsMaster(master, master.variants.length - 1);
    }

    master$.next(master);
    this.emitListUpdate();
    this.updateRecipeStorage();

    return of(variant);
  }

  /**
   * Call complete for all recipe subjects and clear recipeMasterList array
   *
   * @params: none
   * @return: none
  **/
  clearRecipes(): void {
    this.getMasterList().value
      .forEach((recipeMaster$: BehaviorSubject<RecipeMaster>) => {
        recipeMaster$.complete();
      });
    this.getMasterList().next([]);
    this.storageService.removeRecipes();
  }

  /**
   * Trigger an emit event of the master list behavior subject
   *
   * @params: none
   * @return: none
  **/
  emitListUpdate(): void {
    const masterList$ = this.getMasterList();
    masterList$.next(masterList$.value);
  }

  /**
   * Combine hops schedule instances of the same type; e.g. if the hops
   * schedule contains two separate additions of the same type of hops (say
   * cascade), combine the two addition amounts and keep one instance of that
   * type of hops
   *
   * @params: hopsSchedule - the recipe's hops schedule
   *
   * @return: combined hops schedule
  **/
  getCombinedHopsSchedule(hopsSchedule: HopsSchedule[]): HopsSchedule[] {
    if (hopsSchedule === undefined) {
      return undefined;
    }

    const combined: HopsSchedule[] = [];

    hopsSchedule.forEach((hops: HopsSchedule): void => {
      const _combined: HopsSchedule = combined
        .find((combinedHops: HopsSchedule): boolean => {
          return hops.hopsType._id === combinedHops.hopsType._id;
        });

      if (_combined === undefined) {
        combined.push(hops);
      } else {
        _combined.quantity += hops.quantity;
      }
    });

    return combined;
  }

  /**
   * Get a recipe master by its id
   *
   * @params: masterId - recipe master server id or client id string to search
   *
   * @return: the recipe master subject if found, else undefined
  **/
  getRecipeMasterById(masterId: string): BehaviorSubject<RecipeMaster> {
    return this.getMasterList().value
      .find((recipeMaster$: BehaviorSubject<RecipeMaster>): boolean => {
        return hasId(recipeMaster$.value, masterId);
      });
  }

  /**
   * Get list of recipe masters, fetch from server if list is empty
   *
   * @params: none
   *
   * @return: subject of array of recipe master subjects
  **/
  getMasterList(): BehaviorSubject<BehaviorSubject<RecipeMaster>[]> {
    return this.recipeMasterList$;
  }

  /**
   * Get a recipe by its id using its master's id to help search
   *
   * @params: masterId - recipe variant's master's id
   * @params: variantId - recipe variant's id
   *
   * @return: observable of requested recipe variant
  **/
  getRecipeVariantById(
    masterId: string,
    variantId: string
  ): Observable<RecipeVariant> {
    const master$: BehaviorSubject<RecipeMaster>
      = this.getRecipeMasterById(masterId);

    if (master$ === undefined) {
      return throwError(`Recipe master with id ${masterId} not found`);
    }

    return of(
      master$.value.variants
        .find((_recipe: RecipeVariant): boolean => hasId(_recipe, variantId))
    );
  }

  /**
   * Get the recipe master that stores the given variant id
   *
   * @params: variantId - recipe variant to search for
   *
   * @return: the owner recipe master subject
  **/
  getRecipeMasterByRecipeId(variantId: string): BehaviorSubject<RecipeMaster> {
    return this.recipeMasterList$.value
      .find((recipeMaster$: BehaviorSubject<RecipeMaster>): boolean => {
        return recipeMaster$.value.variants
          .some((variant: RecipeVariant): boolean => {
            return hasId(variant, variantId);
          });
      });
  }

  /**
   * Check if there is a process schedule available for a recipe variant. A
   * recipe will have a process if processSchedule has content
   *
   * @params: variant - recipe variant to check for a process
   *
   * @return: true if at least one process is in the schedule
  **/
  isRecipeProcessPresent(variant: RecipeVariant): boolean {
    return  variant
      && variant.processSchedule !== undefined
      && variant.processSchedule.length > 0;
  }

  /**
   * Convert an array of recipe masters into a BehaviorSubject of an array of
   * BehaviorSubjects of recipe masters; concat the current recipe master
   * subjects that have a sync flag.
   *
   * @params: recipeMasterList - array of recipe masters
   *
   * @return: none
  **/
  mapRecipeMasterArrayToSubjects(recipeMasterList: RecipeMaster[]): void {
    const currentMasterList$: BehaviorSubject<BehaviorSubject<RecipeMaster>[]>
      = this.getMasterList();

    const syncList: BehaviorSubject<RecipeMaster>[]
      = this.getFlaggedRecipeMasters();

    currentMasterList$.next(
      recipeMasterList
        .map((recipeMaster: RecipeMaster): BehaviorSubject<RecipeMaster> => {
          return new BehaviorSubject<RecipeMaster>(recipeMaster);
        })
        .concat(syncList)
    );
  }

  /**
   * Populate recipe variant and child property cid fields
   *
   * @params: variant - RecipeVariant to update
   *
   * @return: none
  **/
  populateRecipeIds(variant: RecipeVariant): void {
    variant.cid = this.clientIdService.getNewId();
    if (variant.grains.length) {
      this.populateRecipeNestedIds(variant.grains);
    }
    if (variant.hops.length) {
      this.populateRecipeNestedIds(variant.hops);
    }
    if (variant.yeast.length) {
      this.populateRecipeNestedIds(variant.yeast);
    }
    if (variant.otherIngredients.length) {
      this.populateRecipeNestedIds(variant.otherIngredients);
    }
    if (variant.processSchedule.length) {
      this.populateRecipeNestedIds(variant.processSchedule);
    }
  }

  /**
   * Populate all cid fields of each object in array
   *
   * @params: innerArr - array of objects that require a cid field
   *
   * @return: none
  **/
  populateRecipeNestedIds(
    innerArr
    : (GrainBill | HopsSchedule | YeastBatch | OtherIngredients | Process)[]
  ): void {
    innerArr.forEach(
      (
        item
        : GrainBill | HopsSchedule | YeastBatch | OtherIngredients | Process
      ): void => {
        item.cid = this.clientIdService.getNewId();
      }
    );
  }

  /**
   * Remove a recipe variant from a recipe master
   *
   * @params: master$ - the recipe's master subject
   * @params: variantId - recipe variant to remove
   *
   * @return: Observable - success requires no data, using for error throw/handling
  **/
  removeRecipeFromMasterInList(
    master$: BehaviorSubject<RecipeMaster>,
    variantId: string
  ): Observable<boolean> {
    const master: RecipeMaster = master$.value;
    const recipeIndex: number = getIndexById(variantId, master.variants);

    if (recipeIndex === -1) {
      return throwError(`Delete error: recipe with id ${variantId} not found`);
    }

    this.removeRecipeAsMaster(master, recipeIndex);
    master.variants.splice(recipeIndex, 1);
    master$.next(master);
    this.emitListUpdate();
    this.updateRecipeStorage();

    return of(true);
  }

  /**
   * Remove a recipe master and its variants from the master list and update list subject
   *
   * @params: masterId - the recipe master to delete
   *
   * @return: Observable - success requires no data, using for error throw/handling
  **/
  removeRecipeMasterFromList(masterId: string): Observable<boolean> {
    const masterList: BehaviorSubject<RecipeMaster>[]
      = this.getMasterList().value;

    const indexToRemove: number = getIndexById(
      masterId,
      getArrayFromObservables(masterList)
    );

    if (indexToRemove === -1) {
      return throwError(
        `Delete error: Recipe master with id ${masterId} not found`
      );
    }

    masterList[indexToRemove].complete();
    masterList.splice(indexToRemove, 1);
    this.emitListUpdate();
    this.updateRecipeStorage();

    return of(true);
  }

  /**
   * Deselect a recipe as the master, set the first recipe variant in the array
   * that is not the currently selected variant as the new master. Do not perform
   * action if there is only one variant
   *
   * @params: recipeMaster - the recipe master that the recipe variant belongs to
   * @params: changeIndex - the index of the recipe master's recipes array which
   * needs to be changed
   *
   * @return: none
  **/
  removeRecipeAsMaster(recipeMaster: RecipeMaster, changeIndex: number): void {
    if (recipeMaster.variants.length > 1) {
      recipeMaster.variants[changeIndex].isMaster = false;

      const newMaster: RecipeVariant
        = recipeMaster.variants[changeIndex === 0 ? 1: 0];

      newMaster.isMaster = true;
      recipeMaster.master = newMaster._id || newMaster.cid;
    }
  }

  /**
   * Set a recipe variant as the master, deselect previous master
   *
   * @params: recipeMaster - the recipe master that the recipe variant belongs to
   * @params: changeIndex - the index of the recipe master's recipes array which
   * needs to be changed
   *
   * @return: none
  **/
  setRecipeAsMaster(recipeMaster: RecipeMaster, changeIndex: number): void {
    recipeMaster.variants
      .forEach((recipe: RecipeVariant, index: number): void => {
        recipe.isMaster = (index === changeIndex);
      });
    recipeMaster.master = recipeMaster.variants[changeIndex].cid;
  }

  /**
   * Store the current recipe master list in storage
   *
   * @params: none
   * @return: none
  **/
  updateRecipeStorage(): void {
    this.storageService.setRecipes(
      this.recipeMasterList$.value
        .map(
          (recipeMaster$: BehaviorSubject<RecipeMaster>): RecipeMaster => {
            return recipeMaster$.value;
          }
        )
    )
    .subscribe(
      (): void => console.log('stored recipes'),
      (error: ErrorObservable): void => {
        console.log(
          `recipe store error: ${normalizeErrorObservableMessage(error)}`
        )
      }
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
  updateRecipeMasterInList(
    masterId: string,
    update: RecipeMaster | object
  ): Observable<RecipeMaster> {
    const masterList: BehaviorSubject<RecipeMaster>[]
      = this.getMasterList().value;

    const masterIndex: number = masterList
      .findIndex((recipeMaster$: BehaviorSubject<RecipeMaster>): boolean => {
        return hasId(recipeMaster$.value, masterId);
      });

    if (masterIndex === -1) {
      return throwError(
        `Update error: Recipe master with id ${masterId} not found`
      );
    }

    const master$: BehaviorSubject<RecipeMaster> = masterList[masterIndex];
    const master: RecipeMaster = master$.value;

    for (const key in update) {
      if (master.hasOwnProperty(key) && key !== 'variants') {
        master[key] = update[key];
      }
    }

    master$.next(master);
    this.emitListUpdate();
    this.updateRecipeStorage();

    return of(master);
  }

  /**
   * Update a recipe variant in a recipe master in list and update the subject
   *
   * @params: master$ - recipe master subject the recipe belongs to
   * @params: variantId - recipe variant id to update
   * @params: update - may be either a complete or partial RecipeVariant
   *
   * @return: Observable of updated recipe
  **/
  updateRecipeVariantOfMasterInList(
    master$: BehaviorSubject<RecipeMaster>,
    variantId: string,
    update: RecipeVariant | object
  ): Observable<RecipeVariant> {
    const master: RecipeMaster = master$.value;

    const recipeIndex: number = getIndexById(variantId, master.variants);

    if (recipeIndex === -1) {
      return throwError(`Recipe with id ${variantId} not found`);
    }

    const variant: RecipeVariant = master.variants[recipeIndex];

    if (update.hasOwnProperty('isMaster')) {
      if (update['isMaster']) {
        this.setRecipeAsMaster(master, recipeIndex);
      } else if (!update['isMaster'] && variant.isMaster) {
        this.removeRecipeAsMaster(master, recipeIndex);
      }
    }

    for (const key in update) {
      if (variant.hasOwnProperty(key)) {
        variant[key] = update[key];
      }
    }

    master$.next(master);
    this.emitListUpdate();
    this.updateRecipeStorage();

    return of(variant);
  }

  /***** End utility methods *****/

}
