import { Batch } from '../../src/shared/interfaces/batch';

export const mockBatch: Batch = {
  _id: 'test-id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  currentStep: 5,
  recipe: 'recipe-id',
  schedule: [],
  alerts: []
};
