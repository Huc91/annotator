export interface Point {
  x: number;
  y: number;
}

export interface AnnotationRect {
  type: 'rectangle';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export interface AnnotationCircle {
  type: 'circle';
  cx: number;
  cy: number;
  radius: number;
  label: string;
}

export type Annotation = AnnotationRect | AnnotationCircle;

export type DragMode = 'move' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'radius';
