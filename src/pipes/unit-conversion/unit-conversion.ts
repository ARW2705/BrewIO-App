/* Module imports */
import { Pipe, PipeTransform } from '@angular/core';

/* Constant imports */
import * as Units from '../../shared/constants/units';

/* Interface imports */
import { SelectedUnits } from '../../shared/interfaces/units';

/* Provider imports */
import { CalculationsProvider } from '../../providers/calculations/calculations';
import { PreferencesProvider } from '../../providers/preferences/preferences';


@Pipe({
  name: 'unitConversion',
})
export class UnitConversionPipe implements PipeTransform {
  readonly SENTINEL: number = -1;

  constructor(
    public calculator: CalculationsProvider,
    public preferenceService: PreferencesProvider
  ) { }

  /**
   * Convert values to the preferred units; All values are stored as english
   * standard, only convert if units are a different standard; truncate long
   * decimal values
   *
   * @params: value - value to convert
   * @params: unitType - measurement type for unit
   * @params: [showSymbol] - true to add relevant symbol at the end of result
   * @params: [refresh] - not used internally - changing this parameter allows
   *          manually refreshing the pipe from the component when needed
   * @params: [reformat] - true to replace units in a larger text string
   *
   * @return: formatted string of converted value
  **/
  transform(
    value: number | string,
    unitType: string,
    showSymbol?: boolean,
    refresh?: boolean,
    reformat?: boolean
  ): string {
    if (value === -1) {
      return '--';
    }

    const units: SelectedUnits = this.preferenceService.getSelectedUnits();
    switch(unitType) {
      case 'density':
        if (this.calculator.requiresConversion('density', units)) {
          return (
              this.calculator.convertDensity(
                <number>value,
                Units.SPECIFIC_GRAVITY.longName,
                units.density.longName
              )
              .toFixed(1)
            )
            + (showSymbol ? units.density.symbol: '');
        } else {
          return (<number>value).toFixed(3);
        }

      case 'temperature':
        if (this.calculator.requiresConversion('temperature', units)) {
          return this.calculator.convertTemperature(<number>value,false).toFixed(1)
            + (showSymbol ? units.temperature.shortName: '');
        } else {
          return (<number>value).toFixed(1)
            + (showSymbol ? units.temperature.shortName: '');
        }

      case 'volumeLarge':
        if (this.calculator.requiresConversion('volumeLarge', units)) {
          return this.calculator.convertVolume(<number>value, true, false).toFixed(2)
            + (showSymbol ? units.volumeLarge.shortName: '');
        } else {
          return (<number>value).toFixed(2)
            + (showSymbol ? units.volumeLarge.shortName: '');
        }

      case 'volumeSmall':
        if (this.calculator.requiresConversion('volumeSmall', units)) {
          return this.calculator.convertVolume(<number>value, false, false).toFixed(0)
            + (showSymbol ? units.volumeSmall.shortName: '');
        } else {
          return (<number>value).toFixed(0)
            + (showSymbol ? units.volumeSmall.shortName: '');
        }

      case 'weightLarge':
        if (this.calculator.requiresConversion('weightLarge', units)) {
          return this.calculator.convertWeight(<number>value, true, false).toFixed(2)
            + (showSymbol ? units.weightLarge.shortName: '');
        } else {
          return (<number>value).toFixed(2)
            + (showSymbol ? units.weightLarge.shortName: '');
        }

      case 'weightSmall':
        if (reformat) {
          return this.reformatWeightSmallDescription(
            <string>value,
            units,
            showSymbol
          );
        } else if (this.calculator.requiresConversion('weightSmall', units)) {
          return this.calculator.convertWeight(<number>value, false, false).toFixed(2)
            + (showSymbol ? units.weightSmall.shortName: '');
        } else {
          return (<number>value).toFixed(2)
            + (showSymbol ? units.weightSmall.shortName: '');
        }

      default:
        return '--';
    }
  }

  /**
   * Take an input hops addition description and convert it to metric
   *
   * @params: value - description text to alter
   * @params: units - currently selected units
   * @params: showSymbol - true to show unit symbol, false to leave it blank
   *
   * @return: updated text
  **/
  reformatWeightSmallDescription(
    value: string,
    units: SelectedUnits,
    showSymbol: boolean
  ): string {
    const foundQuantity: string[] = value.match(/(\d+.)?\d+(?=oz)/g);

    if (
      this.calculator.requiresConversion('weightSmall', units)
      && foundQuantity
    ) {
      return `${value.split(':')[0]}: ${this.calculator.convertWeight(parseFloat(foundQuantity[0]), false, false).toFixed(2)}${showSymbol ? units.weightSmall.shortName: ''}`;
    }

    return value;
  }

}
