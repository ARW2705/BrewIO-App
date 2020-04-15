/* Module imports */
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { fromPromise } from 'rxjs/observable/fromPromise';
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
  batchStorageKey = 'batch';
  libraryStorageKey = 'library';

  constructor(public storage: Storage) { }

  /**
   * Get all active batches from storage
   *
   * @params: none
   *
   * @return: Observable of array of active batches
  **/
  getBatches(): Observable<Array<Batch>> {
    return fromPromise(
      this.storage.get(this.batchStorageKey)
        .then(batches => {
          if (batches === null) throw throwError('Active batch data not found');
          const parsed = JSON.parse(batches);
          if (parsed.length === 0) throw throwError('No active batch data in storage');
          return parsed;
        })
        .catch(error => {
          if (error instanceof ErrorObservable) {
            throw error;
          }
          throw throwError(`Active batch storage error: ${error}`);
        })
    );
  }

  /**
   * Remove active batches from storage
   *
   * @params: none
   * @return: none
  **/
  removeBatches(): void {
    this.storage.remove(this.batchStorageKey)
      .then(() => console.log('Active batch data cleared'));
  }

  /**
   * Store list of active batches
   *
   * @params: activeBatchList - list of all active batches
   *
   * @return: Observable of storage set response
  **/
  setBatches(activeBatchList: Array<Batch>): Observable<any> {
    return fromPromise(
      this.storage.set(
        this.batchStorageKey,
        JSON.stringify(activeBatchList)
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
        .then(libraries => {
          if (libraries === null) throw throwError('Library data not found');
          const parsed = JSON.parse(libraries);
          if (Object.keys(parsed).length === 0) throw throwError('No library data in storage');
          return parsed;
        })
        .catch(error => {
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
  getRecipes(): Observable<Array<RecipeMaster>> {
    return fromPromise(
      this.storage.get(this.recipeStorageKey)
        .then(recipes => {
          if (recipes === null) throw throwError('Recipe data not found');
          const parsed = JSON.parse(recipes);
          if (parsed.length === 0) throw throwError('No recipe data in storage');
          return parsed;
        })
        .catch(error => {
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
    return fromPromise(
      this.storage.set(
        this.recipeStorageKey,
        JSON.stringify(recipeMasterList)
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
        .then(user => {
          if (user === null) throw new Error('No user data');
          return JSON.parse(user);
        })
        .catch(() => {
          return {
            _id: 'offline',
            username: '',
            token: ''
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
    return fromPromise(
      this.storage.set(
        this.userStorageKey,
        JSON.stringify(user)
      )
    );
  }

}
