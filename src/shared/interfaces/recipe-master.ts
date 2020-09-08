import { RecipeVariant } from './recipe-variant';
import { Style } from './library';
import { Syncable } from './sync';

export interface RecipeMaster extends Syncable {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  name: string;
  style: Style;
  notes: string[];
  master: string; // variant id to be used as master of recipe
  owner: string; // user id of recipe author
  isPublic: boolean;
  isFriendsOnly: boolean;
  variants: RecipeVariant[];
  labelImageURL?: string;
};
