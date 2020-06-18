import { User } from './user';

export interface UserResponse {
  status: string;
  success: boolean;
  user?: User;
  error?: object;
};
