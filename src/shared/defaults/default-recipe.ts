import { Recipe } from '../interfaces/recipe';

export const defaultRecipe: Recipe = {
  variantName: 'initial',
  notes: [],
  isActive: false,
  isFavorite: false,
  isMaster: false,
  efficiency: 70,
  brewingType: 'None Selected',
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
