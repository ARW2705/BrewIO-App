import { Recipe } from './recipe';
import { Style } from './library';

export interface RecipeMaster {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  style: Style;
  notes: Array<string>;
  master: string;
  hasActiveBatch: boolean;
  isPublic: boolean;
  recipes: Array<Recipe>;
};
