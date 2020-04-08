/* Module imports */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { fromPromise } from 'rxjs/observable/fromPromise';
import { map } from 'rxjs/operators';
import { _throw as throwError } from 'rxjs/observable/throw';

/* Interface imports */
import { User } from '../../shared/interfaces/user';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { LibraryStorage } from '../../shared/interfaces/library';


@Injectable()
export class StorageProvider {
  userStorageKey = 'user';
  recipeStorageKey = 'recipe';
  processStorageKey = 'process';
  libraryStorageKey = 'library';

  constructor(public storage: Storage) { }

  /**
   * Get all ingredient libraries from storage
   *
   * @params: none
   *
   * @return: Observable of array of each library
  **/
  getLibrary(): Observable<any> {
    return fromPromise(this.storage.get(this.libraryStorageKey))
      .pipe(
        map((libraries: string) => {
          const parsed = JSON.parse(libraries);
          if (parsed === null) {
            throw throwError('Library data not found');
          }
          return parsed;
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
    return fromPromise(this.storage.set(this.libraryStorageKey, JSON.stringify(library)));
  }

  /**
   * Get all active batches from storage
   *
   * @params: none
   *
   * @return: Observable of array of active batches
  **/
  getProcesses(): Observable<Array<Batch>> {
    return fromPromise(this.storage.get(this.processStorageKey))
      .pipe(
        map((activeBatchList: string) => {
          const parsed = JSON.parse(activeBatchList);
          if (parsed === null || parsed.length === 0) {
            throw throwError('Active batch data not found');
          }
          return parsed;
        })
      );
  }

  /**
   * Remove active batches from storage
   *
   * @params: none
   * @return: none
  **/
  removeProcesses(): void {
    this.storage.remove(this.processStorageKey)
      .then(() => console.log('Active batch data cleared'));
  }

  /**
   * Store list of active batches
   *
   * @params: activeBatchList - list of all active batches
   *
   * @return: Observable of storage set response
  **/
  setProcesses(activeBatchList: Array<Batch>): Observable<any> {
    return fromPromise(this.storage.set(this.processStorageKey, JSON.stringify(activeBatchList)));
  }

  /**
   * Get all recipe masters from storage
   *
   * @params: none
   *
   * @return: Observable of array of recipe masters
  **/
  getRecipes(): Observable<Array<RecipeMaster>> {
    return fromPromise(this.storage.get(this.recipeStorageKey))
      .pipe(
        map((recipeMasterList: string) => {
          const parsed = JSON.parse(recipeMasterList);
          if (parsed === null || parsed.length === 0) {
            throw throwError('Recipe data not found');
          }
          return parsed;
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
    this.storage.remove(this.recipeStorageKey)
      .then(() => console.log('Recipe data cleared'));
  }

  /**
   * Store recipe masters
   *
   * @params: recipeMasterList - array of recipe masters
   *
   * @return: Observable of storage set response
  **/
  setRecipes(recipeMasterList: Array<RecipeMaster>): Observable<any> {
    return fromPromise(this.storage.set(this.recipeStorageKey, JSON.stringify(recipeMasterList)));
  }

  /**
   * Get user data and credentials
   *
   * @params: none
   *
   * @return: Observable of user data
  **/
  getUser(): Observable<User> {
    return fromPromise(this.storage.get(this.userStorageKey))
      .pipe(
        map((_user: string) => {
          let parsed = JSON.parse(_user);
          if (_user === null) {
            console.log('User data not found in storage');
            parsed = {
              _id: 'offline',
              username: '',
              token: ''
            };
          }
          return parsed;
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
    this.storage.remove(this.userStorageKey)
      .then(() => console.log('User data cleared'));
  }

  /**
   * Store user data and credentials
   *
   * @params: user - user profile and credentials
   *
   * @return: Observable of storage set response
  **/
  setUser(user: User): Observable<any> {
    return fromPromise(this.storage.set(this.userStorageKey, JSON.stringify(user)));
  }

}
