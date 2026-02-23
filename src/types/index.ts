export type ToolType = 'select' | 'rectangle' | 'circle';

export interface RectShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CircleShape {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export type Shape = RectShape | CircleShape;

export interface Annotation {
  id: string;
  shape: Shape;
  label: string;
}
