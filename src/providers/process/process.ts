import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class ProcessProvider {

  constructor(public http: HttpClient,
    private events: Events,
    private processHttpError: ProcessHttpErrorProvider) {
    console.log('Hello ProcessProvider Provider');
  }

  startNewBatch(userId: string, masterRecipeId: string, recipeId: string): Observable<any> {
    return this.http.get(`${baseURL}${apiVersion}/process/user/${userId}/master/${masterRecipeId}/recipe/${recipeId}`)
      .map((response: Array<Batch>) => {
        if (response) {
          console.log('emitting batch update');
          this.events.publish('batch-update', {type: 'start', batchList: response[0], id: recipeId});
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  getBatchById(batchId: string): Observable<any> {
    return this.http.get(`${baseURL}${apiVersion}/process/in-progress/${batchId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  incrementCurrentStep(batchId: string): Observable<any> {
    return this.http.get(`${baseURL}${apiVersion}/process/in-progress/${batchId}/next`)
      .map((response: User) => {
        if (response) {
          this.events.publish('batch-update', {type: 'next', id: batchId});
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  patchBatchById(batchId: string, stepId: string, update: any): Observable<any> {
    return this.http.patch(`${baseURL}${apiVersion}/process/in-progress/${batchId}/step/${stepId}`, update)
      .map((response: any) => {
        if (response) {
          this.events.publish('batch-update', {type: 'step-update', update: response, id: response._id});
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  endBatchById(batchId: string): Observable<any> {
    return this.http.delete(`${baseURL}${apiVersion}/process/in-progress/${batchId}`)
      .map((response: any) => {
        if (response) {
          this.events.publish('batch-update', {type: 'end', id: batchId, data: response.updatedList});
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

}
