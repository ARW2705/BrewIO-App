/* Module imports */
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/throw';

@Injectable()
export class ProcessHttpErrorProvider {

  constructor() { }

  // TODO format error messages
  /**
   * Parse HTTP error message
   *
   * @params: error - HTTP error response
   *
   * @return: observable of error message
  **/
  handleError(error: HttpErrorResponse | any): Observable<any> {
    let errMsg: string;
    if (error instanceof HttpErrorResponse) {
      if (error.status == 401 && error.error.error) {
        const drilldownError = error.error.error;
        errMsg = `${drilldownError.name}: ${drilldownError.message}`;
      } else {
        const errStatus = error.status ? error.status: 503;
        const errText = error.status ? error.statusText: 'Service unavailable';
        const additionalText = error.error.name == 'ValidationError'
                               ? error.error.message
                               : '';
        errMsg = `<${errStatus}> ${errText || ''}: ${additionalText}`;
      }
    } else {
      errMsg = (error.message) ? error.message: error.toString();
    }
    return Observable.throw(errMsg);
  }

}
