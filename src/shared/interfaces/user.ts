export interface User {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  friendList?: Array<string>;
  token: string;
};
