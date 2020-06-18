export interface ProgressCircleSettings {
  height: number;
  width: number;
  circle: {
    strokeDasharray: string;
    strokeDashoffset: string;
    stroke: string;
    strokeWidth: number;
    fill: string;
    radius: number;
    originX: number;
    originY: number;
  },
  text: {
    textX: string;
    textY: string;
    textAnchor: string;
    fill: string;
    fontSize: string;
    fontFamily: string;
    dY: string;
    content: string;
  }
};
