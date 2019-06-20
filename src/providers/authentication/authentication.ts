import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

interface AuthResponse {
  status: string;
  success: string;
  token: string;
};

interface JWTResponse {
  status: string;
  success: string;
  user: any
};

@Injectable()
export class AuthenticationProvider {
  username: Subject<string> = new Subject<string>();
  publicUsername: string = '';
  authToken: string = undefined;
  tokenKey: string = 'JWT';

  constructor(public http: HttpClient,
    public storage: Storage,
    public processHttpError: ProcessHttpErrorProvider) { }

  checkJWTtoken(): void {
    this.http.get<JWTResponse>(baseURL + apiVersion + '/users/checkJWTtoken')
      .subscribe(
        response => {
          console.log('JWT token valid');
          this.sendUsername(response.user.username);
        },
        error => {
          console.log('JWT token invalid', error);
          this.destroyUserCredentials();
        });
  }

  sendUsername(name: string): void {
    this.username.next(name);
  }

  clearUsername(): void {
    this.username.next(undefined);
  }

  getUsername(): Observable<string> {
    return this.username.asObservable();
  }

  getPublicUsername(): string {
    return this.publicUsername;
  }

  getToken(): string {
    return this.authToken;
  }

  loadUserCredentials(): Observable<any> {
    return Observable.fromPromise(
      this.storage.get(this.tokenKey)
        .then(token => {
          if (token) {
            const credentials = JSON.parse(token);
            if (credentials && credentials.username != undefined) {
              this.useCredentials(credentials);
              if (this.authToken) {
                this.checkJWTtoken();
              }
              return {error: null};
            } else {
              return {error: 'Token not found'};
            }
          }
        })
        .catch(error => {
          return {error: error};
        })
    );
  }

  storeUserCredentials(credentials: any): void {
    this.storage.set(this.tokenKey, JSON.stringify(credentials));
    this.useCredentials(credentials);
  }

  useCredentials(credentials: any): void {
    this.publicUsername = credentials.username;
    this.sendUsername(credentials.username);
    this.authToken = credentials.token;
  }

  destroyUserCredentials(): void {
    this.authToken = undefined;
    this.clearUsername();
    this.storage.remove(this.tokenKey)
      .then(() => console.log('Removed token'));
  }

  logIn(user: any): Observable<any> {
    return this.http.post<AuthResponse>(baseURL + apiVersion + '/users/login', user)
      .map(response => {
        const credentials = {
          username: user.username,
          token: response.token
        };
        if (user.remember) {
          this.storeUserCredentials(credentials);
        } else {
          this.useCredentials(credentials);
        }
        return {success: true, username: user.username};
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  logOut(): void {
    this.destroyUserCredentials();
  }

}
