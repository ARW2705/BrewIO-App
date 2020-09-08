import { SelectedUnits } from '../interfaces/units';
import * as units from '../constants/units';

export const defaultMetric: SelectedUnits = {
  system: 'metric',
  weightSmall: units.WEIGHT_METRIC_SMALL,
  weightLarge: units.WEIGHT_METRIC_LARGE,
  volumeSmall: units.VOLUME_METRIC_SMALL,
  volumeLarge: units.VOLUME_METRIC_LARGE,
  temperature: units.TEMPERATURE_METRIC,
  density: units.SPECIFIC_GRAVITY
};

export const defaultEnglish: SelectedUnits = {
  system: 'english standard',
  weightSmall: units.WEIGHT_ENGLISH_SMALL,
  weightLarge: units.WEIGHT_ENGLISH_LARGE,
  volumeSmall: units.VOLUME_ENGLISH_SMALL,
  volumeLarge: units.VOLUME_ENGLISH_LARGE,
  temperature: units.TEMPERATURE_ENGLISH,
  density: units.BRIX
};
