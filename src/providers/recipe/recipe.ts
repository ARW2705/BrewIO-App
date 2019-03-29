import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/of';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { storageName } from '../../shared/constants/storage-name';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { StorageResult } from '../../shared/interfaces/storage-result';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { NativeStorageProvider } from '../native-storage/native-storage';

@Injectable()
export class RecipeProvider {
  private result: StorageResult = {
    origin: '',
    error: null,
    body: null
  };

  constructor(public http: HttpClient,
    private processHttpError: ProcessHttpErrorProvider,
    private nativeStorage: NativeStorage,
    private storageUtil: NativeStorageProvider) {
    console.log('Hello RecipeProvider Provider');
  }

  handleStorageMessage() {
    if (this.result.error == null) {
      this.storageUtil.onNativeStorageSuccess(this.result.origin);
    } else {
      this.storageUtil.onNativeStorageError(this.result.origin, this.result.error);
    }
    this.clearStorageResult();
  }

  clearStorageResult() {
    this.result.origin = '';
    this.result.error = null;
    this.result.body = null;
  }

  /* Local storage access methods */

  // Get master list
  getLocalMasterList(): Observable<any> {
    this.result.origin = 'Get list of recipe masters';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            this.result.body = JSON.parse(list);
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  postLocalRecipeMaster(master: RecipeMaster): Observable<any> {
    this.result.origin = 'Add new recipe master';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            _list.push(master);
            return this.nativeStorage.setItem(storageName, JSON.stringify(_list))
              .then(
                () => {
                  return this.result;
                },
                error => {
                  this.result.error = error;
                  return this.result;
                }
              );
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  getLocalRecipeMasterById(masterId: string): Observable<any> {
    this.result.origin = 'Get recipe master by id';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            this.result.body = JSON.parse(list).find(recipeMaster => recipeMaster._id == masterId);
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  postLocalRecipeById(masterId: string, recipe: Recipe): Observable<any> {
    this.result.origin = 'Add new recipe to master';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            for (let i=0; i < _list.length; i++) {
              if (_list[i]._id == masterId) {
                _list[i].recipes.push(recipe);
                return this.nativeStorage.setItem(storageName, JSON.stringify(_list))
                  .then(
                    () => {
                      return this.result;
                    },
                    error => {
                      this.result.error = error;
                      return this.result;
                    }
                  );
              }
            }
            this.result.error = `Recipe master with id ${masterId} not found`;
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  patchLocalRecipeMasterById(masterId: string, update: any): Observable<any> {
    this.result.origin = 'Update master recipe';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            for (let i=0; i < _list.length; i++) {
              if (_list[i]._id == masterId) {
                for (const prop of update) {
                  _list[i][prop] = update[prop];
                }
                return this.nativeStorage.setItem(storageName, JSON.stringify(_list))
                  .then(
                    () => {
                      return this.result;
                    },
                    error => {
                      this.result.error = error;
                      return this.result;
                    }
                  )
              }
            }
            this.result.error = `Recipe master with id ${masterId} not found`;
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  deleteLocalRecipeMasterById(masterId: string): Observable<any> {
    this.result.origin = 'Delete recipe master';
    return Observable.fromPromise(
      this.nativeStorage.remove(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            for (let i=0; i < _list.length; i++) {
              if (_list[i]._id == masterId) {
                const uponDelete = _list.slice(i, 1);
                this.nativeStorage.setItem(storageName, uponDelete)
                  .then(
                    () => {
                      return this.result;
                    },
                    error => {
                      this.result.error = error;
                      return this.result;
                    }
                  )
              }
            }
            this.result.error = `Recipe master with id ${masterId} not found`;
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    )
  }

  getLocalRecipeById(masterId: string, recipeId: string): Observable<any> {
    this.result.origin = 'Get recipe by id';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            for (let i=0; i < _list.length; i++) {
              if (_list[i]._id == masterId) {
                for (let j=0; j < _list[i].recipes.length; j++) {
                  if (_list[i].recipes[j]._id == recipeId) {
                    this.result.body = _list[i].recipes[j];
                    return this.result;
                  }
                }
                this.result.error = `Recipe with id ${recipeId} not found`;
                return this.result;
              }
            }
            this.result.error = `Recipe master with id ${masterId} not found`;
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  patchLocalRecipeById(masterId: string, recipeId: string, update: any): Observable<any> {
    this.result.origin = 'Update recipe by id';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            for (let i=0; i < _list.length; i++) {
              if (_list[i]._id == masterId) {
                for (let j=0; j < _list[i].recipes.length; j++) {
                  if (_list[i].recipes[j]._id == recipeId) {
                    for (const prop of update) {
                      _list[i].recipes[j][prop] = update[prop];
                    }
                    return this.nativeStorage.setItem(storageName, _list)
                      .then(
                        updated => {
                          return this.result;
                        },
                        error => {
                          this.result.error = error;
                          return this.result;
                        }
                      );
                  }
                }
                this.result.error = `Recipe with id ${recipeId} not found`;
                return this.result;
              }
            }
            this.result.error = `Recipe master with id ${masterId} not found`;
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    );
  }

  deleteLocalRecipeById(masterId: string, recipeId: string): Observable<any> {
    this.result.origin = 'Delete recipe by id';
    return Observable.fromPromise(
      this.nativeStorage.getItem(storageName)
        .then(
          list => {
            const _list = JSON.parse(list);
            for (let i=0; i < _list.length; i++) {
              if (_list[i]._id == masterId) {
                for (let j=0; j < _list[i].recipes.length; j++) {
                  if (_list[i].recipes[j]._id == recipeId) {
                    const uponDelete = _list[i].recipes[j].slice(j, 1);
                    _list[i].recipes = uponDelete;
                    return this.nativeStorage.setItem(storageName, _list)
                      .then(
                        () => {
                          return this.result;
                        },
                        error => {
                          this.result.error = error;
                          return this.result;
                        }
                      )
                  }
                }
                this.result.error = `Recipe with id ${recipeId} not found`;
                return this.result;
              }
            }
            this.result.error = `Recipe master with id ${masterId} not found`;
            return this.result;
          },
          error => {
            this.result.error = error;
            return this.result;
          }
        )
        .then(result => {
          this.handleStorageMessage();
          return result;
        })
    )
  }

  /* END Local storage access */


  /* Public access methods */

  // Get all public recipe masters from user
  getPublicMasterListByUser(userId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/recipes/public/${userId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get public recipe master by its ID
  getPublicMasterById(masterId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/recipes/public/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get public recipe by its ID
  getPublicRecipeById(masterId: string, recipeId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/recipes/public/master/${masterId}/recipe/${recipeId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END public access methods */

  /* Private access methods */

  // Get recipe master list
  getMasterList(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/private/user')
      .catch(error => this.processHttpError.handleError(error));
  }

  // Add new recipe master
  postRecipeMaster(master: RecipeMaster): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/private/user', master)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get recipe master by its ID with its corresponding recipes
  getMasterById(masterId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/private/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Add new recipe to master
  postRecipeToMasterById(masterId: string, recipe: Recipe): Observable<any> {
    return this.http.post(baseURL + apiVersion + `/private/master/${masterId}`, recipe)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Update recipe master
  patchRecipeMasterById(masterId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/private/master/${masterId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Delete recipe master
  deleteRecipeMasterById(masterId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/private/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get Recipe by its Id
  getRecipeById(masterId: string, recipeId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/private/master/${masterId}/recipe/${recipeId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Update recipe
  patchRecipeById(masterId: string, recipeId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/private/master/${masterId}/recipe/${recipeId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Delete recipe
  deleteRecipeById(masterId: string, recipeId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/private/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END private access methods */

}
