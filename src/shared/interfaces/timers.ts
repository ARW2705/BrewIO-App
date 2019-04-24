import { Process } from './process';
import { ProgressCircleSettings } from './progress-circle';

export interface Timer {
  first: string;
  timer: Process;
  interval: any;
  timeRemaining: number;
  show: boolean;
  settings: ProgressCircleSettings;
};
