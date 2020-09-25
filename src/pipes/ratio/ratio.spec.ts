/* Mock imports */
import { mockGrainBill } from '../../../test-config/mockmodels/mockGrainBill';

/* Interface imports */
import { GrainBill } from '../../shared/interfaces/grain-bill';

/* Pipe imports */
import { RatioPipe } from './ratio';


describe('Pipe: Ratio', () => {
  let ratioPipe: RatioPipe;
  let _mockGrainBill: GrainBill[];

  beforeEach(() => {
    ratioPipe = new RatioPipe();
    _mockGrainBill = mockGrainBill();
  });

  test('should transform item quantity as a percentage of a group total', () => {
    ratioPipe.contributesFermentable = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    ratioPipe.getTotal = jest
      .fn()
      .mockReturnValue(12.5);

    expect(
      ratioPipe.transform(_mockGrainBill[1], 'quantity', _mockGrainBill, true)
    )
    .toMatch('16.0%');

    expect(ratioPipe.transform(_mockGrainBill[1], 'quantity', _mockGrainBill))
      .toMatch('0%');

    expect(ratioPipe.transform({}, 'quantity', _mockGrainBill).length)
      .toEqual(0);
  }); // end 'should transform item quantity as a percentage of a group total' test

  test('should check if given object contributes a fermentable', () => {
    expect(ratioPipe.contributesFermentable(_mockGrainBill[0])).toBe(true);
    _mockGrainBill[0].grainType.gravity = 0;
    expect(ratioPipe.contributesFermentable(_mockGrainBill[0])).toBe(false);
  }); // end 'should check if given object contributes a fermentable' test

  test('should get total of given property from group of objects', () => {
    ratioPipe.contributesFermentable = jest
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    expect(ratioPipe.getTotal('quantity', _mockGrainBill)).toEqual(12.5);
    expect(ratioPipe.getTotal('quantity', _mockGrainBill)).toEqual(10.5);
  }); // end 'should get total of given property from group of objects' test

  test('should handle an error getting total', () => {
    const error: Error = new Error('Internal Error');

    const consoleSpy: jest.SpyInstance = jest.spyOn(console, 'log');

    ratioPipe.contributesFermentable = jest
      .fn()
      .mockImplementation(() => {
        throw error;
      });

    expect(ratioPipe.getTotal('quantity', _mockGrainBill)).toEqual(0);
    expect(consoleSpy).toHaveBeenCalledWith('Ratio pipe error', error);
  }); // end 'should handle an error getting total' test

});
