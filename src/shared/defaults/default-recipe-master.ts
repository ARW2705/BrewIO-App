import { RecipeMaster } from '../interfaces/recipe-master';
import { defaultRecipe } from '../defaults/default-recipe';
import { defaultStyle } from '../defaults/default-style';

export const defaultRecipeMaster: RecipeMaster = {
  name: '',
  style: defaultStyle,
  notes: [],
  master: '',
  hasActiveBatch: false,
  isPublic: false,
  recipes: [defaultRecipe]
};
