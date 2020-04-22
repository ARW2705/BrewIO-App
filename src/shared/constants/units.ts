import { Units } from '../interfaces/units';

export const systemTypes = ['e', 'm'];

export const english: Units = {
  capacity: 'gal',
  weight: {
    small: 'oz',
    large: 'lbs'
  },
  temperature: 'f',
  distance: 'in'
};

export const metric: Units = {
  capacity: 'l',
  weight: {
    small: 'g',
    large: 'kg'
  },
  temperature: 'c',
  distance: 'mm'
};
