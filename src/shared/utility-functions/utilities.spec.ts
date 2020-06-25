import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Function imports */
import * as utils from './utilities';

/* Mock imports */
import { mockNestedObject } from '../../../test-config/mockmodels/mockNestedObject';
import { mockObjectArray } from '../../../test-config/mockmodels/mockObjectArray';
import { mockObservablesArray } from '../../../test-config/mockmodels/mockObservablesArray';


describe('Shared: utility functions', () => {

  test('should convert an array of <T> into an array of BehaviorSubject<T>', () => {
    const bsa = utils.toSubjectArray(mockObjectArray());
    bsa.forEach(sub => {
      expect(sub instanceof BehaviorSubject).toBe(true);
    });
  }); // end 'should convert an array of <T> into an array of BehaviorSubject<T>' test

  test('should deep copy an object', () => {
    const _mockNestedObject = mockNestedObject();
    const cloned = utils.clone(_mockNestedObject);
    expect(cloned).not.toBe(_mockNestedObject);
    expect(cloned['a']).toBe(_mockNestedObject['a']);
    expect(cloned['b']['e']['f']).toBe(_mockNestedObject['b']['e']['f']);
    expect(cloned['g'][0]['h']).toBe(_mockNestedObject['g'][0]['h']);
    expect(cloned['j'].length).toBe(3);
  }); // end 'should deep copy an object' test

  test('should remove "shared properties"', () => {
    const _mockNestedObject = mockNestedObject();
    _mockNestedObject['grainType'] = {};
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

  test('should check if id is a client or server id', () => {
    expect(utils.hasDefaultIdType('0123456789012')).toBe(true);
    expect(utils.hasDefaultIdType('0a1b2c3d4e5f6g7h8i9j0kl1')).toBe(false);
  }); // end 'should check if id is a client or server id' test

  test('should convert array of Observables to array of values', () => {
    const valueArray = utils.getArrayFromObservables(mockObservablesArray());
    expect(valueArray[0].key).toBe('a');
    expect(valueArray[1].key).toBe('b');
    expect(valueArray[2].key).toBe('c');
  }); // end 'should convert array of Observables to array of values' test

  test('should get id', () => {
    const obj1 = { _id: 'id' };
    const obj2 = { cid: 'id' };
    const obj3 = {};

    expect(utils.getId(obj1)).toMatch('id');
    expect(utils.getId(obj2)).toMatch('id');
    expect(utils.getId(obj3)).toBeUndefined();
  }); // end 'should get id' test

  test('should round number to specified decimal places', () => {
    expect(utils.roundToDecimalPlace(Math.PI, 4)).toBe(3.1416);
    expect(utils.roundToDecimalPlace(Math.PI, 10)).toBe(3.1415926536);
    expect(utils.roundToDecimalPlace(Math.PI, 0)).toBe(3);
    expect(utils.roundToDecimalPlace(1.000, -2)).toBe(-1);
  }); // end 'should round number to specified decimal places' test

  test('should change string to title case', () => {
    expect(utils.toTitleCase('the quick brown fox jumps over the lazy dog')).toMatch('The Quick Brown Fox Jumps Over The Lazy Dog');
  }); // end 'should change string to title case' test

  test('should check if server id is missing', () => {
    expect(utils.missingServerId('0a1b2c3d4e5f6g7h8i9j0kl1')).toBe(false);
    expect(utils.missingServerId(undefined)).toBe(true);
  }); // end 'should check if server id is missing' test

  test('should check if object contains search id', () => {
    const obj1 = { _id: 'id' };
    const obj2 = { cid: 'id' };
    const obj3 = {};

    expect(utils.hasId(obj1, 'id')).toBe(true);
    expect(utils.hasId(obj2, 'id')).toBe(true);
    expect(utils.hasId(obj1, 'other')).toBe(false);
    expect(utils.hasId(obj3, 'id')).toBe(false);
    expect(utils.hasId(obj1, null)).toBe(false);
    expect(utils.hasId(obj1, undefined)).toBe(false);
  }); // end 'should check if object contains search id' test

});
