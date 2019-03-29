import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { Observable, Subject } from 'rxjs';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { User } from '../../shared/interfaces/user';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { NativeStorageProvider } from '../native-storage/native-storage';

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
  private username: Subject<string> = new Subject<string>();
  private publicUsername: string = '';
  private authToken: string = undefined;
  private tokenKey: string = 'JWT';

  constructor(public http: HttpClient,
    private nativeStorage: NativeStorage,
    private processHttpError: ProcessHttpErrorProvider,
    private storageUtils: NativeStorageProvider) {
    console.log('Hello AuthenticationProvider Provider');
  }

  checkJWTtoken() {
    this.http.get<JWTResponse>(baseURL + apiVersion + '/users/checkJWTtoken')
      .subscribe(
        response => {
          console.log('JWT token valid');
          this.sendUsername(response.user.username);
        },
        error => {
          console.log('JWT token invalid');
          this.destroyUserCredentials();
        });
  }

  sendUsername(name: string) {
    this.username.next(name);
  }

  clearUsername() {
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

  loadUserCredentials() {
    this.nativeStorage.getItem(this.tokenKey)
      .then(
        token => {
          if (token) {
            const credentials = JSON.parse(token);
            if (credentials && credentials.username != undefined) {
              this.useCredentials(credentials);
              if (this.authToken) {
                this.checkJWTtoken();
              }
            } else {
              console.log('Token not found');
            }
          }
        },
        error => this.storageUtils.onNativeStorageError('Loading credentials', error)
      );
  }

  storeUserCredentials(credentials: any) {
    this.nativeStorage.setItem(this.tokenKey, JSON.stringify(credentials))
      .then(
        () => console.log('Stored Credentials'),
        error => this.storageUtils.onNativeStorageError('Storing credentials', error)
      );
    this.useCredentials(credentials);
  }

  useCredentials(credentials: any) {
    this.publicUsername = credentials.username;
    this.sendUsername(credentials.username);
    this.authToken = credentials.token;
  }

  destroyUserCredentials() {
    this.authToken = undefined;
    this.clearUsername();
    this.nativeStorage.remove(this.tokenKey)
      .then(
        () => console.log('JWT removed from storage'),
        error => this.storageUtils.onNativeStorageError('Destroying credentials', error)
      );
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

  logOut() {
    this.destroyUserCredentials();
  }

}
