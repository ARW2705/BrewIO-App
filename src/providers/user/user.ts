import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { User } from '../../shared/interfaces/user';
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Batch } from '../../shared/interfaces/batch';

import { AuthenticationProvider } from '../authentication/authentication';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class UserProvider {
  private loggedIn: boolean = false;
  private user: User = null;
  private _updateMaster: any;
  private _updateRecipe: any;
  private _updateBatch: any;

  constructor(public http: HttpClient,
    private events: Events,
    private authService: AuthenticationProvider,
    private processHttpError: ProcessHttpErrorProvider) {
      this._updateMaster = this.updateMasterEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
      this._updateBatch = this.updateBatchEventHandler.bind(this);
      this.events.subscribe('update-master', this._updateMaster);
      this.events.subscribe('update-recipe', this._updateRecipe);
      this.events.subscribe('update-batch', this._updateBatch);
  }

  private updateMasterEventHandler(update: RecipeMaster) {
    const indexToUpdate = this.user.masterList.findIndex(master => {
      return master._id == update._id;
    });
    this.user.masterList[indexToUpdate] = update;
    this.events.publish('user-update', this.user);
  }

  private updateRecipeEventHandler(update: Recipe) {
    let indexToUpdate = -1;
    for (let i=0; i < this.user.masterList.length; i++) {
      indexToUpdate = this.user.masterList[i].recipes.findIndex(recipe => {
        return recipe._id == update._id;
      });
      if (indexToUpdate != -1) {
        this.user.masterList[i].recipes[indexToUpdate] = update;
        this.events.publish('user-update', this.user);
        return;
      }
    }
  }

  private updateBatchEventHandler(data: any) {
    const indexToUpdate = this.user.inProgressList.findIndex(batch => {
      return batch._id == data.id;
    });
    if (data.type == 'start') {
      this.user.inProgressList.push(data.batchList);
    } else if (data.type == 'next') {
      this.user.inProgressList[indexToUpdate].currentStep++;
    } else if (data.type == 'step-update') {
      this.user.inProgressList[indexToUpdate] = data.update;
    } else if (data.type == 'end') {
      this.user.inProgressList.splice(indexToUpdate, 1);
    }
    this.events.publish('user-update', this.user);
  }

  public signUp(user: any): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/users/signup', user)
      .map((response: any) => {
        if (response.success) {
          this.logIn({username: user.username, password: user.password})
            .subscribe(loginResponse => {
              console.log(loginResponse);
            });
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  public logIn(user: any): Observable<any> {
    return this.authService.logIn(user)
      .flatMap(response => {
        if (response.success) {
          this.loggedIn = true;
          return this.getUserProfile()
            .map(profile => {
              this.user = profile;
              return profile.username;
            });
        } else {
          return response;
        }
      });
  }

  public getLoginStatus(): boolean {
    return this.loggedIn;
  }

  public getUser() {
    return this.getLoginStatus() ? this.user: null;
  }

  public getUserProfile(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/users/profile')
      .map((profile: User) => {
        this.user = profile;
        this.events.publish('on-login');
        return profile;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  public updateUserProfile(user: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + '/users/profile', user)
      .catch(error => this.processHttpError.handleError(error));
  }

  public updateUserInProgressList(list: Array<Batch>): void {
    this.user.inProgressList = list;
    console.log('updated list', this.user);
    this.events.publish('user-update', this.user);
  }

}
