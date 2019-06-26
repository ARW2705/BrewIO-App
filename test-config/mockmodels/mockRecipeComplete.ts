import { Recipe } from '../../src/shared/interfaces/recipe';
import { mockGrainBill } from './mockGrainBill';
import { mockHopsSchedule } from './mockHopsSchedule';
import { mockYeastGroup } from './mockYeastGroup';
import { mockProcessSchedule } from './mockProcessSchedule';

export const mockRecipeComplete: Recipe = {
  _id: 'complete',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  variantName: 'complete',
  notes: [],
  isActive: false,
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
  currentStep: 0,
  grains: mockGrainBill,
  hops: mockHopsSchedule,
  yeast: mockYeastGroup,
  otherIngredients: [],
  processSchedule: mockProcessSchedule
};
