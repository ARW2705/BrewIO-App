import { CalendarStep, ManualStep, TimerStep } from './process-steps';

export interface Process {
  _id: string;
  createdAt: string;
  updatedAt: string;
  calendarSteps: Array<CalendarStep>;
  manualSteps: Array<ManualStep>;
  timerSteps: Array<TimerStep>;
};
