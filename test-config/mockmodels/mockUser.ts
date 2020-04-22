import { User } from '../../src/shared/interfaces/user';

export const mockUser = () => {
  const mock: User =  {
    _id: 'test-id',
    createdAt: '',
    updatedAt: '',
    username: 'mockUser',
    firstname: 'test',
    lastname: 'user',
    email: 'test@user.com',
    friendList: ['userId1', 'userId2'],
    token: 'testtoken',
    preferredUnits: 'e'
  };
  return mock;
};
