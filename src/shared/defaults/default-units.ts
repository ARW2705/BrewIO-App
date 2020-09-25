import { SelectedUnits } from '../interfaces/units';
import * as units from '../constants/units';

export const defaultMetric = (): SelectedUnits => {
  const _default: SelectedUnits = {
    system: 'metric',
    weightSmall: units.WEIGHT_METRIC_SMALL,
    weightLarge: units.WEIGHT_METRIC_LARGE,
    volumeSmall: units.VOLUME_METRIC_SMALL,
    volumeLarge: units.VOLUME_METRIC_LARGE,
    temperature: units.TEMPERATURE_METRIC,
    density: units.SPECIFIC_GRAVITY
  };
  return _default;
};

export const defaultEnglish = (): SelectedUnits => {
  const _default: SelectedUnits = {
    system: 'englishStandard',
    weightSmall: units.WEIGHT_ENGLISH_SMALL,
    weightLarge: units.WEIGHT_ENGLISH_LARGE,
    volumeSmall: units.VOLUME_ENGLISH_SMALL,
    volumeLarge: units.VOLUME_ENGLISH_LARGE,
    temperature: units.TEMPERATURE_ENGLISH,
    density: units.SPECIFIC_GRAVITY
  };
  return _default;
};
