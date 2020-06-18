import { Process } from './process';
import { Alert } from './alert';

export interface Batch {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  owner: string;
  currentStep: number;
  recipe: string;
  schedule: Array<Process>;
  alerts: Array<Alert>;
};
