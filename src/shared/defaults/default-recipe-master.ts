import { RecipeMaster } from '../interfaces/recipe-master';
import { defaultRecipe } from '../defaults/default-recipe';
import { defaultStyle } from '../defaults/default-style';

export const defaultRecipeMaster = () => {
  const def: RecipeMaster = {
    _id: 'default',
    name: '',
    style: defaultStyle(),
    notes: [],
    master: '',
    owner: '',
    hasActiveBatch: false,
    isPublic: false,
    recipes: [defaultRecipe()]
  };
  return def;
};
