import { Process } from '../../src/shared/interfaces/process';
import { Timer } from '../../src/shared/interfaces/timers';
import { mockProcessSchedule } from './mockProcessSchedule';

export const mockTimer = () => {
  const timerIndex = 2;
  const mockTimer: Process = mockProcessSchedule()[timerIndex];
  const mock: Timer = {
    first: mockTimer._id,
    timer: mockTimer,
    interval: null,
    timeRemaining: mockTimer.duration / 2,
    show: true,
    settings: {
      height: 360,
      width: 360,
      circle: {
        strokeDasharray: 'strokeDasharray',
        strokeDashoffset: 'strokeDashoffset',
        stroke: 'stroke',
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
}
