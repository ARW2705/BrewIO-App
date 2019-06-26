import { sharedProperties } from '../constants/shared-properties';

export function clone(obj: any, keepShared: boolean = false): any {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && (keepShared || sharedProperties.indexOf(key) === -1)) {
      result[key] = obj[key];
    }
  }
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

export function roundToDecimalPlace(numToRound: number, places: number): number {
  if (places < 0) return -1;
  return Math.round(numToRound * Math.pow(10, places)) / Math.pow(10, places);
}

export function toTitleCase(str: string): string {
  return str.replace(/\b[a-z]/g, firstChar => firstChar.toUpperCase());
}
