import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Observable } from 'rxjs/Observable';

/**
 * Convert an array of observables to an array of the current value of those
 * observables
 *
 * @params: obsArr - an array of observables of an object
 *
 * @return: new array of the current values of each observable
**/
export function getArrayFromObservables<T>(obsArr: Observable<T>[]): T[] {
  return obsArr.map((obs: Observable<T>) => {
    let object: T = null;
    obs.subscribe(data => object = data);
    return object;
  });
}

/**
 * Convert error to string
 *
 * @params: error - may be either string or ErrorObservable that contains a
 *                  string
 *
 * @return: the error message
**/
export function normalizeErrorObservableMessage(
  error: ErrorObservable | string
): string {
  return  error instanceof ErrorObservable && error.hasOwnProperty('error')
    ? error['error']
    : error;
}

/**
 * Convert an array into an array of behavior subjects
 *
 * @params: array - array to convert
 *
 * @return: array of behavior subjects
**/
export function toSubjectArray<T>(array: T[]): BehaviorSubject<T>[] {
  return array.map(item => new BehaviorSubject<T>(item));
}
