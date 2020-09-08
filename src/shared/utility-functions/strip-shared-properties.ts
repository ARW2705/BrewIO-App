import { SHARED_PROPERTIES } from '../constants/shared-properties';
import { STATIC_LIBRARY_PROPERTIES } from '../constants/static-library-properties';

/**
 * Remove database specific shared properties from object
 *
 * @params: obj - object to modify
 *
 * @return: none
**/
export function stripSharedProperties(obj: object): void {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      if (typeof item === 'object' && item !== null) {
        stripSharedProperties(item);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (STATIC_LIBRARY_PROPERTIES.includes(key)) continue;

      if (SHARED_PROPERTIES.includes(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        stripSharedProperties(obj[key]);
      }
    }
  }
}
