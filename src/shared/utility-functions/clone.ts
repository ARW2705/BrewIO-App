/**
 * Deep copy an object - use with objects whose values follow the types
 *  Object, Array, string, number, boolean, or Date
 *
 * @params: obj - object to copy
 *
 * @return: deep copied object
**/
export function clone<T>(obj: T): T {
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
