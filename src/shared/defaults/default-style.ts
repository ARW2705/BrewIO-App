import { Style } from '../interfaces/library';

export const defaultStyle = () => {
  const def: Style = {
    _id: '-1',
    createdAt: '',
    updatedAt: '',
    name: 'None Selected',
    description: '',
    originalGravity: [-1, -1],
    finalGravity: [-1, -1],
    IBU: [-1, -1],
    SRM: [-1, -1],
    co2Volume: [-1, -1]
  };
  return def;
};
