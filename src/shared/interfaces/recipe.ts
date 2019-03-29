import { GrainBill } from './grain-bill';
import { HopsSchedule } from './hops-schedule';
import { YeastBatch } from './yeast-batch';
import { OtherIngredients } from './other-ingredients';
import { Process } from './process';

export interface Recipe {
  _id: string;
  createdAt: string;
  updatedAt: string;
  variantName: string;
  notes: Array<string>;
  isActive: boolean;
  isFavorite: boolean;
  rating: number;
  efficiency: number;
  brewingType: string;
  batchVolume: number;
  boilVolume: number;
  mashVolume: number;
  finalGravity: number;
  ABV: number;
  IBU: number;
  SRM: number;
  grains: Array<GrainBill>;
  hops: Array<HopsSchedule>;
  yeast: Array<YeastBatch>;
  otherIngredients: Array<OtherIngredients>;
  processSchedule: Array<Process>;
};