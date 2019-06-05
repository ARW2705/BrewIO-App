import { Process } from './process';
import { Alert } from './alerts';

export interface Batch {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  currentStep: number;
  recipe: string;
  schedule: Array<Process>;
  alerts: Array<Alert>;
}
