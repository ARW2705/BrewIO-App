import { SelectedUnits } from './units';
import { Syncable } from './sync';

export interface User extends Syncable {
  _id?: string;
  cid: string;
  createdAt?: string;
  updatedAt?: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  friendList?: Array<string>;
  token: string;
  preferredUnitSystem: string;
  units: SelectedUnits;
  labelImage?: string;
  userImage?: string;
};
