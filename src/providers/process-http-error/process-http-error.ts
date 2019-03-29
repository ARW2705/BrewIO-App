import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/throw';

@Injectable()
export class ProcessHttpErrorProvider {

  constructor() {
    console.log('Hello ProcessHttpErrorProvider Provider');
  }

  handleError(error: HttpErrorResponse | any) {
    let errMsg: string;
    if (error instanceof HttpErrorResponse) {
      const errStatus = error.status ? error.status: 503;
      const errText = error.status ? error.statusText: 'Service unavailable';
      errMsg = `<${errStatus}> ${errText || ''}`;
    } else {
      errMsg = (error.message) ? error.message: error.toString();
    }
    return Observable.throw(errMsg);
  }

}
