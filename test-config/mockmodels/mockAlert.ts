import { Alert } from '../../src/shared/interfaces/alerts';

export const mockAlert = () => {
  const mock: Alert = {
    title: 'mock-alert-present',
    description: 'a present step',
    datetime: '2020-01-01T12:00:00Z'
  }
  return mock;
}

export const mockAlertPast = () => {
  const mock: Alert = {
    title: 'mock-alert-past',
    description: 'a past step',
    datetime: '2019-11-01T12:00:00Z'
  }
  return mock;
}

export const mockAlertFuture = () => {
  const mock: Alert = {
    title: 'mock-alert-future',
    description: 'a future step',
    datetime: '2020-02-20T12:00:00Z'
  }
  return mock;
}
