import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { User } from '../../shared/interfaces/user';

import { AuthenticationProvider } from '../authentication/authentication';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class UserProvider {
  private loggedIn: boolean = false;
  private user: User = null;

  constructor(public http: HttpClient,
    private events: Events,
    private authService: AuthenticationProvider,
    private processHttpError: ProcessHttpErrorProvider) {
    console.log('Hello UserProvider Provider');
  }

  public signUp(user: any): Observable<any> {
    return this.http.post(baseURL + apiVersion + '/users/signup', user)
      .map((response: any) => {
        if (response.success) {
          this.logIn({username: user.username, password: user.password});
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

}
