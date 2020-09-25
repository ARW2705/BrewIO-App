/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';


@Pipe({
  name: 'moment',
})
export class MomentPipe implements PipeTransform {

  /**
   * Utilize Moment.js methods for templates
   *
   * @params: _moment - the Moment instance
   * @params: fName - the Moment method to call
   * @params: options - any optional inputs
   *
   * @return: the string of Moment data
  **/
  transform(_moment: moment.Moment, fName: string, ...options: any[]): string {
    switch(fName) {
      case 'format':
        return _moment.format(<string>options[0]);
      case 'date':
        return _moment.date().toString();
      default:
        return '';
    }
  }

}
