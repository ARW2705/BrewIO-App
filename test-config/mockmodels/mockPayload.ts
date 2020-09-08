import { RecipeMaster } from '../../src/shared/interfaces/recipe-master';

import { mockRecipeMasterActive } from './mockRecipeMasterActive';

export const mockRecipeMasterCreatePayload = (): object => {
  const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
  const mock: object = {
    master: {
      name: _mockRecipeMasterActive.name,
      style: _mockRecipeMasterActive.style,
      notes: _mockRecipeMasterActive.notes,
      isPublic: _mockRecipeMasterActive.isPublic
    },
    variant: _mockRecipeMasterActive.variants[0]
  };
  return mock;
};

export const mockRecipeMasterUpdatePayload = (): object => {
  const _mockRecipeMasterActive: RecipeMaster = mockRecipeMasterActive();
  const mock: object = {
    name: _mockRecipeMasterActive.name,
    style: _mockRecipeMasterActive.style,
    notes: _mockRecipeMasterActive.notes,
    isPublic: _mockRecipeMasterActive.isPublic
  };
  return mock;
};
