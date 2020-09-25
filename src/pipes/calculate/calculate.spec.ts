/* Mock imports */
import { mockHopsSchedule } from '../../../test-config/mockmodels/mockHopsSchedule';
import { mockRecipeVariantComplete } from '../../../test-config/mockmodels/mockRecipeVariantComplete';

/* Interface imports */
import { HopsSchedule } from '../../shared/interfaces/hops-schedule';
import { RecipeVariant } from '../../shared/interfaces/recipe-variant';

/* Provider imports */
import { CalculationsProvider } from '../../providers/calculations/calculations';
import { PreferencesProvider } from '../../providers/preferences/preferences';

/* Pipe imports */
import { CalculatePipe } from './calculate';


describe('Pipe: Calculate', () => {
  let preferenceService: PreferencesProvider;
  let calculator: CalculationsProvider;
  let calculatePipe: CalculatePipe;

  beforeAll(() => {
    preferenceService = new PreferencesProvider();
    calculator = new CalculationsProvider(preferenceService);
  });

  beforeEach(() => {
    calculatePipe = new CalculatePipe(calculator);
  });

  test('should transform calculated value', () => {
    const _mockHopsSchedule: HopsSchedule[] = mockHopsSchedule();
    const _mockRecipeVariant: RecipeVariant = mockRecipeVariantComplete();

    calculatePipe.getIBU = jest
      .fn()
      .mockReturnValue(30);

    let pipeOutput: string;

    pipeOutput = calculatePipe
      .transform(
        _mockHopsSchedule[0],
        'ibu',
        _mockRecipeVariant
      );

    expect(pipeOutput).toMatch('30.0 IBU');

    pipeOutput = calculatePipe
      .transform(
        _mockHopsSchedule[0],
        'something-else',
        _mockRecipeVariant
      );

    expect(pipeOutput).toMatch('');
  }); // end 'should transform calculated value' test

  test('should get IBU calculation', () => {
    const _mockHopsSchedule: HopsSchedule = mockHopsSchedule()[0];
    const _mockRecipeVariant: RecipeVariant = mockRecipeVariantComplete();

    calculator.getIBU = jest
      .fn()
      .mockReturnValue(40);

    expect(calculatePipe.getIBU(_mockHopsSchedule, _mockRecipeVariant))
      .toEqual(40);
  }); // end 'should get IBU calculation' test

  test('should get an error when calculating IBU', () => {
    const _mockHopsSchedule: HopsSchedule = mockHopsSchedule()[0];
    const _mockRecipeVariant: RecipeVariant = mockRecipeVariantComplete();
    const error: Error = new Error('Calculation Error');

    calculator.getIBU = jest
      .fn()
      .mockImplementation(() => {
        throw error;
      });

    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    expect(calculatePipe.getIBU(_mockHopsSchedule, _mockRecipeVariant))
      .toEqual(0);
    expect(consoleSpy).toHaveBeenCalledWith('Calculate pipe error', error);
  }); // end 'should get an error when calculating IBU' test

});
