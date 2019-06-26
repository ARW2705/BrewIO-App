import { Batch } from '../../src/shared/interfaces/batch';

import { mockProcessSchedule } from './mockProcessSchedule';

export const mockBatch: Batch = {
  _id: 'test-id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currentStep: 4,
  recipe: 'recipe-id',
  schedule: mockProcessSchedule,
  alerts: []
};
