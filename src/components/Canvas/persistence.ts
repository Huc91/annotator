import type { AnnotationRect } from './types';
import { STORAGE_KEY } from './constants';

interface SessionData {
  imageSrc: string;
  rects: AnnotationRect[];
}

export function saveSession(
  imageSrc: string,
  annotations: AnnotationRect[],
  canvasWidth: number,
  canvasHeight: number,
) {
  if (canvasWidth === 0 || canvasHeight === 0) return;

  const data: SessionData = {
    imageSrc,
    rects: annotations.map((r) => ({
      x1: r.x1 / canvasWidth,  y1: r.y1 / canvasHeight,
      x2: r.x2 / canvasWidth,  y2: r.y2 / canvasHeight,
      label: r.label,
    })),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function restoreSession(
  imageSrc: string,
  canvasWidth: number,
  canvasHeight: number,
): AnnotationRect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data: SessionData = JSON.parse(raw);
    if (data.imageSrc !== imageSrc || !Array.isArray(data.rects)) return [];

    return data.rects.map((r) => ({
      x1: r.x1 * canvasWidth,  y1: r.y1 * canvasHeight,
      x2: r.x2 * canvasWidth,  y2: r.y2 * canvasHeight,
      label: r.label ?? '',
    }));
  } catch {
    return [];
  }
}
