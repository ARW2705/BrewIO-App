/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'round',
})
export class RoundPipe implements PipeTransform {

  /**
   * Round given value to nearest integer or return the value if not a number
   *
   * @params: value - input string
   *
   * @return: rounded number if not nan
  **/
  transform(value: string): number | string {
    const rounded: number = Math.round(parseFloat(value));
    return isNaN(rounded) ? value: rounded;
  }
}
