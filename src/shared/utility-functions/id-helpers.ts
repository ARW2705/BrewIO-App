import { DEFAULT_ID_TYPE_REGEX } from '../constants/default-id-pattern';


/**
 * Get an id from an object, prioritizing _id
 *
 * @params: obj - an object that may contain an id
 *
 * @return: the id as a string else undefined
**/
export function getId(obj: object): string {
  if (obj['_id'] !== undefined) return obj['_id'];
  if (obj['cid'] !== undefined) return obj['cid'];
  return undefined;
}

/**
 * Get the index of an array of objects that has a specific id string
 *
 * @params: id - id string to search
 * @params: arr - array of objects with an _id property
 *
 * @return: index of object with matching id or -1 if none found
**/
export function getIndexById(id: string, arr: object[]): number {
  for (let i=0; i < arr.length; i++) {
    if (hasId(arr[i], id)) {
      return i;
    }
  }
  return -1;
}

/**
 * Check if the given id is client (default) or server generated
 * Server generated ids are 24 chars long, client generated are unix timestamps
 * in milliseconds
 *
 * @params: id - id as a string
 *
 * @return: true if id contains no letters
**/
export function hasDefaultIdType(id: string): boolean {
  if (id === undefined) {
    return true;
  }
  return DEFAULT_ID_TYPE_REGEX.test(id);
}

/**
 * Check if object has search id either as _id or cid property
 *
 * @params: obj - object in which to search
 * @params: searchId - id to compare
 *
 * @return: true if either obj _id or cid matches searchId
**/
export function hasId(obj: object, searchId: string): boolean {
  if (searchId === null || searchId === undefined) {
    return false;
  }

  return obj['_id'] === searchId || obj['cid'] === searchId;
}

/**
 * Check if a server id has been set as '_id' property
 *
 * @params: id - id as a string
 *
 * @return: true if id is undefined
**/
export function isMissingServerId(id: string): boolean {
  return id === undefined;
}
