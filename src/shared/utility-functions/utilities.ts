/**
 * Round a number to a given decimal place
 *
 * @params: numToRound - source number to round off
 * @params: places - number of places to round to
 *
 * @return: rounded off number
**/
export function roundToDecimalPlace(
  baseNum: number,
  places: number
): number {
  if (places < 0) {
    return -1;
  }

  return Math.round(baseNum * Math.pow(10, places)) / Math.pow(10, places);
}

/**
 * Change string to title case
 *
 * @params: str - string to modify
 *
 * @return: string in title case
**/
export function toTitleCase(str: string): string {
  return str.replace(
    /\b[a-z]/g,
    (firstChar: string): string => firstChar.toUpperCase()
  );
}
