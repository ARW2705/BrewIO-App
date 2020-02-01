/* Function imports */
import * as utils from './utilities';

/* Mock imports */
import { mockNestedObject } from '../../../test-config/mockmodels/mockNestedObject';
import { mockObjectArray } from '../../../test-config/mockmodels/mockObjectArray';
import { mockObservablesArray } from '../../../test-config/mockmodels/mockObservablesArray';


describe('Shared: utility functions', () => {

  test('should deep copy an object', () => {
    const _mockNestedObject = mockNestedObject();
    const cloned = utils.clone(_mockNestedObject);
    expect(cloned).not.toBe(_mockNestedObject);
    expect(cloned.a).toBe(_mockNestedObject['a']);
    expect(cloned.b.e.f).toBe(_mockNestedObject['b']['e']['f']);
    expect(cloned.g[0].h).toBe(_mockNestedObject['g'][0]['h']);
  }); // end 'should deep copy an object' test

  test('should remove "shared properties"', () => {
    const _mockNestedObject = mockNestedObject();
    utils.stripSharedProperties(_mockNestedObject);
    expect(_mockNestedObject.hasOwnProperty('_id')).toBe(false);
  }); // end 'should remove "shared properties"' test

  test('should get index of object by id', () => {
    const _mockObjectArray = mockObjectArray();
    const foundIndex = utils.getIndexById('c', _mockObjectArray);
    expect(foundIndex).toBe(2);
    const notFound = utils.getIndexById('e', _mockObjectArray);
    expect(notFound).toBe(-1);
  }); // end 'should get index of object by id' test

  test('should convert array of Observables to array of values', () => {
    const valueArray = utils.getArrayFromObservables(mockObservablesArray());
    expect(valueArray[0].key).toBe('a');
    expect(valueArray[1].key).toBe('b');
    expect(valueArray[2].key).toBe('c');
  }); // end 'should convert array of Observables to array of values' test

  test('should round number to specified decimal places', () => {
    expect(utils.roundToDecimalPlace(Math.PI, 4)).toBe(3.1416);
    expect(utils.roundToDecimalPlace(Math.PI, 10)).toBe(3.1415926536);
    expect(utils.roundToDecimalPlace(Math.PI, 0)).toBe(3);
    expect(utils.roundToDecimalPlace(1.000, -2)).toBe(-1);
  }); // end 'should round number to specified decimal places' test

  test('should change string to title case', () => {
    expect(utils.toTitleCase('the quick brown fox jumps over the lazy dog')).toMatch('The Quick Brown Fox Jumps Over The Lazy Dog');
  }); // end 'should change string to title case' test

});
