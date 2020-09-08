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
  shortName: 'c'
};

/** English Standard **/

export const WEIGHT_ENGLISH_SMALL: Unit = {
  system: 'english standard',
  longName: 'ounce',
  shortName: 'oz'
};

export const WEIGHT_ENGLISH_LARGE: Unit = {
  system: 'english standard',
  longName: 'pound',
  shortName: 'lbs'
};

export const VOLUME_ENGLISH_SMALL: Unit = {
  system: 'english standard',
  longName: 'fluid ounce',
  shortName: 'fl oz'
};

export const VOLUME_ENGLISH_LARGE: Unit = {
  system: 'english standard',
  longName: 'gallon',
  shortName: 'gal'
};

export const TEMPERATURE_ENGLISH: Unit = {
  system: 'english standard',
  longName: 'fahrenheit',
  shortName: 'f'
};

/** Other **/

export const SPECIFIC_GRAVITY: Unit = {
  system: 'none',
  longName: 'specific gravity',
  shortName: 'sg'
};

export const BRIX: Unit = {
  system: 'none',
  longName: 'brix',
  shortName: 'bx'
};

export const PLATO: Unit = {
  system: 'none',
  longName: 'Plato',
  shortName: 'p'
};
