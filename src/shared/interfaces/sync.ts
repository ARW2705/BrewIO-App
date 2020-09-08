import { Batch } from './batch';
import { InventoryItem } from './inventory-item';
import { RecipeMaster } from './recipe-master';
import { User } from './user';

export interface Syncable { }; // Batch | InventoryItem | RecipeMaster | User

export interface SyncData {
  isDeleted: boolean;
  data: Syncable;
};

/**
  Sync handling schema

  Events to trigger sync operations:
    - Signup
    - Login
    - Reconnect


  Create:
    Conditions for adding flag:
      - Always add create flags

    On sync:
      - Perform a post request

  Update:
    Conditions for adding flag:
      - No other flags for the doc exist

    On sync:
      - Create was done offline - perform a post request
      - Create was done online - perform a patch request

  Delete:
    Conditions for adding flag:
      - No other flags exist - add flag
      - If create flag exists - remove the flag
      - If update flag exists - change flag method to delete

    On sync:
      - Perform a delete request
**/
export interface SyncMetadata {
  method: string; // 'create', 'update', or 'delete'
  docId: string; // _id property of doc
  docType: string; // 'recipe', 'batch', or 'user'
};

export interface SyncableResponse extends Batch, InventoryItem, RecipeMaster, User { };

export interface SyncResponse {
  successes: RecipeMaster[] | Batch[] | User[] | InventoryItem[];
  errors: string[];
};
