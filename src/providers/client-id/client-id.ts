/* Module imports */
import { Injectable } from '@angular/core';


@Injectable()
export class ClientIdProvider {
  cid: number;

  constructor() {
    this.cid = Date.now();
  }

  /**
   * Generate a new client side id that is numeric only
   *
   * @params: none
   *
   * @return: an id as a string of numbers
  **/
  getNewId(): string {
    return (this.cid++).toString();
  }

}
