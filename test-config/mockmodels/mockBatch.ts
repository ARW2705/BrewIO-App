import { Batch } from '../../src/shared/interfaces/batch';

import { mockProcessSchedule } from './mockProcessSchedule';
import { mockRecipeMasterActive } from './mockRecipeMasterActive';
import { mockRecipeVariantComplete } from './mockRecipeVariantComplete';
import { mockBatchAnnotations } from './mockBatchAnnotations';
import { mockBatchContext } from './mockBatchContext';

export const mockBatch = () => {
  const _mockRecipeMasterActive = mockRecipeMasterActive();
  const _mockRecipeVariantComplete = mockRecipeVariantComplete();

  const mock: Batch = {
    _id: 'test-id',
    cid: '1234567890123',
    owner: 'user-id',
    createdAt: '2020-01-01T12:00:00.000Z',
    updatedAt: '2020-02-02T08:30:00.000Z',
    recipeMasterId: _mockRecipeMasterActive._id,
    recipeVariantId: _mockRecipeVariantComplete._id,
    isArchived: false,
    annotations: mockBatchAnnotations(),
    process: {
      currentStep: 4,
      schedule: mockProcessSchedule(),
      alerts: []
    },
    contextInfo: mockBatchContext()
  };
  return mock;
};
