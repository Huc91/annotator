import type { AnnotationRect, DragMode, Point } from './types';
import { HANDLE_HIT_TOLERANCE } from './constants';

export function isPointOnHandle(point: Point, handle: Point): boolean {
  return Math.abs(point.x - handle.x) <= HANDLE_HIT_TOLERANCE
      && Math.abs(point.y - handle.y) <= HANDLE_HIT_TOLERANCE;
}

export function isPointInsideRect(point: Point, rect: AnnotationRect): boolean {
  return point.x >= Math.min(rect.x1, rect.x2)
      && point.x <= Math.max(rect.x1, rect.x2)
      && point.y >= Math.min(rect.y1, rect.y2)
      && point.y <= Math.max(rect.y1, rect.y2);
}

export function normalizeRect(rect: AnnotationRect): AnnotationRect {
  return {
    x1: Math.min(rect.x1, rect.x2),
    y1: Math.min(rect.y1, rect.y2),
    x2: Math.max(rect.x1, rect.x2),
    y2: Math.max(rect.y1, rect.y2),
    label: rect.label,
  };
}

export function getHandleAtPoint(point: Point, rect: AnnotationRect): DragMode | null {
  if (isPointOnHandle(point, { x: rect.x1, y: rect.y1 })) return 'top-left';
  if (isPointOnHandle(point, { x: rect.x2, y: rect.y1 })) return 'top-right';
  if (isPointOnHandle(point, { x: rect.x1, y: rect.y2 })) return 'bottom-left';
  if (isPointOnHandle(point, { x: rect.x2, y: rect.y2 })) return 'bottom-right';
  return null;
}

export function findAnnotationAtPoint(point: Point, list: AnnotationRect[]): number | null {
  for (let i = list.length - 1; i >= 0; i--) {
    if (isPointInsideRect(point, list[i])) return i;
  }
  return null;
}

export function applyDrag(original: AnnotationRect, dx: number, dy: number, mode: DragMode): AnnotationRect {
  if (mode === 'move') {
    return {
      ...original,
      x1: original.x1 + dx, y1: original.y1 + dy,
      x2: original.x2 + dx, y2: original.y2 + dy,
    };
  }

  const updated = { ...original };
  if (mode === 'top-left'  || mode === 'bottom-left')  updated.x1 = original.x1 + dx;
  if (mode === 'top-right' || mode === 'bottom-right') updated.x2 = original.x2 + dx;
  if (mode === 'top-left'  || mode === 'top-right')    updated.y1 = original.y1 + dy;
  if (mode === 'bottom-left' || mode === 'bottom-right') updated.y2 = original.y2 + dy;
  return updated;
}

export function getCursorForHandle(mode: DragMode): string {
  if (mode === 'top-left' || mode === 'bottom-right') return 'nwse-resize';
  return 'nesw-resize';
}
