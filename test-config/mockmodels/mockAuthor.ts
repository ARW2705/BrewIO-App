import { Author } from '../../src/shared/interfaces/author';

export const mockAuthor = () => {
  const mock: Author = {
    username: 'Mock Author',
    labelImageURL: 'mockLabelImage',
    userImageURL: 'mockUserImage'
  };
  return mock;
};
