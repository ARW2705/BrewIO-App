/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { map } from 'rxjs/operators/map';
import { catchError } from 'rxjs/operators/catchError';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { User } from '../../shared/interfaces/user';
import { UserResponse } from '../../shared/interfaces/user-response';
import { LoginCredentials } from '../../shared/interfaces/login-credentials';

/* Provider imports */
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';
import { ConnectionProvider } from '../connection/connection';
import { PreferencesProvider } from '../preferences/preferences';


@Injectable()
export class UserProvider {
  user$: BehaviorSubject<User> = new BehaviorSubject<User>({
    _id: undefined,
    cid: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    username: undefined,
    firstname: undefined,
    lastname: undefined,
    email: undefined,
    friendList: [],
    token: undefined,
    preferredUnits: undefined
  });
  userStorageKey: string = 'user';

  constructor(
    public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider,
    public connectionService: ConnectionProvider,
    public preferenceService: PreferencesProvider
  ) { }

  /**
   * Request server check json web token validity
   *
   * @params: none
   *
   * @return: Observable of UserResponse
  **/
  checkJWToken(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${baseURL}/${apiVersion}/users/checkJWToken`)
      .pipe(catchError(error => this.processHttpError.handleError(error)));
  }

  /**
   * Set user subject data to default values, clear user from ionic storage,
   * and emit event to call any other stored values to be cleared
   *
   * @params: none
   * @return: none
  **/
  clearUserData(): void {
    this.user$.next({
      _id: undefined,
      cid: 'offline',
      createdAt: undefined,
      updatedAt: undefined,
      username: '',
      firstname: undefined,
      lastname: undefined,
      email: undefined,
      friendList: [],
      token: '',
      preferredUnits: 'e'
    });

    this.storageService.removeUser();
    this.events.publish('clear-data');
  }

  /**
   * Retrieve user authentication json web token
   *
   * @params: none
   *
   * @return: user's auth token
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
   * @return: true if an auth token is present and not an empty string
  **/
  isLoggedIn(): boolean {
    return this.user$.value.token !== undefined && this.user$.value.token !== '';
  }

  /**
   * Load user data from ionic storage. If user is not logged in, set app for
   * offline mode. Otherwise, check if json web token is valid. Remove stored
   * token if no longer valid. Finally, emit event to request other data
   *
   * @params: none
   * @return: none
  **/
  loadUserFromStorage(): void {
    this.storageService.getUser()
      .subscribe(
        user => {
          this.user$.next(user);
          if (this.isLoggedIn()) {
            this.checkJWToken()
              .subscribe(
                (jwtResponse: UserResponse) => {
                  console.log(jwtResponse.status);
                },
                (error: string) => {
                  // TODO: feedback to login again
                  console.log(error);
                  if (error.includes('401')) {
                    const removedToken = this.user$.value;
                    removedToken.token = undefined;
                    this.user$.next(removedToken);
                  }
                }
              );
          } else {
            this.connectionService.setOfflineMode(true);
            this.preferenceService.setUnits('e');
          }
          this.events.publish('init-data');
          this.preferenceService.setUnits(user.preferredUnits);
        },
        error => console.log('user load error', error)
      );
  }

  /**
   * Log user in with username and password. Update user subject with response.
   * If user selected to remember login, store user data in ionic storage
   *
   * @params: user - contains username string, password string, and remember boolean
   * @params: onSignupSync - true if logging in after initial sign up
   *
   * @return: observable with login response user data
  **/
  logIn(user: LoginCredentials, onSignupSync: boolean): Observable<User> {
    return this.http.post(`${baseURL}/${apiVersion}/users/login`, user)
      .pipe(
        map((response: UserResponse) => {
          this.user$.next(response.user);
          this.connectionService.setOfflineMode(false);
          if (onSignupSync) {
            this.events.publish('sync-on-signup');
          } else {
            this.events.publish('init-data');
          }
          this.preferenceService.setUnits(response.user.preferredUnits);
          if (user.remember) {
            this.storageService.setUser(response.user)
              .subscribe(
                () => console.log('stored user data'),
                (error: ErrorObservable) => console.log('user store error', error)
              );
          }
          return response.user;
        }),
        catchError(error => this.processHttpError.handleError(error))
      );
  }

  /**
   * Clear stored user data on logout and set connection to offline
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
  signUp(user: object): Observable<UserResponse> {
    return this.http.post(`${baseURL}/${apiVersion}/users/signup`, user)
      .pipe(
        map((response: UserResponse) => {
          this.logIn(
            {
              username: user['username'],
              password: user['password'],
              remember: true
            },
            true
          )
          .subscribe(_user => {
            console.log('Signup successful; log in successful', user['username']);
          });
          return response;
        }),
        catchError(error => this.processHttpError.handleError(error))
      );
  }

  /**
   * Update user profile
   *
   * @params: user - object with new user profile data
   *
   * @return: Observable of user data from server
  **/
  updateUserProfile(user: object): Observable<User> {
    return this.http.patch(`${baseURL}/${apiVersion}/users/profile`, user)
      .pipe(
        map((updatedUser: User) => {
          const userData = this.user$.value;
          for (const key in updatedUser) {
            if (userData.hasOwnProperty(key)) {
              userData[key] = updatedUser[key];
            }
          }
          this.user$.next(userData);
          this.preferenceService.setUnits(userData.preferredUnits);
          return updatedUser;
        }),
        catchError(error => this.processHttpError.handleError(error))
      );
  }

}
