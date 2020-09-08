/* Module imports */
import { TestBed, getTestBed, async } from '@angular/core/testing';

/* Test configuration imports */
import { configureTestBed } from '../../../test-config/configureTestBed';

/* Mock imports */
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';
import { mockHopsSchedule } from '../../../test-config/mockmodels/mockHopsSchedule';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';
import { mockYeastGroup } from '../../../test-config/mockmodels/mockYeastGroup';

/* Interace Imports */
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';

/* Provider imports */
import { CalculationsProvider } from './calculations';


describe('Calculations service', () => {
  let injector: TestBed;
  let calculationService: CalculationsProvider;
  configureTestBed();

  beforeAll(async(() => {
    TestBed.configureTestingModule({
      providers: [
        CalculationsProvider
      ]
    });
    injector = getTestBed();
    calculationService = injector.get(CalculationsProvider);
  }));

  describe('\nCalculates with provided values', () => {

    test('should calculate ABV from og: 1.050 and fg: 1.010', () => {
      expect(calculationService.getABV(1.050, 1.010)).toEqual(5.339);
    });

    test('should calculate SRM from MCU: 64.3', () => {
      expect(calculationService.getSRM(64.3)).toEqual(25.9);
    });

    test('should calculate Boil Time Factor from boil time: 60 minutes', () => {
      expect(calculationService.getBoilTimeFactor(60)).toEqual(0.219104108);
    });

    test('should calculate Boil Gravity from og: 1.050, batch volume: 5 gal, boil volue: 6 gal', () => {
      expect(calculationService.getBoilGravity(1.050, 5, 6))
        .toEqual(0.041666667);
    });

    test('should calculate Bigness Factor from boil gravity: 0.041666667', () => {
      expect(calculationService.getBignessFactor(0.041666667))
        .toEqual(1.134632433);
    });

    test('should calculate Utilization from bigness factor: 1.134632433 and boil time factor: 0.219104108', () => {
      expect(calculationService.getUtilization(1.134632433, 0.219104108))
        .toEqual(0.248602627);
    });

    test('should calculate Original Gravity from gravity: 37 pps, quantity: 10 lbs, volume: 5 gal, efficiency: 70%', () => {
      expect(calculationService.getOriginalGravity(1.037, 10, 5, 0.7))
        .toEqual(1.052);
    });

    test('should calculate Final Gravity from og: 1.050 and attenuation: 70%', () => {
      expect(calculationService.getFinalGravity(1.050, 70))
        .toEqual(1.015);
    });

  }); // end 'Calculates with provided values' section


  describe('\nCalculates with provided ingredients', () => {
    const _mockGrainBill: GrainBill[] = mockGrainBill();
    const _mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
    const _mockYeastGroup: YeastBatch[] = mockYeastGroup();

    test('should calculate mash efficiency: 10 gal and provided GrainBill and Measured Efficiency', () => {
      expect(
        calculationService.calculateMashEfficiency(
          _mockGrainBill,
          1.035,
          10
        )
      ).toEqual(74);
    });

    test('should calculate MCU from volume: 5 gal and provided GrainBill item', () => {
      expect(
        calculationService.getMCU(
          _mockGrainBill[0].grainType,
          _mockGrainBill[0],
          5
        )
      ).toEqual(3.6);
    });

    test('should calculate Original Gravity from batch volume: 5 gal, efficiency: 70, and provided Grain Bill', () => {
      expect(
        calculationService.calculateTotalOriginalGravity(
          5,
          0.7,
          _mockGrainBill
        )
      ).toEqual(1.065);
    });

    test('should calculate 0 gravity with empty grain bill', () => {
      expect(calculationService.calculateTotalOriginalGravity(5, 0.7, []))
        .toEqual(0);
    });

    test('should calculate Total SRM from volume: 5 gal and provided Grain Bill', () => {
      expect(calculationService.calculateTotalSRM(_mockGrainBill, 5))
        .toEqual(19.6);
    });

    test('should calculate 0 SRM with empty grain bill', () => {
      expect(calculationService.calculateTotalSRM([], 5)).toEqual(0);
    });

    test('should calculate IBU from provided Hops Type, provided Hops Schedule item, og: 1.050, batch volume: 5 gal, boil volume: 6 gal', () => {
      expect(
        calculationService.getIBU(
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
        calculationService.calculateTotalIBU(
          _mockHopsSchedule,
          1.050,
          5,
          6
        )
      ).toEqual(43.4);
    });

    test('should calculate 0 IBU with empty hops schedule', () => {
      expect(calculationService.calculateTotalIBU([], 1.040, 5, 5)).toEqual(0);
    })

    test('should calculate Avg Attenutation from provided yeast group', () => {
      expect(calculationService.getAverageAttenuation(_mockYeastGroup))
        .toEqual(74);
    });

  }); // end 'Calculates with provided ingredients' section


  describe('\nCalculates with complete recipe', () => {
    const _mockRecipeVariantComplete: RecipeVariant
      = mockRecipeVariantComplete();

    beforeAll(() => {
      calculationService.calculateRecipeValues(_mockRecipeVariantComplete);
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
      calculationService.calculateRecipeValues(_mockRecipeWithoutGrains);
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
      calculationService.calculateRecipeValues(_mockRecipeWithoutHops);
    });

    test('should calculate Total IBU from recipe without hops', () => {
      expect(_mockRecipeWithoutHops.IBU).toEqual(0);
    });

  }); // end 'Calculates with incomplete recipe: no hops' section

  describe('\nCalculates with incomplete recipe: no yeast', () => {
    const _mockRecipeWithoutYeast: RecipeVariant = mockRecipeVariantComplete();

    beforeAll(() => {
      _mockRecipeWithoutYeast.yeast = [];
      calculationService.calculateRecipeValues(_mockRecipeWithoutYeast);
    });

    test('should calculate ABV from recipe without yeast - default attenuation 75', () => {
      expect(_mockRecipeWithoutYeast.ABV).toEqual(6.719);
    });

  }); // end 'Calculates with incomplete recipe: no yeast' section

});
