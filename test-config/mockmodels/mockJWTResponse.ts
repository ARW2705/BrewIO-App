import { mockUser } from './mockUser';

export const mockJWTSuccess = {
  status: 'JWT valid',
  success: true,
  user: mockUser
};

export const mockJWTFailed = {
  status: 'JWT invalid',
  success: false,
  error: 'error msg'
};
