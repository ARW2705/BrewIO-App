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

    test('should default to english standard', () => {
      expect(preferenceService.preferredUnitSystem).toMatch('english standard');
      expect(preferenceService.units).toStrictEqual(mockEnglishUnits());
    });

    test('should check if a density unit is valid', () => {
      expect(preferenceService.isValidDensityUnit('specific gravity')).toBe(true);
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
      expect(preferenceService.isValidSystem('english standard')).toBe(true);
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

      const _mockEnglishUnits: SelectedUnits = mockEnglishUnits();

      expect(preferenceService.isValidUnits(_mockEnglishUnits)).toBe(true);
      expect(preferenceService.isValidUnits(_mockEnglishUnits)).toBe(false);
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

      const _mockMetricUnits: SelectedUnits = mockMetricUnits();

      preferenceService.setUnits('metric', _mockMetricUnits);

      expect(preferenceService.preferredUnitSystem).toMatch('metric');
      expect(preferenceService.units).toStrictEqual(_mockMetricUnits);
    });

    test('should fail to set preferred units', () => {
      preferenceService.isValidSystem = jest
        .fn()
        .mockReturnValue(false);

      const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

      const _mockEnglishUnits: SelectedUnits = mockEnglishUnits();

      preferenceService.setUnits('invalid', _mockEnglishUnits);

      const callCount = consoleSpy.mock.calls.length - 2; // second from last call
      expect(consoleSpy.mock.calls[callCount][0]).toMatch('unit set error');
      expect(consoleSpy.mock.calls[callCount][1]).toMatch('invalid');
      expect(consoleSpy.mock.calls[callCount][2]).toStrictEqual(_mockEnglishUnits);
    });

  });

});
