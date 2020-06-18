export interface Process {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  cid: string;
  type: string;
  name: string;
  description?: string;
  startDatetime?: string;
  splitInterval?: number;
  expectedDuration?: number;
  concurrent?: boolean;
  duration?: number;
};
