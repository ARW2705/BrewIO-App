/* Module imports */
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { _throw as throwError } from 'rxjs/observable/throw';


@Injectable()
export class ProcessHttpErrorProvider {

  constructor() { }

  /**
   * Parse HTTP error message into message string
   *
   * @params: error - HTTP error response
   *
   * @return: observable of error message
  **/
  handleError(error: HttpErrorResponse | any): ErrorObservable {
    let errMsg: string;
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401 && error.error && error.error.error) {
        const drilldownError: object = error.error.error;
        errMsg = drilldownError['message'];
      } else {
        const errStatus: number = error.status ? error.status: 503;
        const errText: string = error.status
          ? error.statusText
          : 'Service unavailable';
        const additionalText: string =
          error.error && error.error.name === 'ValidationError'
            ? `: ${error.error.message}`
            : '';
            
        errMsg = `<${errStatus}> ${errText || ''}${additionalText}`;
      }
    } else {
      errMsg = (error.message) ? error.message: error.toString();
    }
    return throwError(errMsg);
  }

}
