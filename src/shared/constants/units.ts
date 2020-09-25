import { Unit } from '../interfaces/units';

/** Metric **/

export const WEIGHT_METRIC_SMALL: Unit = {
  system: 'metric',
  longName: 'gram',
  shortName: 'g'
};

export const WEIGHT_METRIC_LARGE: Unit = {
  system: 'metric',
  longName: 'kilogram',
  shortName: 'kg'
};

export const VOLUME_METRIC_SMALL: Unit = {
  system: 'metric',
  longName: 'milliliter',
  shortName: 'mL'
};

export const VOLUME_METRIC_LARGE: Unit = {
  system: 'metric',
  longName: 'liter',
  shortName: 'l'
};

export const TEMPERATURE_METRIC: Unit = {
  system: 'metric',
  longName: 'celsius',
  shortName: '°C'
};

/** English Standard **/

export const WEIGHT_ENGLISH_SMALL: Unit = {
  system: 'englishStandard',
  longName: 'ounce',
  shortName: 'oz'
};

export const WEIGHT_ENGLISH_LARGE: Unit = {
  system: 'englishStandard',
  longName: 'pound',
  shortName: 'lb'
};

export const VOLUME_ENGLISH_SMALL: Unit = {
  system: 'englishStandard',
  longName: 'fluid ounce',
  shortName: 'oz'
};

export const VOLUME_ENGLISH_LARGE: Unit = {
  system: 'englishStandard',
  longName: 'gallon',
  shortName: 'gal'
};

export const TEMPERATURE_ENGLISH: Unit = {
  system: 'englishStandard',
  longName: 'fahrenheit',
  shortName: '°F'
};

/** Other **/

export const SPECIFIC_GRAVITY: Unit = {
  system: 'none',
  longName: 'specificGravity',
  shortName: 'sg'
};

export const BRIX: Unit = {
  system: 'none',
  longName: 'brix',
  shortName: 'bx',
  symbol: '°Bx'
};

export const PLATO: Unit = {
  system: 'none',
  longName: 'plato',
  shortName: 'p',
  symbol: '°P'
};
