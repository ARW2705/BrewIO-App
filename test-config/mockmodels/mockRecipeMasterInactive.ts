import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeComplete } from './mockRecipeComplete';
import { mockStyles } from './mockStyles';

export const mockRecipeMasterInactive = () => {
  const mock: RecipeMaster = {
    _id: 'inactive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'inactive',
    style: mockStyles()[0],
    notes: [],
    master: 'incomplete',
    owner: 'owner-id',
    hasActiveBatch: false,
    isPublic: true,
    recipes: [
      mockRecipeComplete()
    ]
  };
  return mock;
};
