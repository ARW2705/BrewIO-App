import { mockUser } from './mockUser';

export const mockJWTSuccess = () => {
  const mock = {
    status: 'JWT valid',
    success: true,
    user: mockUser
  };
  return mock;
};

export const mockJWTFailed = () => {
  const mock = {
    status: 'JWT invalid',
    success: false,
    error: 'error msg'
  };
  return mock;
};
