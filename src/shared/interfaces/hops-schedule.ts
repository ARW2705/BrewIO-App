import { Hops } from './library';

export interface HopsSchedule {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  hopsType: Hops;
  quantity: number; // oz or g
  addAt: number; // minutes
  dryHop: boolean;
  notes: Array<string>;
};
