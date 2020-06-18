import { RecipeVariant } from './recipe-variant';
import { Style } from './library';

export interface RecipeMaster {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  name: string;
  style: Style;
  notes: Array<string>;
  master: string;
  owner: string;
  hasActiveBatch: boolean;
  isPublic: boolean;
  isFriendsOnly: boolean;
  variants: Array<RecipeVariant>;
};
