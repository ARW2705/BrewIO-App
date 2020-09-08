import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

/* Function imports */
import { clone } from './clone';
import { getId, getIndexById, hasDefaultIdType, hasId, isMissingServerId } from './id-helpers';
import { getArrayFromObservables, normalizeErrorObservableMessage, toSubjectArray } from './observable-helpers';
import { stripSharedProperties } from './strip-shared-properties';
import { roundToDecimalPlace, toTitleCase } from './utilities';

/* Mock imports */
import { mockNestedObject } from '../../../test-config/mockmodels/mockNestedObject';
import { mockObjectArray } from '../../../test-config/mockmodels/mockObjectArray';
import { mockObservablesArray } from '../../../test-config/mockmodels/mockObservablesArray';


describe('Shared: utility functions', () => {

  describe('Clone', () => {

    test('should deep copy an object', () => {
      const _mockNestedObject: object = mockNestedObject();
      const cloned: object = clone(_mockNestedObject);
      expect(cloned).not.toBe(_mockNestedObject);
      expect(cloned['a']).toBe(_mockNestedObject['a']);
      expect(cloned['b']['e']['f']).toBe(_mockNestedObject['b']['e']['f']);
      expect(cloned['g'][0]['h']).toBe(_mockNestedObject['g'][0]['h']);
      expect(cloned['j'].length).toBe(3);
    }); // end 'should deep copy an object' test

  }); // end 'Clone' section


  describe('Id Helpers', () => {

    test('should get id', () => {
      const obj1: object = { _id: 'id' };
      const obj2: object = { cid: 'id' };
      const obj3: object = {};

      expect(getId(obj1)).toMatch('id');
      expect(getId(obj2)).toMatch('id');
      expect(getId(obj3)).toBeUndefined();
    }); // end 'should get id' test

    test('should get index of object by id', () => {
      const _mockObjectArray: object[] = mockObjectArray();
      const foundIndex: number = getIndexById('c', _mockObjectArray);
      expect(foundIndex).toBe(2);
      const notFound: number = getIndexById('e', _mockObjectArray);
      expect(notFound).toBe(-1);
    }); // end 'should get index of object by id' test

    test('should check if id is a client or server id', () => {
      expect(hasDefaultIdType('0123456789012')).toBe(true);
      expect(hasDefaultIdType('0a1b2c3d4e5f6g7h8i9j0kl1')).toBe(false);
      expect(hasDefaultIdType(undefined)).toBe(true);
    }); // end 'should check if id is a client or server id' test

    test('should check if server id is missing', () => {
      expect(isMissingServerId('0a1b2c3d4e5f6g7h8i9j0kl1')).toBe(false);
      expect(isMissingServerId(undefined)).toBe(true);
    }); // end 'should check if server id is missing' test

    test('should check if object contains search id', () => {
      const obj1: object = { _id: 'id' };
      const obj2: object = { cid: 'id' };
      const obj3: object = {};

      expect(hasId(obj1, 'id')).toBe(true);
      expect(hasId(obj2, 'id')).toBe(true);
      expect(hasId(obj1, 'other')).toBe(false);
      expect(hasId(obj3, 'id')).toBe(false);
      expect(hasId(obj1, null)).toBe(false);
      expect(hasId(obj1, undefined)).toBe(false);
    }); // end 'should check if object contains search id' test

  }); // end 'Id Helpers' section


  describe('Observable Helpers', () => {

    test('should convert array of Observables to array of values', () => {
      const valueArray: object[] = getArrayFromObservables(mockObservablesArray());
      expect(valueArray[0]['key']).toBe('a');
      expect(valueArray[1]['key']).toBe('b');
      expect(valueArray[2]['key']).toBe('c');
    }); // end 'should convert array of Observables to array of values' test

    test('should normalize an error message into a string', () => {
      expect(normalizeErrorObservableMessage('error message'))
        .toMatch('error message');
      expect(
        normalizeErrorObservableMessage(
          new ErrorObservable('observable error message')
        )
      )
      .toMatch('observable error message');
    }); // end 'should normalize an error message into a string' test

    test('should convert an array of <T> into an array of BehaviorSubject<T>', () => {
      const bsa: BehaviorSubject<object>[] = toSubjectArray(mockObjectArray());
      bsa.forEach((sub: BehaviorSubject<object>) => {
        expect(sub instanceof BehaviorSubject).toBe(true);
      });
    }); // end 'should convert an array of <T> into an array of BehaviorSubject<T>' test

  }); // end 'Observable Helpers' section


  describe('Shared Properties', () => {

    test('should remove "shared properties"', () => {
      const _mockNestedObject: object = mockNestedObject();
      _mockNestedObject['grainType'] = {};
      stripSharedProperties(_mockNestedObject);
      expect(_mockNestedObject.hasOwnProperty('_id')).toBe(false);
    }); // end 'should remove "shared properties"' test

  }); // end 'Shared Properties' section


  describe('Utilities', () => {

    test('should round number to specified decimal places', () => {
      expect(roundToDecimalPlace(Math.PI, 4)).toBe(3.1416);
      expect(roundToDecimalPlace(Math.PI, 10)).toBe(3.1415926536);
      expect(roundToDecimalPlace(Math.PI, 0)).toBe(3);
      expect(roundToDecimalPlace(1.000, -2)).toBe(-1);
    }); // end 'should round number to specified decimal places' test

    test('should change string to title case', () => {
      expect(toTitleCase('the quick brown fox jumps over the lazy dog'))
        .toMatch('The Quick Brown Fox Jumps Over The Lazy Dog');
    }); // end 'should change string to title case' test

  }); // end 'Utilities' section

});
