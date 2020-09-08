import { Process } from './process';
import { Alert } from './alert';
import { PrimaryValues } from './primary-values';
import { SelectedUnits } from './units';
import { Syncable } from './sync';

export interface Batch extends Syncable {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  owner: string; // owner id of the batch, not author of recipe
  recipeMasterId: string;
  recipeVariantId: string;
  isArchived: boolean;
  annotations: BatchAnnotations;
  process: BatchProcess;
  contextInfo: BatchContext;
};

export interface BatchAnnotations {
  styleId: string;
  units: SelectedUnits;
  targetValues: PrimaryValues;
  measuredValues: PrimaryValues;
  notes: string[];
  packagingDate?: string;
};

export interface BatchContext {
  recipeMasterName: string;
  recipeVariantName: string;
  recipeImageURL: string;
};

export interface BatchProcess {
  currentStep: number;
  schedule: Process[];
  alerts: Alert[];
};
