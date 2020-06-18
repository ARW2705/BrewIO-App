import { RecipeMaster } from '../interfaces/recipe-master';
import { defaultRecipeVariant } from '../defaults/default-recipe-variant';
import { defaultStyle } from '../defaults/default-style';

export const defaultRecipeMaster = () => {
  const def: RecipeMaster = {
    cid: '0',
    name: '',
    style: defaultStyle(),
    notes: [],
    master: '',
    owner: '',
    hasActiveBatch: false,
    isPublic: false,
    isFriendsOnly: false,
    variants: [defaultRecipeVariant()]
  };
  return def;
};
