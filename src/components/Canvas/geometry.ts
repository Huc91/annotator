import type { Annotation, AnnotationRect, DragMode, Point } from './types';
import { HANDLE_HIT_TOLERANCE } from './constants';

export function isPointOnHandle(point: Point, handle: Point): boolean {
  return Math.abs(point.x - handle.x) <= HANDLE_HIT_TOLERANCE
      && Math.abs(point.y - handle.y) <= HANDLE_HIT_TOLERANCE;
}

export function isPointInsideAnnotation(point: Point, annotation: Annotation): boolean {
  if (annotation.type === 'circle') {
    const dx = point.x - annotation.cx;
    const dy = point.y - annotation.cy;
    return dx * dx + dy * dy <= annotation.radius * annotation.radius;
  }
  return point.x >= Math.min(annotation.x1, annotation.x2)
      && point.x <= Math.max(annotation.x1, annotation.x2)
      && point.y >= Math.min(annotation.y1, annotation.y2)
      && point.y <= Math.max(annotation.y1, annotation.y2);
}

export function normalizeAnnotation(annotation: Annotation): Annotation {
  if (annotation.type === 'circle') {
    return { ...annotation, radius: Math.abs(annotation.radius) };
  }
  return {
    ...annotation,
    x1: Math.min(annotation.x1, annotation.x2),
    y1: Math.min(annotation.y1, annotation.y2),
    x2: Math.max(annotation.x1, annotation.x2),
    y2: Math.max(annotation.y1, annotation.y2),
  };
}

export function getHandleAtPoint(point: Point, annotation: Annotation): DragMode | null {
  if (annotation.type === 'circle') {
    if (isPointOnHandle(point, { x: annotation.cx + annotation.radius, y: annotation.cy })) return 'radius';
    return null;
  }
  if (isPointOnHandle(point, { x: annotation.x1, y: annotation.y1 })) return 'top-left';
  if (isPointOnHandle(point, { x: annotation.x2, y: annotation.y1 })) return 'top-right';
  if (isPointOnHandle(point, { x: annotation.x1, y: annotation.y2 })) return 'bottom-left';
  if (isPointOnHandle(point, { x: annotation.x2, y: annotation.y2 })) return 'bottom-right';
  return null;
}

export function findAnnotationAtPoint(point: Point, list: Annotation[]): number | null {
  for (let i = list.length - 1; i >= 0; i--) {
    if (isPointInsideAnnotation(point, list[i])) return i;
  }
  return null;
}

export function applyDrag(original: Annotation, dx: number, dy: number, mode: DragMode): Annotation {
  if (original.type === 'circle') {
    if (mode === 'move') {
      return { ...original, cx: original.cx + dx, cy: original.cy + dy };
    }
    if (mode === 'radius') {
      return { ...original, radius: Math.max(5, original.radius + dx) };
    }
    return original;
  }

  if (mode === 'move') {
    return {
      ...original,
      x1: original.x1 + dx, y1: original.y1 + dy,
      x2: original.x2 + dx, y2: original.y2 + dy,
    };
  }

  const updated: AnnotationRect = { ...original };
  if (mode === 'top-left'  || mode === 'bottom-left')  updated.x1 = original.x1 + dx;
  if (mode === 'top-right' || mode === 'bottom-right') updated.x2 = original.x2 + dx;
  if (mode === 'top-left'  || mode === 'top-right')    updated.y1 = original.y1 + dy;
  if (mode === 'bottom-left' || mode === 'bottom-right') updated.y2 = original.y2 + dy;
  return updated;
}

export function getCursorForHandle(mode: DragMode): string {
  if (mode === 'radius') return 'ew-resize';
  if (mode === 'top-left' || mode === 'bottom-right') return 'nwse-resize';
  return 'nesw-resize';
}

/** Returns the axis-aligned bounding box of any annotation in pixel coords. */
export function getAnnotationBounds(annotation: Annotation): { left: number; top: number; right: number; bottom: number } {
  if (annotation.type === 'circle') {
    return {
      left:   annotation.cx - annotation.radius,
      top:    annotation.cy - annotation.radius,
      right:  annotation.cx + annotation.radius,
      bottom: annotation.cy + annotation.radius,
    };
  }
  return {
    left:   Math.min(annotation.x1, annotation.x2),
    top:    Math.min(annotation.y1, annotation.y2),
    right:  Math.max(annotation.x1, annotation.x2),
    bottom: Math.max(annotation.y1, annotation.y2),
  };
}
