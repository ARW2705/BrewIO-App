import { User } from '../../src/shared/interfaces/user';

import { defaultEnglish } from '../../src/shared/defaults/default-units';

export const mockUser = () => {
  const mock: User =  {
    _id: 'test-id',
    cid: 'offline',
    createdAt: '',
    updatedAt: '',
    username: 'mockUser',
    firstname: 'test',
    lastname: 'user',
    email: 'test@user.com',
    friendList: ['userId1', 'userId2'],
    token: 'testtoken',
    preferredUnitSystem: 'english standard',
    units: defaultEnglish,
    labelImage: 'label-image-url',
    userImage: 'user-image-url'
  };
  return mock;
};
