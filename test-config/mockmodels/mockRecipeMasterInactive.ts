import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeVariantComplete } from './mockRecipeVariantComplete';
import { mockStyles } from './mockStyles';

export const mockRecipeMasterInactive = () => {
  const mock: RecipeMaster = {
    _id: 'inactive',
    cid: '1234567890124',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'inactive',
    style: mockStyles()[0],
    notes: [],
    master: 'complete',
    owner: 'owner-id',
    isPublic: true,
    isFriendsOnly: false,
    variants: [
      mockRecipeVariantComplete()
    ]
  };
  return mock;
};
