import { Grains } from './library';

export interface GrainBill {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  grainType: Grains;
  quantity: number;
  mill: number;
  notes: Array<string>;
};
