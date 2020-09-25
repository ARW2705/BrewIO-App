/* Mock imports */
import { mockEnglishUnits, mockMetricUnits } from '../../../test-config/mockmodels/mockUnits';

/* Constant imports */
import * as Units from '../../shared/constants/units';

/* Interface imports */
import { SelectedUnits } from '../../shared/interfaces/units';

/* Provider imports */
import { CalculationsProvider } from '../../providers/calculations/calculations';
import { PreferencesProvider } from '../../providers/preferences/preferences';

/* Pipe imports */
import { UnitConversionPipe } from './unit-conversion';


describe('Pipe: UnitConversion', () => {
  let preferenceService: PreferencesProvider;
  let calculator: CalculationsProvider;
  let unitConversionPipe: UnitConversionPipe;
  const _mockEnglishUnits: SelectedUnits = mockEnglishUnits();
  const _mockMetricUnits: SelectedUnits = mockMetricUnits();

  beforeAll(() => {
    preferenceService = new PreferencesProvider();
    calculator = new CalculationsProvider(preferenceService);

    calculator.convertDensity = jest
      .fn()
      .mockReturnValue(10);

    calculator.convertTemperature = jest
      .fn()
      .mockReturnValue(10);

    calculator.convertVolume = jest
      .fn()
      .mockReturnValue(10);

    calculator.convertWeight = jest
      .fn()
      .mockReturnValue(10);
  });

  beforeEach(() => {
    unitConversionPipe = new UnitConversionPipe(calculator, preferenceService);

    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(_mockEnglishUnits);

    calculator.requiresConversion = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
  });

  test('should transform density', () => {
    const _mockUnits: SelectedUnits = mockEnglishUnits();
    _mockUnits.density = Units.BRIX;
    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(_mockUnits);

    expect(unitConversionPipe.transform(5, 'density', false))
      .toMatch('5.000');
    expect(unitConversionPipe.transform(5, 'density', true))
      .toMatch('10.0°Bx');
  }); // end 'should transform density' test

  test('should transform temperature', () => {
    expect(unitConversionPipe.transform(5, 'temperature', true))
      .toMatch('5.0°F');
    expect(unitConversionPipe.transform(5, 'temperature', false))
      .toMatch('10.0');
  }); // end 'should transform temperature' test

  test('should transform large volume', () => {
    expect(unitConversionPipe.transform(5, 'volumeLarge', true))
      .toMatch('5.00gal');
    expect(unitConversionPipe.transform(5, 'volumeLarge', false))
      .toMatch('10.00');
  }); // end 'should transform large volume' test

  test('should transform small volume', () => {
    expect(unitConversionPipe.transform(5, 'volumeSmall', true))
      .toMatch('5oz');
    expect(unitConversionPipe.transform(5, 'volumeSmall', false))
      .toMatch('10');
  });

  test('should transform large weight', () => {
    expect(unitConversionPipe.transform(5, 'weightLarge', true))
      .toMatch('5.00lb');
    expect(unitConversionPipe.transform(5, 'weightLarge', false))
      .toMatch('10.00');
  }); // end 'should transform large weight' test

  test('should transform small weight', () => {
    unitConversionPipe.reformatWeightSmallDescription = jest
      .fn()
      .mockImplementation((...args: any[]): string => {
        return args[0];
      });

    expect(unitConversionPipe.transform(5, 'weightSmall', true))
      .toMatch('5.00oz');
    expect(unitConversionPipe.transform(5, 'weightSmall', false))
      .toMatch('10.00');
    expect(unitConversionPipe.transform('5', 'weightSmall', false, false, true))
      .toMatch('5');
  }); // end 'should transform small weight' test

  test('should reformat hops description to convert its small weight value', () => {
    calculator.requiresConversion = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    calculator.convertWeight = jest
      .fn()
      .mockReturnValue(5);

    expect(
      unitConversionPipe
        .reformatWeightSmallDescription(
          'Hops addition: 1oz',
          _mockMetricUnits,
          true
        )
    ).toMatch('Hops addition: 5.00g');
    expect(
      unitConversionPipe
        .reformatWeightSmallDescription(
          'Hops addition: 1oz',
          _mockEnglishUnits,
          false
        )
    ).toMatch('Hops addition: 1oz');
  }); // end 'should reformat hops description to convert its small weight value' test

  test('should not transform an unknown unit type', () => {
    expect(unitConversionPipe.transform(5, 'unknown')).toMatch('--');
  }); // end 'should not transform an unknown unit type' test

  test('should transform a negative sentinel value to --', () => {
    expect(unitConversionPipe.transform(-1, 'any')).toMatch('--');
  }); // end 'should transform a negative sentinel value to --' test

});
