import { Yeast } from './library';

export interface YeastBatch {
  _id: string;
  createdAt: string;
  updatedAt: string;
  yeastType: Yeast;
  quantity: number;
  requiresStarter: boolean;
  notes: Array<string>;
};
