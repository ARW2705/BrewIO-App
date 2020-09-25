import { SelectedUnits, Unit } from '../../src/shared/interfaces/units';

import * as units from '../../src/shared/constants/units';

export const mockEnglishUnits = () => {
  const mock: SelectedUnits = {
    system: 'englishStandard',
    weightSmall: units.WEIGHT_ENGLISH_SMALL,
    weightLarge: units.WEIGHT_ENGLISH_LARGE,
    volumeSmall: units.VOLUME_ENGLISH_SMALL,
    volumeLarge: units.VOLUME_ENGLISH_LARGE,
    temperature: units.TEMPERATURE_ENGLISH,
    density: units.SPECIFIC_GRAVITY
  };
  return mock
};

export const mockMetricUnits = () => {
  const mock: SelectedUnits = {
    system: 'metric',
    weightSmall: units.WEIGHT_METRIC_SMALL,
    weightLarge: units.WEIGHT_METRIC_LARGE,
    volumeSmall: units.VOLUME_METRIC_SMALL,
    volumeLarge: units.VOLUME_METRIC_LARGE,
    temperature: units.TEMPERATURE_METRIC,
    density: units.SPECIFIC_GRAVITY
  };
  return mock;
};

export const mockWeightSmallUnit = () => {
  const mock: Unit = {
    system: 'englishStandard',
    longName: 'ounce',
    shortName: 'oz'
  };
  return mock;
};
