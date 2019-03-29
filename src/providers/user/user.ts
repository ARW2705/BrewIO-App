import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
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
    private authProvider: AuthenticationProvider,
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
    return this.authProvider.logIn(user)
      .map(response => {
        this.loggedIn = response.success;
        return response;
      });
  }

  public getLoginStatus(): boolean {
    return this.loggedIn;
  }

  public getUserProfile(): Observable<any> {
    return this.http.get(baseURL + apiVersion + '/users/profile')
      .catch(error => this.processHttpError.handleError(error));
  }

  public updateUserProfile(user: any): Observable<any> {
    return this.http.patch(baseURL + apiVersion + '/users/profile', user)
      .catch(error => this.processHttpError.handleError(error));
  }

}
