import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Events } from 'ionic-angular';

import { baseURL } from '../../shared/constants/base-url';
import { apiVersion } from '../../shared/constants/api-version';
import { InventoryItem } from '../../shared/interfaces/inventory-item';

import { ProcessHttpErrorProvider } from '../process-http-error/process-http-error';

@Injectable()
export class InventoryProvider {
  inventory: Array<InventoryItem> = null;

  constructor(public http: HttpClient,
    public events: Events,
    public processHttpError: ProcessHttpErrorProvider) { }

  clearInventory(): void {
    this.inventory = null;
  }

  getAllInventory(): Observable<Array<InventoryItem>> {
    return this.http.get(`${baseURL}/${apiVersion}/inventory`)
      .map((fullInventory: Array<InventoryItem>) => {
        this.inventory = fullInventory
        return fullInventory;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  postNewInventory(newInventory: InventoryItem): Observable<InventoryItem> {
    return this.http.post(`${baseURL}/${apiVersion}/inventory`, newInventory)
      .map((newItem: InventoryItem) => {
        this.inventory.push(newItem);
        this.events.publish('new-inventory', newItem);
        return newItem;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  getItemsByMasterId(masterId: string): Observable<Array<InventoryItem>> {
    if (this.inventory == null) {
      return this.getAllInventory()
        .map((inventory: Array<InventoryItem>) => inventory.filter(item => item.itemDetails.master == masterId));
    } else {
      return Observable.of(this.inventory.filter(item => item.itemDetails.master == masterId));
    }
  }

  getItemsByRecipeId(recipeId: string): Observable<Array<InventoryItem>> {
    if (this.inventory == null) {
      return this.getAllInventory()
        .map((inventory: Array<InventoryItem>) => inventory.filter(item => item.itemDetails.recipe == recipeId));
    } else {
      return Observable.of(this.inventory.filter(item => item.itemDetails.recipe == recipeId));
    }
  }

  getItemById(itemId: string): Observable<InventoryItem> {
    return this.http.get(`${baseURL}/${apiVersion}/inventory/${itemId}`)
      .catch(error => this.processHttpError.handleError(error));
  }

  patchItemById(itemId: string, update: object): Observable<InventoryItem> {
    return this.http.patch(`${baseURL}/${apiVersion}/inventory/${itemId}`, update)
      .map((update: InventoryItem) => {
        const toUpdateIndex = this.inventory.findIndex(item => item._id == update._id);
        this.inventory[toUpdateIndex] = update;
        this.events.publish('update-inventory', update);
        return update;
      })
      .catch(error => this.processHttpError.handleError(error));
  }

  deleteItemById(itemId: string): Observable<InventoryItem> {
    return this.http.delete(`${baseURL}/${apiVersion}/inventory/${itemId}`)
      .map((toDelete: InventoryItem) => {
        const toDeleteIndex = this.inventory.findIndex(item => item._id === toDelete._id);
        if (toDeleteIndex !== -1) {
          this.inventory.splice(toDeleteIndex, 1);
          this.events.publish('delete-inventory', toDelete);
        }
        return toDelete;
      })
      .catch(error => this.processHttpError.handleError(error));
  }
}
