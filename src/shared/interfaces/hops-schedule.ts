import { Hops } from './library';

export interface HopsSchedule {
  _id: string;
  createdAt?: string;
  updatedAt?: string;
  hopsType: Hops;
  quantity: number;
  addAt: number;
  dryHop: boolean;
  notes: Array<string>;
};
