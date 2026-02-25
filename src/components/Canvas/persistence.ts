import type { AnnotationRect } from './types';
import { STORAGE_KEY } from './constants';

interface SessionData {
  imageSrc: string;
  rects: AnnotationRect[];
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportAnnotationsCsv(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const data: SessionData = JSON.parse(raw);
    if (!Array.isArray(data.rects) || data.rects.length === 0) return false;

    const header = 'shape,x1,y1,x2,y2,label';
    const rows = data.rects.map((r) =>
      [
        'rectangle',
        r.x1.toFixed(6),
        r.y1.toFixed(6),
        r.x2.toFixed(6),
        r.y2.toFixed(6),
        escapeCsvField(r.label),
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations.csv';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
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
