import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeComplete } from './mockRecipeComplete';
import { mockRecipeIncomplete } from './mockRecipeIncomplete';
import { mockStyles } from './mockStyles';

export const mockRecipeMasterActive = () => {
  const mock: RecipeMaster = {
    _id: 'active',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'active',
    style: mockStyles()[0],
    notes: [],
    master: 'complete',
    owner: 'owner-id',
    hasActiveBatch: true,
    isPublic: true,
    recipes: [
      mockRecipeComplete(),
      mockRecipeIncomplete()
    ]
  };
  return mock;
};
