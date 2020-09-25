/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {

  /**
   * Truncate a number to a given decimal place
   *
   * @params: value - the value to truncate
   * @params: places - the number of decimal places to keep
   *
   * @return: the truncated value
  **/
  transform(value: number, places: number): string {
    return value.toFixed(places);
  }
}
