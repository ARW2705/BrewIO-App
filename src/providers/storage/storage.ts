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
import { Process } from '../../shared/interfaces/process';
import { Grains, Hops, Yeast, Style, LibraryCache } from '../../shared/interfaces/library';


@Injectable()
export class StorageProvider {
  userStorageKey = 'user';
  recipeStorageKey = 'recipe';
  processStorageKey = 'process';
  libraryStorageKey = 'library';

  constructor(public storage: Storage) { }

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

  setLibrary(library: LibraryCache): Observable<any> {
    console.log(library.hops);
    console.log(library.styles);
    return fromPromise(this.storage.set(this.libraryStorageKey, JSON.stringify(library)));
  }

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

  removeRecipes(): void {
    this.storage.remove(this.recipeStorageKey)
      .then(() => console.log('Recipe data cleared'));
  }

  setRecipes(recipeMasterList: Array<RecipeMaster>): Observable<any> {
    return fromPromise(this.storage.set(this.recipeStorageKey, JSON.stringify(recipeMasterList)));
  }

  getUser(): Observable<User> {
    return fromPromise(this.storage.get(this.userStorageKey))
      .pipe(
        map((user: string) => {
          const parsed = JSON.parse(user);
          if (user === null) {
            throw throwError('User data not found');
          }
          return parsed;
        })
      );
  }

  removeUser(): void {
    this.storage.remove(this.userStorageKey)
      .then(() => console.log('User data cleared'));
  }

  setUser(user: User): Observable<any> {
    return fromPromise(this.storage.set(this.userStorageKey, JSON.stringify(user)));
  }

}
