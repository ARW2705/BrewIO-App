import { Process } from '../../src/shared/interfaces/process';
import { Timer } from '../../src/shared/interfaces/timer';
import { mockProcessSchedule } from './mockProcessSchedule';

export const mockTimer = () => {
  const mockTimer: Process = mockProcessSchedule()[10];
  const mock: Timer = {
    first: mockTimer.cid,
    timer: mockTimer,
    cid: '0123456789011',
    timeRemaining: mockTimer.duration / 2,
    show: true,
    isRunning: false,
    settings: {
      height: 360,
      width: 360,
      circle: {
        strokeDasharray: '5',
        strokeDashoffset: '10',
        stroke: '2',
        strokeWidth: 1,
        fill: 'fill',
        radius: 1,
        originX: 1,
        originY: 1
      },
      text: {
        textX: 'textX',
        textY: 'textY',
        textAnchor: 'textAnchor',
        fill: 'fill',
        fontSize: 'fontSize',
        fontFamily: 'fontFamily',
        dY: 'dY',
        content: 'content'
      }
    }
  };
  return mock;
};

export const mockConcurrentTimers = () => {
  const mockTimer: Array<Process> = mockProcessSchedule().slice(2, 4);
  const mock1: Timer = {
    first: mockTimer[0].cid,
    timer: mockTimer[0],
    cid: '0123456789012',
    timeRemaining: mockTimer[0].duration / 2,
    show: true,
    isRunning: false,
    settings: {
      height: 360,
      width: 360,
      circle: {
        strokeDasharray: '5',
        strokeDashoffset: '10',
        stroke: '2',
        strokeWidth: 1,
        fill: 'fill',
        radius: 1,
        originX: 1,
        originY: 1
      },
      text: {
        textX: 'textX',
        textY: 'textY',
        textAnchor: 'textAnchor',
        fill: 'fill',
        fontSize: 'fontSize',
        fontFamily: 'fontFamily',
        dY: 'dY',
        content: 'content'
      }
    }
  };
  const mock2: Timer = {
    first: mockTimer[1].cid,
    timer: mockTimer[1],
    cid: '0123456789013',
    timeRemaining: mockTimer[1].duration / 2,
    show: true,
    isRunning: false,
    settings: {
      height: 360,
      width: 360,
      circle: {
        strokeDasharray: '5',
        strokeDashoffset: '10',
        stroke: '2',
        strokeWidth: 1,
        fill: 'fill',
        radius: 1,
        originX: 1,
        originY: 1
      },
      text: {
        textX: 'textX',
        textY: 'textY',
        textAnchor: 'textAnchor',
        fill: 'fill',
        fontSize: 'fontSize',
        fontFamily: 'fontFamily',
        dY: 'dY',
        content: 'content'
      }
    }
  };
  return [ mock1, mock2 ];
};
