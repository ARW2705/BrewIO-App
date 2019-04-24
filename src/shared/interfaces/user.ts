import { RecipeMaster } from './recipe-master';

export interface User {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  masterList: Array<RecipeMaster>;
};
