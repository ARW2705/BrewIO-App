import { Grains } from './library';

export interface GrainBill {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  grainType: Grains;
  quantity: number; // lbs or kg
  mill: number; // 1/1000th in or mm
  notes: Array<string>;
};
