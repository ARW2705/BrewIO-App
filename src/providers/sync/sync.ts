/* Module imports */
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { map } from 'rxjs/operators/map';
import { catchError } from 'rxjs/operators/catchError';
import { of } from 'rxjs/observable/of';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Constants imports */
import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';
import { SyncMetadata } from '../../shared/interfaces/sync-metadata';
import { SyncResponse } from '../../shared/interfaces/sync-response';

/* Utility imports */
import { hasDefaultIdType } from '../../shared/utility-functions/utilities';

/* Provider imports */
import { StorageProvider } from '../storage/storage';


@Injectable()
export class SyncProvider {
  syncFlags: Array<SyncMetadata> = [];
  syncKey = 'sync';

  constructor(
    public http: HttpClient,
    public events: Events,
    public storageService: StorageProvider
  ) {
    this.events.subscribe('clear-data', this.clearSyncData.bind(this));
    this.storageService.getSyncFlags()
      .subscribe(
        flags => {
          this.syncFlags = flags;
        },
        error => {
          console.log('Sync error', error);
        }
      );
  }

  /**
   * Clear sync flags array and clear storage
   *
   * @params: none
   * @return: none
  **/
  clearSyncData(): void {
    this.syncFlags = [];
    this.storageService.removeSyncFlags();
  }

  /**
   * Get all sync flags
   *
   * @params: none
   *
   * @return: Array of all sync metadata
  **/
  getAllSyncFlags(): Array<SyncMetadata> {
    return this.syncFlags;
  }

  /**
   * Get array of sync flags filtered by docType
   *
   * @params: docType - document type to filter by
   *
   * @return: Array of sync metadata for given docTypes
  **/
  getSyncFlagsByType(docType: string): Array<SyncMetadata> {
    return this.syncFlags.filter(syncFlag => syncFlag.docType === docType);
  }

  /**
   * Add a flag to sync document on reconnect with the following considerations:
   * Sync method is primary determination for flags being added or modified.
   *
   * For 'create' method: No conditions, the flag is always added
   *
   * For 'update' method: Add this flag only if there are no other flags for docId
   *
   * For 'delete' method: Add, modify, or remove flag based on the following conditions
   *  - If no flags present, add the delete flag
   *  - If a create flag is present, remove the flag. The doc doesn't need to sync
   *    before deleting
   *  - If an update flag is present, change the method to delete. The doc doesn't
   *    need to be updated before deleting
   *
   * @params: metadata - SyncMetadata containing sync method and doc id
   *
   * @return: none
  **/
  addSyncFlag(metadata: SyncMetadata): void {
    if (metadata.method === 'create') {
      this.syncFlags.push(metadata);
    } else if (metadata.method === 'update') {
      const currentFlagIndex = this.syncFlags.findIndex(syncFlag => {
        return syncFlag.docId === metadata.docId;
      });

      if (currentFlagIndex === -1 && !hasDefaultIdType(metadata.docId)) {
        this.syncFlags.push(metadata);
      }
    } else if (metadata.method === 'delete') {
      const currentFlagIndex = this.syncFlags.findIndex(syncFlag => {
        return syncFlag.docId === metadata.docId;
      });

      if (currentFlagIndex === -1) {
        this.syncFlags.push(metadata);
      } else if (this.syncFlags[currentFlagIndex].method === 'create') {
        this.syncFlags.splice(currentFlagIndex, 1);
      } else if (this.syncFlags[currentFlagIndex].method === 'update') {
        this.syncFlags[currentFlagIndex].method = 'delete';
      }
    } else {
      throw new Error(`Unknown sync flag method: ${metadata.method}`);
    }
    this.updateStorage();
  }

  /**
   * Peform a delete operation, process error as new observable to use in forkJoins
   *
   * @params: route - server route to request a deletion
   *
   * @return: Observable of deletion flag on success or http error
  **/
  deleteSync(route: string): Observable<object> {
    return this.http.delete(`${baseURL}/${apiVersion}/${route}`)
      .pipe(
        map(response => {
          return {
            isDeleted: true,
            data: response
          }
        }),
        catchError(error => of(error))
      );
  }

  /**
   * Peform a patch operation, process error as new observable to use in forkJoins
   *
   * @params: route - server route to request a patch
   * @params: data - current document flagged for an update
   *
   * @return: Observable of server response
  **/
  patchSync(route: string, data: RecipeMaster | Batch | User): Observable<RecipeMaster | Batch | User> {
    return this.http.patch(`${baseURL}/${apiVersion}/${route}`, data)
      .pipe(catchError(error => of(error)));
  }

  /**
   * Peform a post operation, process error as new observable to use in forkJoins
   *
   * @params: route - server route to request a post
   * @params: data - current document flagged for server post
   *
   * @return: Observable of server response
  **/
  postSync(route: string, data: RecipeMaster | Batch | User): Observable<RecipeMaster | Batch | User> {
    return this.http.post(`${baseURL}/${apiVersion}/${route}`, data)
      .pipe(catchError(error => of(error)));
  }

  /**
   * Process sync error responses into messages
   *
   * @params: errorData - array of errors
   *
   * @return: array of formatted error messages
  **/
  processSyncErrors(errorData: Array<HttpErrorResponse | Error>): Array<string> {
    return errorData.map(error => {
      let errMsg: string;
      if (error instanceof HttpErrorResponse) {
        const errStatus = error.status ? error.status: 503;
        const errText = error.status ? error.statusText: 'Service unavailable';
        const additionalText = error.error && error.error.name === 'ValidationError'
                               ? `: ${error.error.message}`
                               : '';
        errMsg = `<${errStatus}> ${errText || ''}${additionalText}`;
      } else {
        errMsg = error.message;
      }
      return errMsg;
    });
  }

  /**
   * Perform sync http requests
   *
   * @params: docType - document type of requests
   * @params: requests - Array of http request observables
   *
   * @return: observable of sync responses
  **/
  sync(docType: string, requests: Array<Observable<any>>): Observable<SyncResponse> {
    console.log(`performing ${docType} sync requests`);
    return forkJoin(requests)
      .pipe(
        map(responses => {
          this.syncFlags = this.syncFlags.filter(syncFlag => {
            return syncFlag.docType !== docType;
          });
          this.updateStorage();

          const errors = [];
          const successes = [];

          responses.forEach((response: any) => {
            if (response instanceof HttpErrorResponse || response instanceof Error) {
              errors.push(response);
            } else {
              successes.push(response);
            }
          });

          return {
            successes: successes,
            errors: this.processSyncErrors(errors)
          };
        })
      );
  }

  /**
   * Update stored sync flags
   *
   * @params: none
   * @return: none
  **/
  updateStorage(): void {
    this.storageService.setSyncFlags(this.syncFlags)
      .subscribe(
        () => console.log('Stored sync flags'),
        (error: ErrorObservable) => console.log('Sync flag store error', error)
      );
  }

}
