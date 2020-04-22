/* Module imports */
import { Injectable } from '@angular/core';

/* Constants imports */
import { systemTypes } from '../../shared/constants/units';


@Injectable()
export class PreferencesProvider {
  units: string = 'e';

  constructor() { }

  /**
   * Set unit system
   *
   * @params: units - 'e' for english standard and 'm' for metric
   *
   * @return: none
  **/
  setUnits(units: string): void {
    if (!systemTypes.includes(units)) throw new Error(`Invalid unit type: ${units}`);
    this.units = units;
  }

}
