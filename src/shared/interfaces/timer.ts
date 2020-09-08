import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Process } from './process';
import { ProgressCircleSettings } from './progress-circle';

export interface Timer {
  cid: string;
  first: string;
  timer: Process;
  timeRemaining: number;
  show: boolean;
  isRunning: boolean;
  settings: ProgressCircleSettings;
};

export interface BatchTimer {
  batchId: string;
  timers: BehaviorSubject<Timer>[];
};
