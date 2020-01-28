/* Module imports */
import { Observable } from 'rxjs';

/* Constants imports */
import { sharedProperties } from '../constants/shared-properties';

/**
 * Deep copy an object
 *
 * @params: obj - object to copy
 * @params: keepShared - true if sharedProperties should also be copied
 *
 * @return: copy of object
**/
export function clone(obj: any, keepShared: boolean = false): any {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && (keepShared || sharedProperties.indexOf(key) === -1)) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Get the index of an array of objects that has a specific id string
 *
 * @params: id - id string to search
 * @params: arr - array of objects with an _id property
 *
 * @return: index of object with matching id or -1 if none found
**/
export function getIndexById(id: string, arr: Array<any>) {
  for (let i=0; i < arr.length; i++) {
    if (arr[i]._id == id) {
      return i;
    }
  }
  return -1;
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
 * Change string to title case
 *
 * @params: str - string to modify
 *
 * @return: string in title case
**/
export function toTitleCase(str: string): string {
  return str.replace(/\b[a-z]/g, firstChar => firstChar.toUpperCase());
}
