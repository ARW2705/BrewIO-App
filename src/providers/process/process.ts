import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class ProcessProvider {

  constructor(public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider) { }

  startNewBatch(userId: string, masterRecipeId: string, recipeId: string): Observable<Array<Batch>> {
    return this.http.get(`${baseURL}${apiVersion}/process/user/${userId}/master/${masterRecipeId}/recipe/${recipeId}`)
      .map((batches: Array<Batch>) => {
        if (batches) {
          console.log('emitting batch update');
          this.events.publish('update-batch', {type: 'start', batchList: batches, id: recipeId});
        }
        return batches;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  getBatchById(batchId: string): Observable<Batch> {
    return this.http.get(`${baseURL}${apiVersion}/process/in-progress/${batchId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  incrementCurrentStep(batchId: string): Observable<User> {
    return this.http.get(`${baseURL}${apiVersion}/process/in-progress/${batchId}/next`)
      .map((updatedUser: User) => {
        if (updatedUser) {
          this.events.publish('update-batch', {
            type: 'next',
            step: updatedUser.inProgressList.find(batch => batch._id === batchId).currentStep,
            id: batchId
          });
        }
        return updatedUser;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  patchBatchById(batchId: string, stepId: string, update: any): Observable<Batch> {
    return this.http.patch(`${baseURL}${apiVersion}/process/in-progress/${batchId}/step/${stepId}`, update)
      .map((response: Batch) => {
        if (response) {
          this.events.publish('update-batch', {type: 'step-update', update: response, id: response._id});
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  endBatchById(batchId: string): Observable<any> {
    return this.http.delete(`${baseURL}${apiVersion}/process/in-progress/${batchId}`)
      .map((response: any) => {
        if (response) {
          this.events.publish('update-batch', {type: 'end', id: batchId, data: response.updatedList});
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

}
