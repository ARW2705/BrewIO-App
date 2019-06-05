import { sharedProperties } from '../constants/shared-properties';

export function clone(obj: any): any {
  const result = JSON.parse(JSON.stringify(obj));
  _removeShared(result);
  return result;
}

export function getIndexById(id: string, arr: Array<any>) {
  for (let i=0; i < arr.length; i++) {
    if (arr[i]._id == id) {
      return i;
    }
  }
  return -1;
}

export function toTitleCase(str: string): string {
  return str.replace(/\b[a-z]/g, firstChar => firstChar.toUpperCase());
}

function _removeShared(obj: any) {
  for (const key in obj) {
    if (sharedProperties.indexOf(key) != -1) {
      delete obj[key];
    }
  }
}
