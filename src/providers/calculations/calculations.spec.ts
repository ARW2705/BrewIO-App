/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockEnglishUnits, mockMetricUnits } from '../../../test-config/mockmodels/mockUnits';
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';
import { mockHopsSchedule } from '../../../test-config/mockmodels/mockHopsSchedule';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockYeastGroup } from '../../../test-config/mockmodels/mockYeastGroup';

/* Constan imports */
import * as Units from '../../shared/constants/units';

/* Utility imports */
import { roundToDecimalPlace } from '../../shared/utility-functions/utilities';

/* Interace Imports */
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { SelectedUnits } from '../../shared/interfaces/units';

/* Provider imports */
import { CalculationsProvider } from './calculations';
import { PreferencesProvider } from '../../providers/preferences/preferences';


describe('Calculations service', () => {
  let injector: TestBed;
  let calculator: CalculationsProvider;
  let preferenceService: PreferencesProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      providers: [
        CalculationsProvider,
        { provide: PreferencesProvider, useValue: {} }
      ]
    });
    injector = getTestBed();
    calculator = injector.get(CalculationsProvider);
    preferenceService = injector.get(PreferencesProvider);
    preferenceService.getSelectedUnits = jest
      .fn()
      .mockReturnValue(mockEnglishUnits());
  }));

  describe('Handle unit conversions', () => {

    test('should convert density: Brix -> SG', () => {
      expect(
        roundToDecimalPlace(
          calculator
            .convertDensity(
              12,
              Units.BRIX.longName,
              Units.SPECIFIC_GRAVITY.longName
            ),
          3
        )
      ).toEqual(1.048);
    }); // end 'should convert density: Brix -> SG' test

    test('should convert density: SG -> Plato', () => {
      expect(
        roundToDecimalPlace(
          calculator
            .convertDensity(
              1.06,
              Units.SPECIFIC_GRAVITY.longName,
              Units.PLATO.longName
            ),
          1
        )
      ).toEqual(14.7);
    }); // end 'should convert density: Brix -> SG' test

    test('should convert density: Plato -> Brix', () => {
      expect(
        roundToDecimalPlace(
          calculator
            .convertDensity(
              13.5,
              Units.PLATO.longName,
              Units.BRIX.longName
            ),
          1
        )
      ).toEqual(13.5);
    }); // end 'should convert density: Plato -> Brix' test

    test('should return -1 if unknown source or target unit', () => {
      expect(calculator.convertDensity(10, 'unknown', 'unknown'))
        .toEqual(-1);
    }); // end 'should not convert if unknown source or target unit' test

    test('should convert temperature', () => {
      expect(calculator.convertTemperature(20, true)).toEqual(68);
      expect(calculator.convertTemperature(68, false)).toEqual(20);
      expect(calculator.convertTemperature(-40, true)).toEqual(-40);
    }); // end 'should convert temperature' test

    test('should convert volume to metric', () => {
      // Gallon -> Liter
      expect(
        roundToDecimalPlace(
          calculator.convertVolume(3, true, false),
          2
        )
      ).toEqual(11.36)

      // Fluid ounce -> Milliliter
      expect(
        roundToDecimalPlace(
          calculator.convertVolume(24, false, false),
          0
        )
      ).toEqual(710);
    }); // end 'should convert volume to metric' test

    test('should convert volume to english standard', () => {
      // Liter -> Gallon
      expect(
        roundToDecimalPlace(
          calculator.convertVolume(12, true, true),
          2
        )
      ).toEqual(3.17)

      // Milliliter -> Fluid ounce
      expect(
        roundToDecimalPlace(
          calculator.convertVolume(500, false, true),
          2
        )
      ).toEqual(16.91)
    }); // end 'should convert volume to english standard' test

    test('should convert weight to metric', () => {
      // Pound -> Kilogram
      expect(
        roundToDecimalPlace(
          calculator.convertWeight(3, true, false),
          2
        )
      ).toEqual(1.36)

      // Ounce -> Gram
      expect(
        roundToDecimalPlace(
          calculator.convertWeight(8, false, false),
          0
        )
      ).toEqual(227);
    }); // end 'should convert weight to metric' test

    test('should convert weight to english standard', () => {
      // Kilogram -> Pound
      expect(
        roundToDecimalPlace(
          calculator.convertWeight(3, true, true),
          1
        )
      ).toEqual(6.6)

      // Gram -> Ounce
      expect(
        roundToDecimalPlace(
          calculator.convertWeight(100, false, true),
          1
        )
      ).toEqual(3.5)
    }); // end 'should convert weight to english standard' test

    test('should check if a unit requires conversion', () => {
      const _mockEnglishUnits: SelectedUnits = mockEnglishUnits();
      _mockEnglishUnits.density = Units.BRIX;
      const _mockMetricUnits: SelectedUnits = mockMetricUnits();

      expect(calculator.requiresConversion('density', _mockEnglishUnits))
        .toBe(true);
      expect(calculator.requiresConversion('density', _mockMetricUnits))
        .toBe(false);

      expect(calculator.requiresConversion('temperature', _mockEnglishUnits))
        .toBe(false);
      expect(calculator.requiresConversion('temperature', _mockMetricUnits))
        .toBe(true);

      expect(calculator.requiresConversion('volumeLarge', _mockEnglishUnits))
        .toBe(false);
      expect(calculator.requiresConversion('volumeLarge', _mockMetricUnits))
        .toBe(true);

      expect(calculator.requiresConversion('volumeSmall', _mockEnglishUnits))
        .toBe(false);
      expect(calculator.requiresConversion('volumeSmall', _mockMetricUnits))
        .toBe(true);

      expect(calculator.requiresConversion('weightLarge', _mockEnglishUnits))
        .toBe(false);
      expect(calculator.requiresConversion('weightLarge', _mockMetricUnits))
        .toBe(true);

      expect(calculator.requiresConversion('weightSmall', _mockEnglishUnits))
        .toBe(false);
      expect(calculator.requiresConversion('weightSmall', _mockMetricUnits))
        .toBe(true);

      expect(calculator.requiresConversion('unknown', _mockMetricUnits))
        .toBe(false);
    });

  }); // end 'Handle unit conversions' section

  describe('Calculates with provided values', () => {

    test('should calculate ABV from og: 1.050 and fg: 1.010', () => {
      expect(calculator.getABV(1.050, 1.010)).toEqual(5.339);
    });

    test('should calculate SRM from MCU: 64.3', () => {
      expect(calculator.getSRM(64.3)).toEqual(25.9);
    });

    test('should calculate Boil Time Factor from boil time: 60 minutes', () => {
      expect(calculator.getBoilTimeFactor(60)).toEqual(0.219104108);
    });

    test('should calculate Boil Gravity from og: 1.050, batch volume: 5 gal, boil volue: 6 gal', () => {
      expect(calculator.getBoilGravity(1.050, 5, 6))
        .toEqual(0.041666667);
    });

    test('should calculate Bigness Factor from boil gravity: 0.041666667', () => {
      expect(calculator.getBignessFactor(0.041666667))
        .toEqual(1.134632433);
    });

    test('should calculate Utilization from bigness factor: 1.134632433 and boil time factor: 0.219104108', () => {
      expect(calculator.getUtilization(1.134632433, 0.219104108))
        .toEqual(0.248602627);
    });

    test('should calculate Original Gravity from gravity: 37 pps, quantity: 10 lbs, volume: 5 gal, efficiency: 70%', () => {
      expect(calculator.getOriginalGravity(1.037, 10, 5, 0.7))
        .toEqual(1.052);
    });

    test('should calculate Original Gravity to 1 if a pps of 0 is given', () => {
      expect(calculator.getOriginalGravity(0, 10, 5, 0.7))
        .toEqual(1.000);
    });

    test('should calculate Final Gravity from og: 1.050 and attenuation: 70%', () => {
      expect(calculator.getFinalGravity(1.050, 70))
        .toEqual(1.015);
    });

  }); // end 'Calculates with provided values' section


  describe('\nCalculates with provided ingredients', () => {
    const _mockGrainBill: GrainBill[] = mockGrainBill();
    const _mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
    const _mockYeastGroup: YeastBatch[] = mockYeastGroup();

    test('should calculate mash efficiency: 10 gal and provided GrainBill and Measured Efficiency', () => {
      expect(
        calculator.calculateMashEfficiency(
          _mockGrainBill,
          1.035,
          10
        )
      ).toEqual(74);
    });

    test('should calculate MCU from volume: 5 gal and provided GrainBill item', () => {
      expect(
        calculator.getMCU(
          _mockGrainBill[0].grainType,
          _mockGrainBill[0],
          5
        )
      ).toEqual(3.6);
    });

    test('should calculate Original Gravity from batch volume: 5 gal, efficiency: 70, and provided Grain Bill', () => {
      expect(
        calculator.calculateTotalOriginalGravity(
          5,
          0.7,
          _mockGrainBill
        )
      ).toEqual(1.065);
    });

    test('should calculate 0 gravity with empty grain bill', () => {
      expect(calculator.calculateTotalOriginalGravity(5, 0.7, []))
        .toEqual(0);
    });

    test('should calculate Total SRM from volume: 5 gal and provided Grain Bill', () => {
      expect(calculator.calculateTotalSRM(_mockGrainBill, 5))
        .toEqual(19.6);
    });

    test('should calculate 0 SRM with empty grain bill', () => {
      expect(calculator.calculateTotalSRM([], 5)).toEqual(0);
    });

    test('should calculate IBU from provided Hops Type, provided Hops Schedule item, og: 1.050, batch volume: 5 gal, boil volume: 6 gal', () => {
      expect(
        calculator.getIBU(
          _mockHopsSchedule[0].hopsType,
          _mockHopsSchedule[0],
          1.050,
          5,
          6
        )
      ).toEqual(35.4);
    });

    test('should calculate Total IBU from provided Hops Schedule, og: 1.050, batch volume: 5 gal, boil volume: 6 gal', () => {
      expect(
        calculator.calculateTotalIBU(
          _mockHopsSchedule,
          1.050,
          5,
          6
        )
      ).toEqual(43.4);
    });

    test('should calculate 0 IBU with empty hops schedule', () => {
      expect(calculator.calculateTotalIBU([], 1.040, 5, 5)).toEqual(0);
    })

    test('should calculate Avg Attenutation from provided yeast group', () => {
      expect(calculator.getAverageAttenuation(_mockYeastGroup))
        .toEqual(74);
    });

  }); // end 'Calculates with provided ingredients' section


  describe('\nCalculates with complete recipe', () => {
    const _mockRecipeVariantComplete: RecipeVariant
      = mockRecipeVariantComplete();

    beforeAll(() => {
      calculator.calculateRecipeValues(_mockRecipeVariantComplete);
    });

    test('should calculate Original Gravity from complete recipe', () => {
      expect(_mockRecipeVariantComplete.originalGravity).toEqual(1.065);
    });

    test('should calculate Final Gravity from complete recipe', () => {
      expect(_mockRecipeVariantComplete.finalGravity).toEqual(1.017);
    });

    test('should calculate Total IBU from complete recipe', () => {
      expect(_mockRecipeVariantComplete.IBU).toEqual(38.8);
    });

    test('should calculate Total SRM from complete recipe', () => {
      expect(_mockRecipeVariantComplete.SRM).toEqual(19.6);
    });

    test('should calculate ABV from complete recipe', () => {
      expect(_mockRecipeVariantComplete.ABV).toEqual(6.588);
    });

  }); // end 'Calculates with complete recipe' section

  describe('\nCalculates with incomplete recipe: no grains', () => {
    const _mockRecipeWithoutGrains: RecipeVariant = mockRecipeVariantComplete();

    beforeAll(() => {
      _mockRecipeWithoutGrains.grains = [];
      calculator.calculateRecipeValues(_mockRecipeWithoutGrains);
    });

    test('should calculate ABV from recipe without grains', () => {
      expect(_mockRecipeWithoutGrains.ABV).toEqual(0);
    });

    test('should calculate Original Gravity from recipe without grains', () => {
      expect(_mockRecipeWithoutGrains.originalGravity).toEqual(1.000);
    });

    test('should calculate Final Gravity from recipe without grains', () => {
      expect(_mockRecipeWithoutGrains.originalGravity).toEqual(1.000);
    });

    test('should calculate Total IBU from recipe without grains', () => {
      expect(_mockRecipeWithoutGrains.IBU).toEqual(63.1);
    });

    test('should calculate Total SRM from recipe without grains', () => {
      expect(_mockRecipeWithoutGrains.SRM).toEqual(0);
    });

  }); // end 'Calculates with incomplete recipe: no grains' section

  describe('\nCalculates with incomplete recipe: no hops', () => {
    const _mockRecipeWithoutHops: RecipeVariant = mockRecipeVariantComplete();

    beforeAll(() => {
      _mockRecipeWithoutHops.hops = [];
      calculator.calculateRecipeValues(_mockRecipeWithoutHops);
    });

    test('should calculate Total IBU from recipe without hops', () => {
      expect(_mockRecipeWithoutHops.IBU).toEqual(0);
    });

  }); // end 'Calculates with incomplete recipe: no hops' section

  describe('\nCalculates with incomplete recipe: no yeast', () => {
    const _mockRecipeWithoutYeast: RecipeVariant = mockRecipeVariantComplete();

    beforeAll(() => {
      _mockRecipeWithoutYeast.yeast = [];
      calculator.calculateRecipeValues(_mockRecipeWithoutYeast);
    });

    test('should calculate ABV from recipe without yeast - default attenuation 75', () => {
      expect(_mockRecipeWithoutYeast.ABV).toEqual(6.719);
    });

  }); // end 'Calculates with incomplete recipe: no yeast' section

});
