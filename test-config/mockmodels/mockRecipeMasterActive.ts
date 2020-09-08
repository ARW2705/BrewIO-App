import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeVariantComplete } from './mockRecipeVariantComplete';
import { mockRecipeVariantIncomplete } from './mockRecipeVariantIncomplete';
import { mockStyles } from './mockStyles';

export const mockRecipeMasterActive = () => {
  const mock: RecipeMaster = {
    _id: 'active',
    cid: '1234567890123',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    name: 'active',
    style: mockStyles()[0],
    notes: [],
    master: 'complete',
    owner: 'owner-id',
    isPublic: true,
    isFriendsOnly: false,
    variants: [
      mockRecipeVariantComplete(),
      mockRecipeVariantIncomplete()
    ]
  };
  return mock;
};
