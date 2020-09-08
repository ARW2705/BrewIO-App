import { Hops } from './library';

export interface HopsSchedule {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  hopsType: Hops;
  quantity: number; // oz or gz
  addAt: number; // minutes
  dryHop: boolean;
  notes: string[];
};
