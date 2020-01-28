import { ProgressCircleSettings } from '../interfaces/progress-circle';

export const defaultProgessCircle = () => {
  const def: ProgressCircleSettings = {
    height: 240,
    width: 240,
    circle: {
      strokeDasharray: '',
      strokeDashoffset: '',
      stroke: 'white',
      strokeWidth: 8,
      fill: 'transparent',
      radius: 104,
      originX: 120,
      originY: 120,
    },
    text: {
      textX: '50%',
      textY: '50%',
      textAnchor: 'middle',
      fill: 'white',
      fontSize: '90px',
      fontFamily: 'Arial',
      dY: '0.3em',
      content: ''
    }
  }
  return def;
};
