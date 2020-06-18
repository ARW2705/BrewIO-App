import { Yeast } from './library';

export interface YeastBatch {
  _id?: string;
  cid: string;
  createdAt?: string;
  updatedAt?: string;
  yeastType: Yeast;
  quantity: number; // packs/vials
  requiresStarter: boolean;
  notes: Array<string>;
};
