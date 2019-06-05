import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { getIndexById } from '../../shared/utility-functions/utilities';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class RecipeProvider {
  private recipeMasterList: Array<RecipeMaster> = [];

  constructor(public http: HttpClient,
    private events: Events,
    private processHttpError: ProcessHttpErrorProvider) {
  }

  /* Public api access methods */

  /**
   * Get all public recipe masters by user id
   *
   * params: string
   * userId - user id string to query
   *
   * return: Observable
   * - array of public recipe masters from user
  **/
  public getPublicMasterListByUser(userId: string): Observable<Array<RecipeMaster>> {
    return this.http.get(baseURL + apiVersion + `/recipes/public/${userId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Get public recipe master by id
   *
   * params: string
   * masterId - recipe master id string to query
   *
   * return: Observable
   * - recipe master object
  **/
  public getPublicMasterById(masterId: string): Observable<RecipeMaster> {
    return this.http.get(baseURL + apiVersion + `/recipes/public/master/${masterId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get public recipe by its ID
  public getPublicRecipeById(masterId: string, recipeId: string): Observable<any> {
    return this.http.get(baseURL + apiVersion + `/recipes/public/master/${masterId}/recipe/${recipeId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END public api access methods */

  /* Private api access methods */

  // Get recipe master list
  public getMasterList(): Observable<any> {
    return this.recipeMasterList.length
           ? Observable.of(this.recipeMasterList)
           : this.http.get(baseURL + apiVersion + '/recipes/private/user')
               .map((response: Array<RecipeMaster>) => {
                 this.recipeMasterList = response;
                 return response;
               })
               .catch(error => this.processHttpError.handleError(error));
  }

  // Add new recipe master
  public postRecipeMaster(master: RecipeMaster): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/recipes/private/user', master)
      .map((response: RecipeMaster) => {
        this.recipeMasterList.push(response);
        this.events.publish('new-master', response);
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get recipe master by its ID with its corresponding recipes
  public getMasterById(masterId: string): Observable<any> {
    const master = this.recipeMasterList.find(recipe => recipe._id == masterId);
    return master != undefined
           ? Observable.of(master)
           : this.http.get(baseURL + apiVersion + `/recipes/private/master/${masterId}`)
               .catch(error => this.processHttpError.handleError(error));
  }

  // Add new recipe to master
  public postRecipeToMasterById(masterId: string, recipe: Recipe): Observable<any> {
    return this.http.post(baseURL + apiVersion + `/recipes/private/master/${masterId}`, recipe)
      .map(response => {
        this.events.publish('new-recipe', response);
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  // Update recipe master
  public patchRecipeMasterById(masterId: string, update: any): Observable<any> {
    console.log(update);
    return this.http.patch(baseURL + apiVersion + `/recipes/private/master/${masterId}`, update)
      .map((response: RecipeMaster) => {
        console.log('um res', response);
        this.events.publish('update-master', response);
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  // Delete recipe master
  public deleteRecipeMasterById(masterId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/recipes/private/master/${masterId}`)
      .map((response: RecipeMaster) => {
        const index = getIndexById(masterId, this.recipeMasterList);
        if (index != -1) {
          this.recipeMasterList.splice(index, 1);
        }
        this.events.publish('delete-master', masterId);
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  // Get Recipe by its Id
  public getRecipeById(masterId: string, recipeId: string): Observable<any> {
    const master = this.recipeMasterList.find(master => master._id == masterId);
    let recipe;
    if (master != undefined) {
      recipe = master.recipes.find(recipe => recipe._id == recipeId);
    }
    return recipe != undefined
           ? Observable.of(recipe)
           : this.http.get(baseURL + apiVersion + `/recipes/private/master/${masterId}/recipe/${recipeId}`)
               .catch(error => this.processHttpError.handleError(error));
  }

  // Update recipe
  public patchRecipeById(masterId: string, recipeId: string, update: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + `/recipes/private/master/${masterId}/recipe/${recipeId}`, update)
      .map((response: Recipe) => {
        this.events.publish('update-recipe', response);
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  // Delete recipe
  public deleteRecipeById(masterId: string, recipeId: string): Observable<any> {
    return this.http.delete(baseURL + apiVersion + `/recipes/private/master/${masterId}/recipe/${recipeId}`)
      .map((response: Recipe) => {
        const masterIndex = getIndexById(masterId, this.recipeMasterList);
        let index = -1;
        if (masterIndex != -1) {
          index = getIndexById(recipeId, this.recipeMasterList[masterIndex].recipes);
          if (index != -1) {
            this.recipeMasterList[masterIndex].recipes.splice(index, 1);
          }
        }
        this.events.publish('delete-recipe', response);
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /* END private access methods */

}
