import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Timer, BatchTimer } from '../../src/shared/interfaces/timer';
import { mockTimer, mockConcurrentTimers } from './mockTimer';
import { mockBatch } from './mockBatch';

export const mockBatchTimer = () => {
  const _mockConcurrentTimers = mockConcurrentTimers();
  const mock: BatchTimer = {
    batchId: mockBatch().cid,
    timers: [
      new BehaviorSubject<Timer>(mockTimer()),
      new BehaviorSubject<Timer>(_mockConcurrentTimers[0]),
      new BehaviorSubject<Timer>(_mockConcurrentTimers[1])
    ]
  };
  return mock;
};
