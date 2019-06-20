import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
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
import { RecipeProvider } from '../recipe/recipe';

@Injectable()
export class UserProvider {
  loggedIn: boolean = false;
  user: User = null;
  profileKey: string = 'userProfile';
  _newMaster: any;
  _updateMaster: any;
  _updateRecipe: any;
  _updateBatch: any;

  constructor(public http: HttpClient,
    public events: Events,
    public storage: Storage,
    public authService: AuthenticationProvider,
    public processHttpError: ProcessHttpErrorProvider,
    public recipeService: RecipeProvider) {
      this._newMaster = this.newMasterEventHandler.bind(this);
      this._updateMaster = this.updateMasterEventHandler.bind(this);
      this._updateRecipe = this.updateRecipeEventHandler.bind(this);
      this._updateBatch = this.updateBatchEventHandler.bind(this);
      this.events.subscribe('new-master', this._newMaster);
      this.events.subscribe('update-master', this._updateMaster);
      this.events.subscribe('update-recipe', this._updateRecipe);
      this.events.subscribe('update-batch', this._updateBatch);
  }

  clearProfile(): void {
    this.storage.remove(this.profileKey)
      .then(() => console.log('Removed profile'));
  }

  getLoginStatus(): boolean {
    return this.loggedIn;
  }

  getUser() {
    return this.getLoginStatus() ? this.user: null;
  }

  getUsername(): string {
    return this.user ? this.user.username: '';
  }

  getUserProfile(): Observable<User> {
    return this.http.get(baseURL + apiVersion + '/users/profile')
      .map((profile: User) => {
        this.user = profile;
        this.storeUserProfile(this.user);
        this.publishUserUpdate();
        return profile;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  loadProfileFromStorage(): Observable<any> {
    return Observable.fromPromise(
      this.storage.get(this.profileKey)
        .then(profile => {
          if (profile) {
            this.user = JSON.parse(profile);
            this.publishUserUpdate();
            return {error: null};
          } else {
            return {error: 'Profile not found'}
          }
        })
        .catch(error => {
          return {error: error};
        })
    );
  }

  loadUserFromStorage(): void {
    const credentials = this.authService.loadUserCredentials();
    const profile = this.loadProfileFromStorage();
    Observable.forkJoin(
      credentials,
      profile
    ).subscribe(([credentials, profile]) => {
      const hasCredentials = credentials ? true: false;
      const hasCredentialsError = credentials && credentials.error;
      const hasProfile = profile ? true: false;
      const hasProfileError = profile && profile.error;

      if (!hasCredentials || hasCredentialsError) {
        console.log('Credentials error', credentials);
        this.logOut();
      }

      if (!hasProfile || hasProfileError) {
        console.log('Cannot find user profile, requesting from server', profile.error);
        if (hasCredentials && !hasCredentialsError) {
          this.getUserProfile()
            .subscribe(profile => {
              if (!profile) {
                // TODO throw error getting profile
                console.log('Could not find stored profile');
              }
            });
        } else {
          console.log('Must be logged in');
        }
      }

      if (hasCredentials && !hasCredentialsError && hasProfile && !hasProfileError) {
        this.loggedIn = true;
      }
    });
  }

  logIn(user: any): Observable<any> {
    return this.authService.logIn(user)
      .flatMap(response => {
        if (response.success) {
          this.loggedIn = true;
          return this.getUserProfile()
            .map(profile => {
              return profile.username;
            });
        } else {
          return response;
        }
      });
  }

  logOut(): void {
    this.authService.logOut();
    this.loggedIn = false;
    this.user = null;
    this.clearProfile();
    this.publishUserUpdate();
  }

  newMasterEventHandler(): void {
    this.recipeService.getMasterList()
      .subscribe(masterList => {
        this.user.masterList = masterList;
        this.publishUserUpdate();
      });
  }

  publishUserUpdate(): void {
    this.events.publish('user-update', this.user);
  }

  signUp(user: any): Observable<User> {
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

  storeUserProfile(user: User): void {
    this.storage.set(this.profileKey, JSON.stringify(user));
  }

  updateBatchEventHandler(data: any) {
    const indexToUpdate = this.user.inProgressList.findIndex(batch => {
      return batch._id === data.id;
    });
    if (data.type === 'start') {
      this.user.inProgressList.push(data.batchList);
    } else if (data.type === 'next') {
      this.user.inProgressList[indexToUpdate].currentStep++;
    } else if (data.type === 'step-update') {
      this.user.inProgressList[indexToUpdate] = data.update;
    } else if (data.type === 'end') {
      this.user.inProgressList.splice(indexToUpdate, 1);
    }
    this.publishUserUpdate();
  }

  updateMasterEventHandler(update: RecipeMaster) {
    const indexToUpdate = this.user.masterList.findIndex(master => {
      return master._id === update._id;
    });
    this.user.masterList[indexToUpdate] = update;
    this.publishUserUpdate();
  }

  updateRecipeEventHandler(update: Recipe): void {
    let indexToUpdate = -1;
    for (let i=0; i < this.user.masterList.length; i++) {
      indexToUpdate = this.user.masterList[i].recipes.findIndex(recipe => {
        return recipe._id === update._id;
      });
      if (indexToUpdate !== -1) {
        this.user.masterList[i].recipes[indexToUpdate] = update;
        this.publishUserUpdate();
        return;
      }
    }
  }

  updateUserInProgressList(list: Array<Batch>): void {
    this.user.inProgressList = list;
    this.publishUserUpdate();
  }

  updateUserProfile(user: any): Observable<User> {
    return this.http.patch(baseURL + apiVersion + '/users/profile', user)
      .catch(error => this.processHttpError.handleError(error));
  }

}
