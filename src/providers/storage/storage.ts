/* Module imports */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Interface imports */
import { Batch } from '../../shared/interfaces/batch';
import { LibraryStorage } from '../../shared/interfaces/library';
import { InventoryItem } from '../../shared/interfaces/inventory-item';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { SelectedUnits } from '../../shared/interfaces/units';
import { SyncMetadata } from '../../shared/interfaces/sync';
import { User } from '../../shared/interfaces/user';

/* Default imports */
import { defaultEnglish } from '../../shared/defaults/default-units';


@Injectable()
export class StorageProvider {
  activeBatchStorageKey: string = 'active';
  archiveBatchStorageKey: string = 'archive';
  inventoryStorageKey: string = 'inventory';
  libraryStorageKey: string = 'library';
  recipeStorageKey: string = 'recipe';
  syncStorageKey: string = 'sync';
  userStorageKey: string = 'user';

  constructor(public storage: Storage) { }

  /**
   * Get all active or archive batches from storage
   *
   * @params: isActive - true for active batches, false for archive batches
   *
   * @return: Observable of array of active batches
  **/
  getBatches(isActive: boolean): Observable<Batch[]> {
    return fromPromise(
      this.storage.get(
        isActive ? this.activeBatchStorageKey: this.archiveBatchStorageKey
      )
      .then((batches: string): Batch[] => {
        if (batches === null) {
          throw throwError(
            `${ isActive ? 'Active': 'Archive' } batch data not found`
          );
        }

        const parsed: Batch[] = JSON.parse(batches);

        if (!parsed.length) {
          throw throwError(
            `No ${ isActive ? 'active': 'archive' } batch data in storage`
          );
        }

        return parsed;
      })
      .catch((error: Error | ErrorObservable)=> {
        if (error instanceof ErrorObservable) {
          throw error;
        }
        throw throwError(`Active batch storage error: ${error}`);
      })
    );
  }

  /**
   * Remove active or archive batches from storage
   *
   * @params: isActive - true for active batches, false for archive batches
   *
   * @return: none
  **/
  removeBatches(isActive: boolean): void {
    this.storage.remove(
      isActive ? this.activeBatchStorageKey: this.archiveBatchStorageKey
    )
    .then((): void => {
      console.log(`${ isActive ? 'Active': 'Archive' } batch data cleared`)
    });
  }

  /**
   * Store list of active or archive batches
   *
   * @params: isActive - true for active batches, false for archive batches
   * @params: batchList - list of all active batches
   *
   * @return: Observable of storage set response
  **/
  setBatches(isActive: boolean, batchList: Batch[]): Observable<any> {
    return fromPromise(
      this.storage.set(
        isActive ? this.activeBatchStorageKey: this.archiveBatchStorageKey,
        JSON.stringify(batchList)
      )
    );
  }

  /**
   * Get inventory from storage
   *
   * @params: none
   *
   * @return: Observable of array of active batches
  **/
  getInventory(): Observable<InventoryItem[]> {
    return fromPromise(
      this.storage.get(this.inventoryStorageKey)
        .then((inventory: string): InventoryItem[] => {
          if (inventory === null) {
            throw throwError('Inventory data not found');
          }

          const parsed: InventoryItem[] = JSON.parse(inventory);

          if (!parsed.length) {
            throw throwError('No inventory data in storage');
          }

          return parsed;
        })
        .catch((error: Error | ErrorObservable) => {
          if (error instanceof ErrorObservable) {
            throw error;
          }
          throw throwError(`Inventory storage error: ${error}`);
        })
    );
  }

  /**
   * Remove inventory from storage
   *
   * @params: none
   *
   * @return: none
  **/
  removeInventory(): void {
    this.storage
      .remove(this.inventoryStorageKey)
      .then((): void => console.log('Inventory data cleared'));
  }

  /**
   * Store inventory
   *
   * @params: inventory - array of items in inventory
   *
   * @return: Observable of storage set response
  **/
  setInventory(inventory: InventoryItem[]): Observable<any> {
    return fromPromise(
      this.storage.set(
        this.inventoryStorageKey,
        JSON.stringify(inventory)
      )
    );
  }

  /**
   * Get all ingredient/style libraries from storage
   *
   * @params: none
   *
   * @return: Observable of object with each library type
  **/
  getLibrary(): Observable<LibraryStorage> {
    return fromPromise(
      this.storage.get(this.libraryStorageKey)
        .then((libraries: string): LibraryStorage => {
          if (libraries === null) {
            throw throwError('Library data not found');
          }

          const parsed: LibraryStorage = JSON.parse(libraries);

          if (!Object.keys(parsed).length) {
            throw throwError('No library data in storage');
          }

          return parsed;
        })
        .catch((error: Error | ErrorObservable) => {
          if (error instanceof ErrorObservable) {
            throw error;
          }
          throw throwError(`Library storage error: ${error}`);
        })
    );
  }

  /**
   * Store ingredient libraries
   *
   * @params: library - object containing libraries of each type
   *
   * @return: Observable of storage set response
  **/
  setLibrary(library: LibraryStorage): Observable<any> {
    return fromPromise(
      this.storage.set(
        this.libraryStorageKey,
        JSON.stringify(library)
      )
    );
  }

  /**
   * Get all recipe masters from storage
   *
   * @params: none
   *
   * @return: Observable of array of recipe masters
  **/
  getRecipes(): Observable<RecipeMaster[]> {
    return fromPromise(
      this.storage.get(this.recipeStorageKey)
        .then((recipes: string): RecipeMaster[] => {
          if (recipes === null) {
            throw throwError('Recipe data not found');
          }

          const parsed: RecipeMaster[] = JSON.parse(recipes);

          if (parsed.length === 0) {
            throw throwError('No recipe data in storage');
          }

          return parsed;
        })
        .catch((error: Error | ErrorObservable) => {
          if (error instanceof ErrorObservable) {
            throw error;
          }
          throw throwError(`Recipe storage error: ${error}`);
        })
    );
  }

  /**
   * Remove all recipe masters from storage
   *
   * @params: none
   * @return: none
  **/
  removeRecipes(): void {
    this.storage
      .remove(this.recipeStorageKey)
      .then((): void => console.log('Recipe data cleared'));
  }

  /**
   * Store recipe masters
   *
   * @params: recipeMasterList - array of recipe masters
   *
   * @return: Observable of storage set response
  **/
  setRecipes(recipeMasterList: RecipeMaster[]): Observable<any> {
    return fromPromise(
      this.storage.set(
        this.recipeStorageKey,
        JSON.stringify(recipeMasterList)
      )
    );
  }

  /**
   * Get all sync flags from storage
   *
   * @params: none
   *
   * @return: Observable of array of sync metadata
  **/
  getSyncFlags(): Observable<SyncMetadata[]> {
    return fromPromise(
      this.storage.get(this.syncStorageKey)
        .then((flags: string): SyncMetadata[] => {
          if (flags === null) {
            throw throwError('Flags not found');
          }

          const parsed: SyncMetadata[] = JSON.parse(flags);

          if (parsed.length === 0) {
            throw throwError('No flags in storage');
          }

          return parsed;
        })
        .catch((error: Error | ErrorObservable) => {
          if (error instanceof ErrorObservable) {
            throw error;
          }
          throw throwError(`Sync flag storage error: ${error}`);
        })
    );
  }

  /**
   * Remove all sync flags from storage
   *
   * @params: none
   * @return: none
  **/
  removeSyncFlags(): void {
    this.storage
      .remove(this.syncStorageKey)
      .then((): void => console.log('Sync flags cleared'));
  }

  /**
   * Store sync flags for given type
   *
   * @params: flags - array of sync flags to store
   *
   * @return: Observable of storage response
  **/
  setSyncFlags(flags: SyncMetadata[]): Observable<any> {
    return fromPromise(
      this.storage.set(
        this.syncStorageKey,
        JSON.stringify(flags)
      )
    );
  }

  /**
   * Get user data and credentials
   *
   * @params: none
   *
   * @return: Observable of user data
  **/
  getUser(): Observable<User> {
    return fromPromise(
      this.storage.get(this.userStorageKey)
        .then((user: string): User => {
          if (user === null) {
            throw new Error('No user data');
          }

          return JSON.parse(user);
        })
        .catch((): User => {
          const _defaultEnglish: SelectedUnits = defaultEnglish();
          return {
            cid: 'offline',
            username: '',
            token: '',
            preferredUnitSystem: _defaultEnglish.system,
            units: _defaultEnglish
          };
        })
    );
  }

  /**
   * Remove user data from storage
   *
   * @params: none
   * @return: none
  **/
  removeUser(): void {
    this.storage
      .remove(this.userStorageKey)
      .then((): void => console.log('User data cleared'));
  }

  /**
   * Store user data and credentials
   *
   * @params: user - user profile and credentials
   *
   * @return: Observable of storage set response
  **/
  setUser(user: User): Observable<any> {
    return fromPromise(
      this.storage.set(
        this.userStorageKey,
        JSON.stringify(user)
      )
    );
  }

}
