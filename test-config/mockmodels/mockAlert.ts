import { Alert } from '../../src/shared/interfaces/alert';

export const mockAlert = () => {
  const mock: Alert = {
    title: 'mock-alert',
    description: 'a present step',
    datetime: (new Date()).toISOString()
  };
  return mock;
}

export const mockAlertPast = () => {
  const mock: Alert = {
    title: 'mock-alert',
    description: 'a past step',
    datetime: '2019-11-01T12:00:00Z'
  };
  return mock;
}

export const mockAlertFuture = () => {
  const mock: Alert = {
    title: 'mock-alert',
    description: 'a future step',
    datetime: '2021-02-20T12:00:00Z'
  };
  return mock;
}

export const mockAlertCurrent = () => {
  const mock: Alert = {
    title: 'Mash out / Heat to boil',
    description: 'match mock batch current step',
    datetime: (new Date()).toISOString()
  };
  return mock;
}
