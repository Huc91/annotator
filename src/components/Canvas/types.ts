export interface Point {
  x: number;
  y: number;
}

export interface AnnotationRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export type DragMode = 'move' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
