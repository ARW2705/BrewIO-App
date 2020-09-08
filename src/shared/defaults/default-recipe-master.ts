import { RecipeMaster } from '../interfaces/recipe-master';
import { defaultRecipeVariant } from '../defaults/default-recipe-variant';
import { defaultStyle } from '../defaults/default-style';

export const defaultRecipeMaster = () => {
  const _default: RecipeMaster = {
    cid: '0',
    name: '',
    style: defaultStyle(),
    notes: [],
    master: '',
    owner: '',
    isPublic: false,
    isFriendsOnly: false,
    variants: [defaultRecipeVariant()]
  };
  return _default;
};
