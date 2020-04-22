/* Module imports */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/* Interface imports */
import { RecipeMaster } from '../../shared/interfaces/recipe-master';
import { Recipe } from '../../shared/interfaces/recipe';
import { Batch } from '../../shared/interfaces/batch';
import { User } from '../../shared/interfaces/user';

/* Provider imports */
import { RecipeProvider } from '../recipe/recipe';
import { ProcessProvider } from '../process/process';
import { UserProvider } from '../user/user';
import { ConnectionProvider } from '../connection/connection';
import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

/* Local interface */
interface PendingRequest {
  type: string;
  method: string;
  data: RecipeMaster | Recipe | Batch | User;
};


@Injectable()
export class SyncProvider {
  pendingRequests: Set<object> = new Set();

  constructor(public http: HttpClient,
    public recipeService: RecipeProvider,
    public processService: ProcessProvider,
    public userService: UserProvider,
    public connectionService: ConnectionProvider,
    public processHttpError: ProcessHttpErrorProvider) { }

  addPendingRequest(requestType: string, requestMethod: string, update: RecipeMaster | Recipe | Batch | User): void {
    this.pendingRequests.add(
      {
        type: requestType,
        method: requestMethod,
        data: update
      }
    );
  }

  handlePendingRequests(): void {
    if (this.connectionService.isConnected()) {
      this.pendingRequests.forEach((request: PendingRequest) => {
        switch (request.type) {
          case 'recipe-master':

            break;
          case 'recipe':

            break;
          case 'batch':

            break;
          case 'user':

            break;
          default:
            console.log('Unknown request type submitted');
            break;
        }
      });
      this.pendingRequests.clear();
    }
  }

}
