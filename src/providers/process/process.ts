import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class ProcessProvider {

  constructor(public http: HttpClient,
    private processHttpError: ProcessHttpErrorProvider) {
    console.log('Hello ProcessProvider Provider');
  }

  getAllStepsByRecipe(masterRecieId: string, recipeId: string): Observable<any> {
    return this.http.get(`${baseURL}${apiVersion}/process/master/${masterRecieId}/recipe/${recipeId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  getStepById(masterRecipeId: string, recipeId: string, stepId: string): Observable<any> {
    return this.http.get(`${baseURL}${apiVersion}/process/master/${masterRecipeId}/recipe/${recipeId}/step/${stepId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  patchStepById(masterRecipeId: string, recipeId: string, stepId: string, update: any): Observable<any> {
    return this.http.patch(`${baseURL}${apiVersion}/process/master/${masterRecipeId}/recipe/${recipeId}/step/${stepId}`, update)
      .catch(error => this.processHttpError.handleError(error));
  }

}
