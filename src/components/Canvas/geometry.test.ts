import { describe, it, expect } from 'vitest';
import type { AnnotationRect, AnnotationCircle, Point } from './types';
import {
  isPointOnHandle,
  isPointInsideAnnotation,
  normalizeAnnotation,
  getHandleAtPoint,
  findAnnotationAtPoint,
  getAnnotationBounds,
  applyDrag,
  getCursorForHandle,
} from './geometry';
import { HANDLE_HIT_TOLERANCE } from './constants';

const rect: AnnotationRect = {
  type: 'rectangle',
  x1: 10,
  y1: 20,
  x2: 30,
  y2: 40,
  label: 'rect',
};

const circle: AnnotationCircle = {
  type: 'circle',
  cx: 50,
  cy: 60,
  radius: 10,
  label: 'circle',
};

const point = (x: number, y: number): Point => ({ x, y });

describe('isPointInsideAnnotation', () => {
  it('returns true for a point strictly inside a rectangle', () => {
    expect(isPointInsideAnnotation(point(20, 30), rect)).toBe(true);
  });

  it('treats rectangle edges as inside', () => {
    expect(isPointInsideAnnotation(point(10, 20), rect)).toBe(true); // top-left corner
    expect(isPointInsideAnnotation(point(30, 20), rect)).toBe(true); // top-right
    expect(isPointInsideAnnotation(point(10, 40), rect)).toBe(true); // bottom-left
    expect(isPointInsideAnnotation(point(30, 40), rect)).toBe(true); // bottom-right
  });

  it('returns false for a point outside a rectangle', () => {
    expect(isPointInsideAnnotation(point(9, 30), rect)).toBe(false);
    expect(isPointInsideAnnotation(point(31, 30), rect)).toBe(false);
    expect(isPointInsideAnnotation(point(20, 19), rect)).toBe(false);
    expect(isPointInsideAnnotation(point(20, 41), rect)).toBe(false);
  });

  it('handles rectangles where x1/x2 or y1/y2 are swapped', () => {
    const weirdRect: AnnotationRect = {
      ...rect,
      x1: 30,
      y1: 40,
      x2: 10,
      y2: 20,
    };
    expect(isPointInsideAnnotation(point(20, 30), weirdRect)).toBe(true);
    expect(isPointInsideAnnotation(point(9, 30), weirdRect)).toBe(false);
  });

  it('returns true for a point inside a circle (including boundary)', () => {
    // exactly on the radius horizontally
    expect(isPointInsideAnnotation(point(circle.cx + circle.radius, circle.cy), circle)).toBe(true);
    // slightly inside
    expect(isPointInsideAnnotation(point(circle.cx + circle.radius - 1, circle.cy), circle)).toBe(true);
  });

  it('returns false for a point outside a circle', () => {
    expect(isPointInsideAnnotation(point(circle.cx + circle.radius + 0.1, circle.cy), circle)).toBe(false);
  });
});

describe('isPointOnHandle', () => {
  it('returns true when the point is within the hit tolerance of the handle', () => {
    const handle = point(100, 100);
    const closePoint = point(100 + HANDLE_HIT_TOLERANCE - 1, 100);
    expect(isPointOnHandle(closePoint, handle)).toBe(true);
  });

  it('returns false when the point is outside the hit tolerance', () => {
    const handle = point(100, 100);
    const farPoint = point(100 + HANDLE_HIT_TOLERANCE + 1, 100);
    expect(isPointOnHandle(farPoint, handle)).toBe(false);
  });
});

describe('getHandleAtPoint', () => {
  it('detects the correct rectangle corner handle', () => {
    expect(getHandleAtPoint(point(rect.x1, rect.y1), rect)).toBe('top-left');
    expect(getHandleAtPoint(point(rect.x2, rect.y1), rect)).toBe('top-right');
    expect(getHandleAtPoint(point(rect.x1, rect.y2), rect)).toBe('bottom-left');
    expect(getHandleAtPoint(point(rect.x2, rect.y2), rect)).toBe('bottom-right');
  });

  it('returns null when not on any rectangle handle', () => {
    expect(getHandleAtPoint(point(20, 30), rect)).toBeNull();
  });

  it('detects the circle radius handle on the right', () => {
    expect(getHandleAtPoint(point(circle.cx + circle.radius, circle.cy), circle)).toBe('radius');
  });

  it('returns null when not on the circle handle', () => {
    expect(getHandleAtPoint(point(circle.cx, circle.cy), circle)).toBeNull();
  });
});

describe('findAnnotationAtPoint', () => {
  it('returns null when the point hits no annotation', () => {
    expect(findAnnotationAtPoint(point(0, 0), [rect, circle])).toBeNull();
  });

  it('returns index of the topmost annotation (last in array) that contains the point', () => {
    const overlappingRect: AnnotationRect = {
      ...rect,
      label: 'top',
    };
    const list = [rect, overlappingRect];
    // both rectangles contain the point; should hit the last index
    expect(findAnnotationAtPoint(point(20, 30), list)).toBe(1);
  });

  it('works with mixed rectangle and circle annotations', () => {
    const list = [rect, circle];
    expect(findAnnotationAtPoint(point(20, 30), list)).toBe(0);
    expect(findAnnotationAtPoint(point(circle.cx, circle.cy), list)).toBe(1);
  });
});

describe('normalizeAnnotation', () => {
  it('normalizes rectangle coordinates so that x1 <= x2 and y1 <= y2', () => {
    const weirdRect: AnnotationRect = {
      ...rect,
      x1: 30,
      y1: 40,
      x2: 10,
      y2: 20,
    };
    const normalized = normalizeAnnotation(weirdRect) as AnnotationRect;
    expect(normalized.x1).toBe(10);
    expect(normalized.y1).toBe(20);
    expect(normalized.x2).toBe(30);
    expect(normalized.y2).toBe(40);
  });

  it('normalizes circle radius to be positive', () => {
    const weirdCircle: AnnotationCircle = {
      ...circle,
      radius: -15,
    };
    const normalized = normalizeAnnotation(weirdCircle) as AnnotationCircle;
    expect(normalized.radius).toBe(15);
  });
});

describe('getAnnotationBounds', () => {
  it('returns the bounding box for a rectangle (even if coordinates are swapped)', () => {
    const weirdRect: AnnotationRect = {
      ...rect,
      x1: 30,
      y1: 40,
      x2: 10,
      y2: 20,
    };
    const bounds = getAnnotationBounds(weirdRect);
    expect(bounds.left).toBe(10);
    expect(bounds.top).toBe(20);
    expect(bounds.right).toBe(30);
    expect(bounds.bottom).toBe(40);
  });

  it('returns the bounding box for a circle', () => {
    const bounds = getAnnotationBounds(circle);
    expect(bounds.left).toBe(circle.cx - circle.radius);
    expect(bounds.top).toBe(circle.cy - circle.radius);
    expect(bounds.right).toBe(circle.cx + circle.radius);
    expect(bounds.bottom).toBe(circle.cy + circle.radius);
  });
});

describe('applyDrag', () => {
  it('moves a rectangle by dx, dy when mode is move', () => {
    const moved = applyDrag(rect, 5, -3, 'move') as AnnotationRect;
    expect(moved.x1).toBe(rect.x1 + 5);
    expect(moved.y1).toBe(rect.y1 - 3);
    expect(moved.x2).toBe(rect.x2 + 5);
    expect(moved.y2).toBe(rect.y2 - 3);
  });

  it('resizes a rectangle corner according to drag mode', () => {
    const tl = applyDrag(rect, -2, -4, 'top-left') as AnnotationRect;
    expect(tl.x1).toBe(rect.x1 - 2);
    expect(tl.y1).toBe(rect.y1 - 4);

    const br = applyDrag(rect, 3, 6, 'bottom-right') as AnnotationRect;
    expect(br.x2).toBe(rect.x2 + 3);
    expect(br.y2).toBe(rect.y2 + 6);
  });

  it('moves a circle center when mode is move', () => {
    const moved = applyDrag(circle, 4, -2, 'move') as AnnotationCircle;
    expect(moved.cx).toBe(circle.cx + 4);
    expect(moved.cy).toBe(circle.cy - 2);
  });

  it('adjusts circle radius when mode is radius, clamping to minimum', () => {
    const larger = applyDrag(circle, 5, 0, 'radius') as AnnotationCircle;
    expect(larger.radius).toBe(circle.radius + 5);

    const tinyCircle: AnnotationCircle = { ...circle, radius: 5 };
    const smaller = applyDrag(tinyCircle, -10, 0, 'radius') as AnnotationCircle;
    expect(smaller.radius).toBe(5); // clamped
  });
});

describe('getCursorForHandle', () => {
  it('returns ew-resize for radius handle', () => {
    expect(getCursorForHandle('radius')).toBe('ew-resize');
  });

  it('returns nwse-resize for top-left and bottom-right', () => {
    expect(getCursorForHandle('top-left')).toBe('nwse-resize');
    expect(getCursorForHandle('bottom-right')).toBe('nwse-resize');
  });

  it('returns nesw-resize for the remaining corner handles', () => {
    expect(getCursorForHandle('top-right')).toBe('nesw-resize');
    expect(getCursorForHandle('bottom-left')).toBe('nesw-resize');
  });
}
);

