/* Module imports */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators/catchError';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { concat } from 'rxjs/observable/concat';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';
import { mergeMap } from 'rxjs/operators/mergeMap';
import { take } from 'rxjs/operators/take';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Constant imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';
import { OPTIONAL_INVENTORY_DATA_KEYS } from '../../shared/constants/optional-inventory-data-keys';

/* Utility function imports */
import { clone } from '../../shared/utility-functions/clone';
import { getId, hasDefaultIdType, hasId, isMissingServerId } from '../../shared/utility-functions/id-helpers';
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Interface imports*/
import { Batch, BatchContext } from '../../shared/interfaces/batch';
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { PrimaryValues } from '../../shared/interfaces/primary-values';
import { SyncData, SyncMetadata, SyncResponse } from '../../shared/interfaces/sync';

/* Provider imports */
import { ClientIdProvider } from '../client-id/client-id';
import { ConnectionProvider } from '../connection/connection';
import { LibraryProvider } from '../library/library';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { ProcessProvider } from '../process/process';
import { RecipeProvider } from '../recipe/recipe';
import { StorageProvider } from '../storage/storage';
import { SyncProvider } from '../sync/sync';
import { UserProvider } from '../user/user';


@Injectable()
export class InventoryProvider {
  inventory$: BehaviorSubject<InventoryItem[]>
    = new BehaviorSubject<InventoryItem[]>([]);
  syncBaseRoute: string = 'inventory';
  syncErrors: string[] = [];

  constructor(
    public events: Events,
    public http: HttpClient,
    public clientIdService: ClientIdProvider,
    public connectionService: ConnectionProvider,
    public libraryService: LibraryProvider,
    public processHttpError: ProcessHttpErrorProvider,
    public processService: ProcessProvider,
    public recipeService: RecipeProvider,
    public storageService: StorageProvider,
    public syncService: SyncProvider,
    public userService: UserProvider
  ) {
    this.events.subscribe('init-inventory', this.initializeInventory.bind(this));
    this.events.subscribe('clear-data', this.clearInventory.bind(this));
    this.events.subscribe('sync-inventory-on-signup', this.syncOnSignup.bind(this));
    this.events.subscribe('connected', this.syncOnReconnect.bind(this));
  }

  /***** Inventory Actions *****/

  /**
   * Create a new inventory item
   *
   * @params: newItemValues - values to construct the new inventory item
   *
   * @return: observable of new item
  **/
  addItem(newItemValues: object): Observable<InventoryItem> {
    const newItem: InventoryItem = {
      cid: this.clientIdService.getNewId(),
      supplierName: newItemValues['supplierName'],
      stockType: newItemValues['stockType'],
      initialQuantity: newItemValues['initialQuantity'],
      currentQuantity: newItemValues['initialQuantity'],
      itemName: newItemValues['itemName'],
      description: newItemValues['description'],
      itemStyleId: newItemValues['itemStyleId'],
      itemStyleName: newItemValues['itemStyleName'],
      itemABV: newItemValues['itemABV'],
      sourceType: newItemValues['sourceType'],
      optionalItemData: {}
    };

    this.mapOptionalData(newItem, newItemValues);

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.post<InventoryItem>(
        `${BASE_URL}/${API_VERSION}/inventory`,
        newItem
      )
      .pipe(
        mergeMap((responseItem: InventoryItem): Observable<InventoryItem> => {
          return this.addItemToList(responseItem);
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
    }

    this.addSyncFlag('create', getId(newItem));
    return this.addItemToList(newItem);
  }

  /**
   * Add item to the inventory list
   *
   * @params: item - the item to add to list
   *
   * @return: observable of the new item
  **/
  addItemToList(item: InventoryItem): Observable<InventoryItem> {
    const list$: BehaviorSubject<InventoryItem[]> = this.getInventoryList();
    const list: InventoryItem[] = list$.value;
    list.push(item);
    list$.next(list);
    this.updateInventoryStorage();
    return of(item);
  }

  /**
   * Create a new inventory item based on a given batch
   *
   * @params: batch - batch to base item from
   * @params: newItemValues - values not contained in batch
   *
   * @return: observable of new item
  **/
  generateItemFromBatch(
    batch: Batch,
    newItemValues: object
  ): Observable<InventoryItem> {
    return combineLatest(
      this.recipeService.getPublicAuthorByRecipeId(batch.recipeMasterId),
      this.recipeService.getRecipeMasterById(batch.recipeMasterId),
      this.libraryService.getStyleById(batch.annotations.styleId)
    )
    .pipe(
      take(1),
      mergeMap(([author, recipeMaster, style]): Observable<InventoryItem> => {
        const measuredValues: PrimaryValues = batch.annotations.measuredValues;
        const contextInfo: BatchContext = batch.contextInfo;

        const generatedItemValues: object = {
          supplierName: author.username !== '' ? author.username: 'pending',
          supplierLabelImage: author.labelImageURL,
          stockType: newItemValues['stockType'],
          initialQuantity: newItemValues['initialQuantity'],
          currentQuantity: newItemValues['initialQuantity'],
          description: newItemValues['description'],
          itemName: contextInfo.recipeMasterName,
          itemSubname: contextInfo.recipeVariantName,
          itemStyleId: batch.annotations.styleId,
          itemStyleName: style.name,
          itemABV: measuredValues.ABV,
          itemIBU: measuredValues.IBU,
          itemSRM: measuredValues.SRM,
          itemLabelImage: contextInfo.recipeImageURL,
          batchId: batch.cid,
          originalRecipeId: getId(recipeMaster),
          sourceType:
            batch.owner === 'offline' || batch.owner === recipeMaster.owner
            ? 'self'
            : 'other'
        };

        if (batch.annotations.packagingDate !== undefined) {
          generatedItemValues['packagingDate'] = batch.annotations.packagingDate;
        }

        return this.addItem(generatedItemValues);
      })
    );
  }

  /**
   * Get the inventory list
   *
   * @params: none
   *
   * @return: BehaviorSubject of inventory item list
  **/
  getInventoryList(): BehaviorSubject<InventoryItem[]> {
    return this.inventory$;
  }

  /**
   * Get an inventory item by its id
   *
   * @params: itemId - the item's id
   *
   * @return: the InventoryItem or undefined if not found
  **/
  getItemById(itemId: string): InventoryItem {
    return this.getInventoryList().value
      .find((item: InventoryItem): boolean => {
        return hasId(item, itemId);
      });
  }

  /**
   * Get the inventory from storage and server
   *
   * @params: none
   * @return: none
  **/
  initializeInventory(): void {
    this.storageService.getInventory()
      .subscribe(
        (inventory: InventoryItem[]): void => {
          const list$: BehaviorSubject<InventoryItem[]> = this.getInventoryList();
          if (list$.value.length === 0 && inventory.length > 0) {
            list$.next(inventory);
          }
        },
        (error: ErrorObservable): void => {
          console.log(
            `${normalizeErrorObservableMessage(error)}: awaiting data from server`
          );
        });
    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      concat(
        this.syncOnConnection(true),
        this.http.get<InventoryItem[]>(`${BASE_URL}/${API_VERSION}/inventory`)
          .pipe(
            map((inventory: InventoryItem[]): void => {
              console.log('inventory from server');
              this.getInventoryList().next(inventory);
              this.updateInventoryStorage();
            }),
            catchError((error: HttpErrorResponse): ErrorObservable => {
              return this.processHttpError.handleError(error)
            })
          )
      )
      .subscribe(
        (): void => {}, // no further actions needed on success
        (error: ErrorObservable): void => {
          console.log(
            `Initialization error: ${normalizeErrorObservableMessage(error)}`
          );
        }
      );
    }
  }

  /**
   * Map any optional data to an item
   *
   * @params: item - the target item
   * @params: optionalData - contains optional properties to copy
   *
   * @return: none
  **/
  mapOptionalData(item: InventoryItem, optionalData: object): void {
    for (const key in optionalData) {
      if (
        OPTIONAL_INVENTORY_DATA_KEYS.includes(key)
        && optionalData.hasOwnProperty(key)
      ) {
        item.optionalItemData[key] = optionalData[key];
      }
    }
  }

  /**
   * Update an item
   *
   * @params: itemId - the item id to update
   * @params: update - object with updated values
   *
   * @return: observable of updated item
  **/
  patchItem(itemId: string, update: object): Observable<InventoryItem> {
    if (
      update.hasOwnProperty('currentQuantity')
      && update['currentQuantity'] <= 0
    ) {
      return this.removeItem(itemId);
    }

    const list$: BehaviorSubject<InventoryItem[]> = this.getInventoryList();
    const list: InventoryItem[] = list$.value;
    const item: InventoryItem = list
      .find((item: InventoryItem): boolean => {
        return hasId(item, itemId);
      });

    for (const key in item) {
      if (update.hasOwnProperty(key)) {
        item[key] = update[key];
      }
    }
    this.mapOptionalData(item, update);

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.patch<InventoryItem>(
        `${BASE_URL}/${API_VERSION}/inventory/${item._id}`,
        item
      )
      .pipe(
        map((updatedItem: InventoryItem): InventoryItem => {
          list$.next(list);
          this.updateInventoryStorage();
          return updatedItem;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
    }

    this.addSyncFlag('update', getId(item));
    list$.next(list);
    this.updateInventoryStorage();
    return of(item);
  }

  /**
   * Remove an item from inventory
   *
   * @params: itemId - id of item to remove
   *
   * @return: observable of removed item
  **/
  removeItem(itemId: string): Observable<InventoryItem> {
    const list$: BehaviorSubject<InventoryItem[]> = this.getInventoryList();
    const list: InventoryItem[] = list$.value;
    const removeIndex: number = list
      .findIndex((item: InventoryItem): boolean => {
        return hasId(item, itemId);
      });

    if (this.connectionService.isConnected() && this.userService.isLoggedIn()) {
      return this.http.delete<InventoryItem>(
        `${BASE_URL}/${API_VERSION}/inventory/${list[removeIndex]._id}`
      )
      .pipe(
        mergeMap((): Observable<any> => {
          list.splice(removeIndex, 1);
          list$.next(list);
          this.updateInventoryStorage();
          return of(null);
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
      );
    }

    this.addSyncFlag('delete', getId(list[removeIndex]));
    list.splice(removeIndex, 1);
    list$.next(list);
    this.updateInventoryStorage();
    return of(null);
  }

  /**
   * Clear all inventory items
   *
   * @params: none
   * @return: none
  **/
  clearInventory(): void {
    this.getInventoryList().next([]);
    this.storageService.removeInventory();
  }

  /***** End Inventory Actions *****/


  /***** Sync Operations *****/

  /**
   * Add a sync flag for inventory
   *
   * @params: method - the sync action
   * @params: docId - the id of the sync target
   *
   * @return: none
  **/
  addSyncFlag(method: string, docId: string): void {
    this.syncService.addSyncFlag({
      method: method,
      docId: docId,
      docType: 'inventory'
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
   * Process sync successes to update in memory docs
   *
   * @params: syncedData - an array of successfully synced docs; deleted docs
   * will contain a special flag to avoid searching for a removed doc in memory
   *
   * @return: none
  **/
  processSyncSuccess(syncData: (InventoryItem | SyncData)[]): void {
    const list$: BehaviorSubject<InventoryItem[]> = this.getInventoryList();
    const list: InventoryItem[] = list$.value;

    syncData.forEach((_syncData: InventoryItem | SyncData): void => {
      if (_syncData['isDeleted'] === undefined) {
        const itemIndex: number = list
          .findIndex((item: InventoryItem): boolean => {
            return hasId(item, (<InventoryItem>_syncData).cid)
          });

        if (itemIndex === -1) {
          this.syncErrors.push(
            `Inventory item with id: ${(<InventoryItem>_syncData).cid} not found`
          );
        } else {
          list[itemIndex] = <InventoryItem>_syncData;
        }
      }
    });

    // Must call next on the list subject to trigger subscribers with new data
    list$.next(list);
  }

  /**
   * Process all sync flags on a login or reconnect event
   *
   * @params: onLogin - true if calling sync at login,
   *                    false for sync on reconnect
   *
   * @return: none
  **/
  syncOnConnection(onLogin: boolean): Observable<boolean> {
    // Ignore reconnects if not logged in
    if (!onLogin && !this.userService.isLoggedIn()) {
      return of(false);
    }

    const requests
      : (Observable<HttpErrorResponse | InventoryItem | SyncData>)[] = [];

    this.syncService.getSyncFlagsByType('inventory')
      .forEach((syncFlag: SyncMetadata): void => {
        const item: InventoryItem = this.getItemById(syncFlag.docId);

        if (item === undefined && syncFlag.method !== 'delete') {
          requests.push(
            throwError(
              `Sync error: Inventory item with id '${syncFlag.docId}' not found`
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

        if (
          item.optionalItemData.batchId !== undefined
          && hasDefaultIdType(item.optionalItemData.batchId)
        ) {
          const batch$: BehaviorSubject<Batch> = this.processService
            .getBatchById(item.optionalItemData.batchId);

          if (batch$ === undefined || hasDefaultIdType(batch$.value._id)) {
            requests.push(
              throwError(
                'Sync error: Cannot get inventory batch\'s id'
              )
            );
            return;
          }
          item.optionalItemData.batchId = batch$.value._id;
        }

        if (syncFlag.method === 'update' && isMissingServerId(item._id)) {
          requests.push(
            throwError(
              `Inventory item with id: ${item.cid} is missing its server id`
            )
          );
        } else if (syncFlag.method === 'create') {
          item['forSync'] = true;
          requests.push(
            this.syncService.postSync(
              this.syncBaseRoute,
              item
            )
          );
        } else if (syncFlag.method === 'update' && !isMissingServerId(item._id)) {
          requests.push(
            this.syncService.patchSync(
              `${this.syncBaseRoute}/${item._id}`,
              item
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

    return this.syncService.sync('inventory', requests)
      .pipe(
        map((responses: SyncResponse): boolean => {
          if (!onLogin) {
            this.processSyncSuccess(
              <(InventoryItem | SyncData)[]>responses.successes
            );
            this.updateInventoryStorage();
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
    const requests: (Observable<HttpErrorResponse | InventoryItem>)[] = [];

    const list$: BehaviorSubject<InventoryItem[]> = this.getInventoryList();
    const list: InventoryItem[] = list$.value;

    list.forEach((item: InventoryItem): void => {
      const batch$: BehaviorSubject<Batch> = this.processService
        .getBatchById(item.optionalItemData.batchId);

      if (batch$ === undefined) {
        requests.push(
          throwError(
            `Batch with id ${item.optionalItemData.batchId} not found`
          )
        );
        return;
      }

      const payload: InventoryItem = clone(item);
      payload['optionalItemData']['batchId'] = batch$.value._id;
      payload['forSync'] = true;
      requests.push(
        this.syncService.postSync(
          `${this.syncBaseRoute}`,
          payload
        )
      );
    });

    this.syncService.sync('recipe', requests)
      .subscribe((responses: SyncResponse): void => {
        this.processSyncSuccess(
          <(InventoryItem | SyncData)[]>responses.successes
        );
        this.syncErrors = responses.errors;
        this.updateInventoryStorage();
      });
  }

  /***** End Sync Operations *****/


  /***** Storage Operations *****/

  /**
   * Update inventory storage
   *
   * @params: none
   * @return: none
  **/
  updateInventoryStorage(): void {
    this.storageService.setInventory(this.getInventoryList().value)
      .subscribe(
        (): void => console.log('stored inventory'),
        (error: ErrorObservable): void => {
          console.log(
            `inventory store error: ${normalizeErrorObservableMessage(error)}`
          )
        }
      );
  }

  /***** End Storage Operations *****/

}
