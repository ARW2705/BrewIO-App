export interface CalendarStep {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  order: number;
  description: string;
  startDatetime: string;
  endDatetime: string;
  splitInterval: number;
};

export interface ManualStep {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  order: number;
  description: string;
  expectedDuration: number;
};

export interface TimerStep {
  _id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  order: number;
  description: string;
  duration: number;
  splitInterval: number;
  concurrent: boolean;
};
