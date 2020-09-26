/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockEnglishUnits, mockMetricUnits } from '../../../test-config/mockmodels/mockUnits';

/* Interface imports */
import { SelectedUnits } from '../../../src/shared/interfaces/units';

/* Provider imports */
import { PreferencesProvider } from './preferences';


describe('Preferences Provider', () => {
  let injector: TestBed;
  let preferenceService: PreferencesProvider;
  const staticMockEnglish: SelectedUnits = mockEnglishUnits();
  const staticMockMetric: SelectedUnits = mockMetricUnits();
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [],
      providers: [
        PreferencesProvider
      ]
    });

    injector = getTestBed();
    preferenceService = injector.get(PreferencesProvider);
  }));

  describe('Unit Checks', () => {

    test('should default to englishStandard', () => {
      expect(preferenceService.preferredUnitSystem).toMatch('englishStandard');
      expect(preferenceService.units).toStrictEqual(staticMockEnglish);
    });

    test('should check if a density unit is valid', () => {
      expect(preferenceService.isValidDensityUnit('specificgravity')).toBe(true);
      expect(preferenceService.isValidDensityUnit('brix')).toBe(true);
      expect(preferenceService.isValidDensityUnit('plato')).toBe(true);
      expect(preferenceService.isValidDensityUnit('error')).toBe(false);
    });

    test('should check if a temperature unit is valid', () => {
      expect(preferenceService.isValidTemperatureUnit('celsius')).toBe(true);
      expect(preferenceService.isValidTemperatureUnit('fahrenheit')).toBe(true);
      expect(preferenceService.isValidTemperatureUnit('error')).toBe(false);
    });

    test('should check if a volume unit is valid', () => {
      expect(preferenceService.isValidVolumeUnit('milliliter')).toBe(true);
      expect(preferenceService.isValidVolumeUnit('liter')).toBe(true);
      expect(preferenceService.isValidVolumeUnit('fluid ounce')).toBe(true);
      expect(preferenceService.isValidVolumeUnit('gallon')).toBe(true);
      expect(preferenceService.isValidVolumeUnit('error')).toBe(false);
    });

    test('should check if a weight unit is valid', () => {
      expect(preferenceService.isValidWeightUnit('gram')).toBe(true);
      expect(preferenceService.isValidWeightUnit('kilogram')).toBe(true);
      expect(preferenceService.isValidWeightUnit('pound')).toBe(true);
      expect(preferenceService.isValidWeightUnit('ounce')).toBe(true);
      expect(preferenceService.isValidWeightUnit('error')).toBe(false);
    });

    test('should check if a unit system is valid', () => {
      expect(preferenceService.isValidSystem('metric')).toBe(true);
      expect(preferenceService.isValidSystem('englishStandard')).toBe(true);
      expect(preferenceService.isValidSystem('other')).toBe(true);
      expect(preferenceService.isValidSystem('error')).toBe(false);
    });

  });


  describe('Unit Overall Check', () => {

    test('should check if all units are valid', () => {
      preferenceService.isValidSystem = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);
      preferenceService.isValidWeightUnit = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      preferenceService.isValidVolumeUnit = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      preferenceService.isValidTemperatureUnit = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);
      preferenceService.isValidDensityUnit = jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      expect(preferenceService.isValidUnits(staticMockEnglish)).toBe(true);
      expect(preferenceService.isValidUnits(staticMockEnglish)).toBe(false);
    });

  });


  describe('Unit Set', () => {

    test('should set preferred units', () => {
      preferenceService.isValidSystem = jest
        .fn()
        .mockReturnValue(true);
      preferenceService.isValidUnits = jest
        .fn()
        .mockReturnValue(true);

      preferenceService.setUnits('metric', staticMockMetric);

      expect(preferenceService.preferredUnitSystem).toMatch('metric');
      expect(preferenceService.units).toStrictEqual(staticMockMetric);
    }); // end 'should set preferred units' test

    test('should fail to set preferred units', () => {
      preferenceService.isValidSystem = jest
        .fn()
        .mockReturnValue(false);

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      preferenceService.setUnits('invalid', staticMockEnglish);

      expect(consoleSpy).toHaveBeenCalledWith(
        'unit set error',
        'invalid',
        staticMockEnglish
      );
    }); // end 'should fail to set preferred units' test

  }); // end 'Unit Set' section


  describe('Other operations', () => {

    test('should get preferred unit system', () => {
      preferenceService.preferredUnitSystem = 'englishStandard';
      expect(preferenceService.getPreferredUnitSystem())
        .toMatch('englishStandard');
    });

    test('should get selected units', () => {
      preferenceService.units = staticMockEnglish;
      expect(preferenceService.getSelectedUnits())
        .toStrictEqual(staticMockEnglish);
    });

  });

});
