import { RecipeMaster } from './recipe-master';
import { Batch } from './batch';
import { User } from './user';

export interface SyncResponse {
  successes: Array<RecipeMaster | Batch | User>;
  errors: Array<string>;
};
