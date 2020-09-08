import { Process } from '../../src/shared/interfaces/process';

export const mockCalendarStep = () => {
  const mock: Process = {
    _id: 'calendar-step',
    cid: '0123456789012',
    type: 'calendar',
    name: 'mock-calendar-step',
    description: 'a mock calendar step',
    duration: 7,
  };
  return mock;
};
