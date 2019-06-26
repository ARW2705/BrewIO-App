import * as utils from './utilities';

import { mockNestedObject } from '../../../test-config/mockmodels/mockNestedObject';
import { mockObjectArray } from '../../../test-config/mockmodels/mockObjectArray';

describe('Shared: utility functions', () => {

  test('should deep copy an object', () => {
    const deepCopy = utils.clone(mockNestedObject);
    expect(deepCopy._id).toBeUndefined();
  });

  test('should deep copy an object - keep "shared properties"', () => {
    const deepCopyKeep = utils.clone(mockNestedObject, true);
    expect(deepCopyKeep).toEqual(mockNestedObject);
  });

  test('should get index of object by id', () => {
    const foundIndex = utils.getIndexById('c', mockObjectArray);
    expect(foundIndex).toBe(2);
    const notFound = utils.getIndexById('e', mockObjectArray);
    expect(notFound).toBe(-1);
  });

  test('should round number to specified decimal places', () => {
    expect(utils.roundToDecimalPlace(Math.PI, 4)).toBe(3.1416);
    expect(utils.roundToDecimalPlace(Math.PI, 10)).toBe(3.1415926536);
    expect(utils.roundToDecimalPlace(Math.PI, 0)).toBe(3);
    expect(utils.roundToDecimalPlace(1.000, -2)).toBe(-1);
  });

  test('should change string to title case', () => {
    expect(utils.toTitleCase('the quick brown fox jumps over the lazy dog')).toMatch('The Quick Brown Fox Jumps Over The Lazy Dog');
  });

});
