import { mockUser } from './mockUser';

export const mockLoginResponse = () => {
  const mock = {
    success: true,
    user: mockUser()
  };
  return mock;
};
