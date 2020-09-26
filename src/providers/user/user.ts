/* Module imports */
import { Events } from 'ionic-angular';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators/catchError';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators/map';

/* Constants imports */
import { API_VERSION } from '../../shared/constants/api-version';
import { BASE_URL } from '../../shared/constants/base-url';

/* Default imports */
import { defaultEnglish } from '../../shared/defaults/default-units';

/* Utility imports */
import { normalizeErrorObservableMessage } from '../../shared/utility-functions/observable-helpers';

/* Interface imports */
import { LoginCredentials } from '../../shared/interfaces/login-credentials';
import { SelectedUnits } from '../../shared/interfaces/units';
import { User } from '../../shared/interfaces/user';
import { UserResponse } from '../../shared/interfaces/user-response';

/* Provider imports */
import { ConnectionProvider } from '../connection/connection';
import { PreferencesProvider } from '../preferences/preferences';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';
import { StorageProvider } from '../storage/storage';


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
    preferredUnitSystem: undefined,
    units: undefined
  });
  userStorageKey: string = 'user';

  constructor(
    public events: Events,
    public http: HttpClient,
    public connectionService: ConnectionProvider,
    public preferenceService: PreferencesProvider,
    public processHttpError: ProcessHttpErrorProvider,
    public storageService: StorageProvider
  ) { }

  /**
   * Request server check json web token validity
   *
   * @params: none
   *
   * @return: Observable of UserResponse
  **/
  checkJWToken(): Observable<UserResponse> {
    return this.http.get<UserResponse>(
      `${BASE_URL}/${API_VERSION}/users/checkJWToken`
    )
    .pipe(
      catchError((error: HttpErrorResponse): ErrorObservable => {
        return this.processHttpError.handleError(error)
      })
    );
  }

  /**
   * Set user subject data to default values, clear user from ionic storage,
   * and emit event to call any other stored values to be cleared
   *
   * @params: none
   * @return: none
  **/
  clearUserData(): void {
    const _defaultEnglish: SelectedUnits = defaultEnglish();
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
      preferredUnitSystem: _defaultEnglish.system,
      units: _defaultEnglish
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
    return this.getUser().value.token !== undefined
      && this.getUser().value.token !== '';
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
        (user: User): void => {
          this.user$.next(user);
          if (this.isLoggedIn()) {
            this.checkJWToken()
              .subscribe(
                (jwtResponse: UserResponse): void => {
                  console.log(jwtResponse.status);
                },
                (error: string): void => {
                  // TODO: feedback to login again
                  console.log(error);
                  if (error.includes('401')) {
                    const removedToken: User = this.getUser().value;
                    removedToken.token = undefined;
                    this.user$.next(removedToken);
                  }
                }
              );
          } else {
            this.connectionService.setOfflineMode(true);
          }
          this.events.publish('init-recipes');
          this.preferenceService.setUnits(
            user.preferredUnitSystem,
            user.units
          );
        },
        (error: ErrorObservable): void => {
          console.log(
            `User load error: ${normalizeErrorObservableMessage(error)}`
          );
        }
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
    return this.http.post(`${BASE_URL}/${API_VERSION}/users/login`, user)
      .pipe(
        map((response: UserResponse): User => {
          this.user$.next(response.user);
          this.connectionService.setOfflineMode(false);

          if (onSignupSync) {
            this.events.publish('sync-recipes-on-signup');
          } else {
            this.events.publish('init-recipes');
          }

          this.preferenceService.setUnits(
            response.user.preferredUnitSystem,
            response.user.units
          );

          if (user.remember) {
            this.storageService.setUser(response.user)
              .subscribe(
                (): void => console.log('stored user data'),
                (error: ErrorObservable): void => {
                  console.log(
                    `User store error: ${normalizeErrorObservableMessage(error)}`
                  );
                }
              );
          }

          return response.user;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error)
        })
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
   * @return: if signup successful, return observable of login response,
   *          else signup response
  **/
  signUp(user: object): Observable<UserResponse> {
    // Attach required user fields
    user['preferredUnitSystem'] = this.preferenceService.preferredUnitSystem;
    user['units'] = this.preferenceService.units;

    return this.http.post(`${BASE_URL}/${API_VERSION}/users/signup`, user)
      .pipe(
        map((response: UserResponse): UserResponse => {
          this.logIn(
            {
              username: user['username'],
              password: user['password'],
              remember: true
            },
            true
          )
          .subscribe((_user: User): void => {
            console.log(
              'Signup successful; log in successful', user['username']
            );
          });
          return response;
        }),
        catchError((error: HttpErrorResponse): ErrorObservable => {
          return this.processHttpError.handleError(error);
        })
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
    if (this.isLoggedIn()) {
      return this.http.patch(`${BASE_URL}/${API_VERSION}/users/profile`, user)
        .pipe(
          map((updatedUser: object): User => {
            const userData: User = this.getUser().value;

            for (const key in updatedUser) {
              if (userData.hasOwnProperty(key)) {
                userData[key] = updatedUser[key];
              }
            }

            this.user$.next(userData);

            this.preferenceService.setUnits(
              updatedUser['preferredUnitSystem'],
              updatedUser['units']
            );

            this.storageService.setUser(userData)
              .subscribe(() => console.log('user data stored'));

            return userData;
          }),
          catchError((error: HttpErrorResponse): ErrorObservable => {
            return this.processHttpError.handleError(error);
          })
        );
    }

    return of(null);
  }

}
