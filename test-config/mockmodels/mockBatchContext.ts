import { BatchContext } from '../../src/shared/interfaces/batch';

import { mockRecipeMasterActive } from './mockRecipeMasterActive';
import { mockRecipeVariantComplete } from './mockRecipeVariantComplete';

export const mockBatchContext = () => {
  const mock: BatchContext = {
    recipeMasterName: mockRecipeMasterActive().name,
    recipeVariantName: mockRecipeVariantComplete().variantName,
    recipeImageURL: ''
  };
  return mock;
};
