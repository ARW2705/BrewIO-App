/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort',
})
export class SortPipe implements PipeTransform {
  /**
   * Array sorting pipe
   *
   * @params: array - an array of objects - supports objects with attributes: 'datetime'
   * @params: sortBy - string to determine which sorting parameter to perform on
   *
   * @return: array - sorted array, returns undefined if something other than array is passed
  **/
  transform(array: any, sortBy: string): any[] {
    if (!Array.isArray(array)) {
      return;
    }
    switch(sortBy) {
      case 'datetime':
        array.sort(this.sortByISOString);
        break;
      default:
        break;
    }
    return array;
  }

  /**
   * Sort array by datetime
   *
   * @params: lh - left hand object to compare with an ISO string as a property named 'datetime'
   * @params: rh - right hand object to compare with an ISO string as a property named 'datetime'
   *
   * @return: -1 to insert lh first, 1 to insert rh first, 0 to not change order
  **/
  sortByISOString(lh: any, rh: any): number {
    if (!lh.hasOwnProperty('datetime') || !rh.hasOwnProperty('datetime')) {
      console.error('Sort pipe error: comparate missing \'datetime\' property');
      return 0;
    }
    if (lh.datetime < rh.datetime) {
      return -1;
    } else if (lh.datetime > rh.datetime) {
      return 1;
    } else {
      return 0;
    }
  }
}
