import { CalculationsProvider } from './calculations';
import { Recipe } from '../../shared/interfaces/recipe';
import { GrainBill } from '../../shared/interfaces/grain-bill';
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { YeastBatch } from '../../shared/interfaces/yeast-batch';
import { clone } from '../../shared/utility-functions/utilities';
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';
import { mockHopsSchedule } from '../../../test-config/mockmodels/mockHopsSchedule';
import { mockYeastGroup } from '../../../test-config/mockmodels/mockYeastGroup';
import { mockRecipeComplete } from '../../../test-config/mockmodels/mockRecipeComplete';

let calcService = null;
let grainBill: Array<GrainBill> = mockGrainBill;
let hopsSchedule: Array<HopsSchedule> = mockHopsSchedule;
let yeastBatch: Array<YeastBatch> = mockYeastGroup;
let completeRecipe: Recipe = clone(mockRecipeComplete);
let incompleteRecipe: Recipe = clone(mockRecipeComplete);

beforeEach(() => {
    calcService = new CalculationsProvider();
});

describe('Calculations service', () => {

  describe('\nCalculates with provided values...', () => {

    test('calcs ABV from og: 1.050 and fg: 1.010', () => {
      expect(calcService.getABV(1.050, 1.010)).toEqual(5.339);
    });

    test('calcs SRM from MCU: 64.3', () => {
      expect(calcService.getSRM(64.3)).toEqual(25.9);
    });

    test('calcs Boil Time Factor from boil time: 60 minutes', () => {
      expect(calcService.getBoilTimeFactor(60)).toEqual(0.219104108);
    });

    test('calcs Boil Gravity from og: 1.050, batch volume: 5 gal, boil volue: 6 gal', () => {
      expect(calcService.getBoilGravity(1.050, 5, 6)).toEqual(0.041666667);
    });

    test('calcs Bigness Factor from boil gravity: 0.041666667', () => {
      expect(calcService.getBignessFactor(0.041666667)).toEqual(1.134632433);
    });

    test('calcs Utilization from bigness factor: 1.134632433 and boil time factor: 0.219104108', () => {
      expect(calcService.getUtilization(1.134632433, 0.219104108)).toEqual(0.248602627);
    });

    test('calcs Original Gravity from gravity: 37 pps, quantity: 10 lbs, volume: 5 gal, efficiency: 70%', () => {
      expect(calcService.getOriginalGravity(1.037, 10, 5, 0.7)).toEqual(1.052);
    });

    test('calcs Final Gravity from og: 1.050 and attenuation: 70%', () => {
      expect(calcService.getFinalGravity(1.050, 70)).toEqual(1.015);
    });

  });


  describe('\nCalculates with provided ingredients', () => {

    test('calcs MCU from volume: 5 gal and provided GrainBill item', () => {
      expect(calcService.getMCU(grainBill[0].grainType, grainBill[0], 5)).toEqual(3.6);
    });

    test('calcs Original Gravity from batch volume: 5 gal, efficiency: 70, and provided Grain Bill', () => {
      expect(calcService.calculateTotalOriginalGravity(5, 0.7, grainBill)).toEqual(1.065);
    })

    test('calcs Total SRM from volume: 5 gal and provided Grain Bill', () => {
      expect(calcService.calculateTotalSRM(grainBill, 5)).toEqual(19.6);
    });

    test('calcs IBU from provided Hops Type, provided Hops Schedule item, og: 1.050, batch volume: 5 gal, boil volume: 6 gal', () => {
      expect(calcService.getIBU(hopsSchedule[0].hopsType, hopsSchedule[0], 1.050, 5, 6)).toEqual(35.4);
    });

    test('calcs Total IBU from provided Hops Schedule, og: 1.050, batch volume: 5 gal, boil volume: 6 gal', () => {
      expect(calcService.calculateTotalIBU(hopsSchedule, 1.050, 5, 6)).toEqual(43.4);
    });

    test('calcs Avg Attenutation from provided yeast group', () => {
      expect(calcService.getAverageAttenuation(yeastBatch)).toEqual(74);
    });

  });


  describe('\nCalculates with complete recipe', () => {

    beforeAll(() => {
      calcService.calculateRecipeValues(completeRecipe);
    });

    test('calcs Original Gravity from complete recipe', () => {
      expect(completeRecipe.originalGravity).toEqual(1.065);
    });

    test('calcs Final Gravity from complete recipe', () => {
      expect(completeRecipe.finalGravity).toEqual(1.017);
    });

    test('calcs Total IBU from complete recipe', () => {
      expect(completeRecipe.IBU).toEqual(38.8);
    });

    test('calcs Total SRM from complete recipe', () => {
      expect(completeRecipe.SRM).toEqual(19.6);
    });

    test('calcs ABV from complete recipe', () => {
      expect(completeRecipe.ABV).toEqual(6.588);
    });

  });

  describe('\nCalculates with incomplete recipe: no grains', () => {

    const recipeWithoutGrains = clone(incompleteRecipe);

    beforeAll(() => {
      recipeWithoutGrains.grains = [];
      calcService.calculateRecipeValues(recipeWithoutGrains);
    });

    test('calcs ABV from recipe without grains', () => {
      expect(recipeWithoutGrains.ABV).toEqual(0);
    });

    test('calcs Original Gravity from recipe without grains', () => {
      expect(recipeWithoutGrains.originalGravity).toEqual(1.000);
    });

    test('calcs Final Gravity from recipe without grains', () => {
      expect(recipeWithoutGrains.originalGravity).toEqual(1.000);
    });

    test('calcs Total IBU from recipe without grains', () => {
      expect(recipeWithoutGrains.IBU).toEqual(63.1);
    });

    test('calcs Total SRM from recipe without grains', () => {
      expect(recipeWithoutGrains.SRM).toEqual(0);
    });

  });

  describe('\nCalculates with incomplete recipe: no hops', () => {

    const recipeWithoutHops = clone(incompleteRecipe);

    beforeAll(() => {
      recipeWithoutHops.hops = [];
      calcService.calculateRecipeValues(recipeWithoutHops);
    });

    test('calcs Total IBU from recipe without hops', () => {
      expect(recipeWithoutHops.IBU).toEqual(0);
    });

  });

  describe('\nCalculates with incomplete recipe: no yeast', () => {

    const recipeWithoutYeast = clone(incompleteRecipe);

    beforeAll(() => {
      recipeWithoutYeast.yeast = [];
      calcService.calculateRecipeValues(recipeWithoutYeast);
    });

    test('calcs ABV from recipe without yeast - default attenuation 75', () => {
      expect(recipeWithoutYeast.ABV).toEqual(6.719);
    });

  });

});
