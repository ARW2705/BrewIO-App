import { Recipe } from '../interfaces/recipe';

export const defaultRecipe = () => {
  const def: Recipe = {
    _id: 'default',
    variantName: 'Initial Batch',
    notes: [],
    isActive: false,
    isFavorite: false,
    isMaster: false,
    // owner: 'default',
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
    currentStep: 0,
    grains: [],
    hops: [],
    yeast: [],
    otherIngredients: [],
    processSchedule: []
  };
  return def;
};
