import { BatchAnnotations } from '../../src/shared/interfaces/batch';

export const mockBatchAnnotations = () => {
  const mock: BatchAnnotations = {
    styleId: 'style-id',
    targetValues: {
      originalGravity: 1.050,
      finalGravity: 1.010,
      efficiency: 70,
      batchVolume: 5,
      ABV: 5.25,
      IBU: 30,
      SRM: 20
    },
    measuredValues: {
      originalGravity: 1.055,
      finalGravity: 1.012,
      efficiency: 70,
      batchVolume: 5,
      ABV: 5.64,
      IBU: 30,
      SRM: 20
    },
    notes: []
  };
  return mock;
};
