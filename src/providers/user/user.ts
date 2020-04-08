/* Module imports */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { User } from '../../shared/interfaces/user';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';

/* Local Interfaces */
interface JWTResponse {
  status: string;
  success: boolean;
  user: any
};


@Injectable()
export class UserProvider {
  user$: BehaviorSubject<User> = new BehaviorSubject<User>({
    _id: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    username: undefined,
    firstname: undefined,
    lastname: undefined,
    email: undefined,
    friendList: [],
    token: undefined
  });
  userStorageKey: string = 'user';

  constructor(
    public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public connectionService: ConnectionProvider
  ) { }

  /**
   * Request server check json web token validity
   *
   * @params: none
   *
   * @return: Observable of JWTResponse
  **/
  checkJWToken(): Observable<JWTResponse> {
    return this.http.get<JWTResponse>(`${baseURL}/${apiVersion}/users/checkJWToken`)
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Set user subject data to undefined values and clear ionic storage
   *
   * @params: none
   * @return: none
  **/
  clearUserData(): void {
    this.user$.next({
      _id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      username: undefined,
      firstname: undefined,
      lastname: undefined,
      email: undefined,
      friendList: [],
      token: undefined
    });

    this.storageService.removeUser();
    this.events.publish('clear-data');
  }

  /**
   * Retrieve user authentication json web token
   *
   * @params: none
   * @return: none
  **/
  getToken(): string {
    return this.user$.value.token;
  }

  /**
   * Get the user subject
   *
   * @params: none
   *
   * @return: user behavior subject
  **/
  getUser(): BehaviorSubject<User> {
    return this.user$;
  }

  /**
   * Check if user is logged in
   *
   * @params: none
   *
   * @return: true if an auth token is present in user subject
  **/
  isLoggedIn(): boolean {
    return this.user$.value.token !== undefined;
  }

  /**
   * Load user data ionic storage. If user id is not 'offline', check if the
   * json web token is still valid before continuing. On success, publish event
   * to trigger data requests
   *
   * @params: none
   * @return: none
  **/
  loadUserFromStorage(): void {
    this.storageService.getUser()
      .subscribe(
        user => {
          this.user$.next(user);
          if (user._id === 'offline') {
            this.connectionService.setOfflineMode(true);
          } else {
            this.checkJWToken()
              .subscribe(
                (jwtResponse: JWTResponse) => {
                  console.log(jwtResponse.status);
                },
                (error: HttpErrorResponse) => {
                  console.log(error);
                  this.clearUserData();
                }
              );
          }
          this.events.publish('init-data');
        },
        error => console.log('user load error', error.error)
      );
  }

  /**
   * Log user in with username and password. Update user subject with response.
   * If user selected to remember login, store user data in ionic storage
   *
   * @params: user - contains username string, password string, and remember boolean
   *
   * @return: observable with login response data
  **/
  logIn(user: any): Observable<any> {
    return this.http.post(`${baseURL}/${apiVersion}/users/login`, user)
      .map((response: any) => {
        if (response.success) {
          this.user$.next(response.user);
          this.connectionService.setOfflineMode(false);
          this.events.publish('init-data');
          if (user.remember) {
            this.storageService.setUser(response.user)
              .subscribe(
                () => console.log('stored user data'),
                (error: ErrorObservable) => console.log('user store error', error)
              );
          }
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Clear stored user data on logout
   *
   * @params: none
   * @return: none
  **/
  logOut(): void {
    this.connectionService.setOfflineMode(true);
    this.clearUserData();
  }

  /**
   * Sign up a new user and login if successful
   *
   * @params: user - user must contain at least a username, password, and email
   *
   * @return: if signup successful, return observable of login response, else signup response
  **/
  signUp(user: any): Observable<any> {
    return this.http.post(`${baseURL}/${apiVersion}/users/signup`, user)
      .map((response: any) => {
        if (response.success) {
          this.logIn({username: user.username, password: user.password})
            .subscribe(user => {
              console.log('Signup successful, logging in', user.username);
            });
        }
        return response;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  /**
   * Update user profile
   *
   * @params: user - object with user profile data
   *
   * @return: Observable of user data from server
  **/
  updateUserProfile(user: any): Observable<User> {
    return this.http.patch(`${baseURL}/${apiVersion}/users/profile`, user)
      .map((updatedUser: User) => {
        const userData = this.user$.value;
        for (const key in updatedUser) {
          if (userData.hasOwnProperty(key)) {
            userData[key] = updatedUser[key];
          }
        }
        this.user$.next(userData);
        return updatedUser;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

}
