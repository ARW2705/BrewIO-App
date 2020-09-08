import { RecipeVariant } from '../interfaces/recipe-variant';

export const defaultRecipeVariant = () => {
  const _default: RecipeVariant = {
    cid: '0',
    variantName: 'Initial Recipe',
    notes: [],
    isFavorite: false,
    isMaster: false,
    efficiency: 70,
    brewingType: 'None Selected',
    mashDuration: 60,
    boilDuration: 60,
    batchVolume: 5,
    boilVolume: 6,
    mashVolume: 6.5,
    originalGravity: 1.000,
    finalGravity: 1.000,
    ABV: 0,
    IBU: 0,
    SRM: 0,
    grains: [],
    hops: [],
    yeast: [],
    otherIngredients: [],
    processSchedule: []
  };
  return _default;
};
