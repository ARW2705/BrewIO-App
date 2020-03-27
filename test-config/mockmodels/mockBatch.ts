import { Batch } from '../../src/shared/interfaces/batch';

import { mockProcessSchedule } from './mockProcessSchedule';

export const mockBatch = () => {
  const mock: Batch = {
    _id: 'test-id',
    owner: 'user-id',
    createdAt: '2020-01-01T12:00:00.000Z',
    updatedAt: '2020-02-02T08:30:00.000Z',
    currentStep: 4,
    recipe: 'complete',
    schedule: mockProcessSchedule(),
    alerts: []
  };
  return mock;
};
