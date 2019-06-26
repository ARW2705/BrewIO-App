import { User } from '../../src/shared/interfaces/user';

import { mockBatch } from './mockBatch';

export const mockUser: User = {
  _id: 'test-id',
  createdAt: '',
  updatedAt: '',
  username: 'mockUser',
  firstname: 'test',
  lastname: 'user',
  email: 'test@user.com',
  masterList: [],
  inProgressList: [mockBatch]
};
