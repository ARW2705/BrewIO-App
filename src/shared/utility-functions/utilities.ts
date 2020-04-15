/* Module imports */
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

/* Constants imports */
import { sharedProperties } from '../constants/shared-properties';
import { staticLibraryProperties } from '../constants/static-library-properties';


/**
 * Deep copy an object - use with objects whose values follow the types
 *  Object, Array, string, number, boolean, or Date
 *
 * @params: obj - object to copy
 *
 * @return: deep copied object
**/
export function clone(obj: any): any {
  let newObj;

  if (Array.isArray(obj)) {
    newObj = [];
    for (let item of obj) {
      if (typeof item === 'object' && item !== null) {
        newObj.push(clone(item));
      } else {
        newObj.push(item);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    newObj = {};
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        newObj[key] = clone(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  return newObj;
}

/**
 * Convert an array of observables to an array of the current value of those observables
 *
 * @params: obsArr - an array of observables of an object
 *
 * @return: array of the current values of each observable
**/
export function getArrayFromObservables(obsArr: Array<Observable<any>>): Array<any> {
  return obsArr.map(obs => {
    let object = null;
    obs.subscribe(data => object = data);
    return object;
  });
}

/**
 * Get the index of an array of objects that has a specific id string
 *
 * @params: id - id string to search
 * @params: arr - array of objects with an _id property
 *
 * @return: index of object with matching id or -1 if none found
**/
export function getIndexById(id: string, arr: Array<any>): number {
  for (let i=0; i < arr.length; i++) {
    if (arr[i]._id == id) {
      return i;
    }
  }
  return -1;
}

/**
 * Round a number to a given decimal place
 *
 * @params: numToRound - source number to round off
 * @params: places - number of places to round to
 *
 * @return: rounded off number
**/
export function roundToDecimalPlace(numToRound: number, places: number): number {
  if (places < 0) return -1;
  return Math.round(numToRound * Math.pow(10, places)) / Math.pow(10, places);
}

/**
 * Remove database specific shared properties from object
 *
 * @params: obj - object to modify
 *
 * @return: none
**/
export function stripSharedProperties(obj: any): void {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      if (typeof item === 'object' && item !== null) {
        stripSharedProperties(item);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (staticLibraryProperties.includes(key)) continue;

      if (sharedProperties.includes(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        stripSharedProperties(obj[key]);
      }
    }
  }
}

/**
 * Convert an array into an array of behavior subjects
 *
 * @params: array - array to convert
 *
 * @return: array of behavior subjects
**/
export function toSubjectArray<T>(array: Array<T>): Array<BehaviorSubject<T>> {
  return array.map(item => new BehaviorSubject<T>(item));
}

/**
 * Change string to title case
 *
 * @params: str - string to modify
 *
 * @return: string in title case
**/
export function toTitleCase(str: string): string {
  return str.replace(/\b[a-z]/g, firstChar => firstChar.toUpperCase());
}
