import type { Annotation, AnnotationCircle, AnnotationRect } from './types';
import { STORAGE_KEY } from './constants';

interface SessionData {
  imageSrc: string;
  /** Stored in normalised image coordinates [0..1]. */
  annotations: StoredAnnotation[];
}

type StoredAnnotation = StoredRect | StoredCircle;

interface StoredRect {
  type: 'rectangle';
  x1: number; y1: number;
  x2: number; y2: number;
  label: string;
}

interface StoredCircle {
  type: 'circle';
  cx: number; cy: number;
  radius: number;
  label: string;
}

/* ── CSV export ─────────────────────────────────────────────── */

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
    const list = data.annotations;

    if (!Array.isArray(list) || list.length === 0) return false;

    const header = 'shape,x1,y1,x2,y2,cx,cy,radius,label';
    const rows = list.map((annotation) => {
      if (annotation.type === 'circle') {
        return [
          'circle',
          '', '', '', '',
          annotation.cx.toFixed(6), annotation.cy.toFixed(6),
          annotation.radius.toFixed(6),
          escapeCsvField(annotation.label),
        ].join(',');
      }
      return [
        'rectangle',
        annotation.x1.toFixed(6), annotation.y1.toFixed(6),
        annotation.x2.toFixed(6), annotation.y2.toFixed(6),
        '', '', '',
        escapeCsvField(annotation.label),
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'annotations.csv';
    link.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

/* ── save / restore ─────────────────────────────────────────── */

function toStored(annotation: Annotation, canvasWidth: number, canvasHeight: number): StoredAnnotation {
  if (annotation.type === 'circle') {
    return {
      type: 'circle',
      cx: annotation.cx / canvasWidth,
      cy: annotation.cy / canvasHeight,
      radius: annotation.radius / canvasWidth,
      label: annotation.label,
    };
  }
  return {
    type: 'rectangle',
    x1: annotation.x1 / canvasWidth,  y1: annotation.y1 / canvasHeight,
    x2: annotation.x2 / canvasWidth,  y2: annotation.y2 / canvasHeight,
    label: annotation.label,
  };
}

function fromStored(stored: StoredAnnotation, canvasWidth: number, canvasHeight: number): Annotation {
  if (stored.type === 'circle') {
    return {
      type: 'circle',
      cx: stored.cx * canvasWidth,
      cy: stored.cy * canvasHeight,
      radius: stored.radius * canvasWidth,
      label: stored.label ?? '',
    } satisfies AnnotationCircle;
  }
  return {
    type: 'rectangle',
    x1: stored.x1 * canvasWidth,  y1: stored.y1 * canvasHeight,
    x2: stored.x2 * canvasWidth,  y2: stored.y2 * canvasHeight,
    label: stored.label ?? '',
  } satisfies AnnotationRect;
}

export function saveSession(
  imageSrc: string,
  annotations: Annotation[],
  canvasWidth: number,
  canvasHeight: number,
) {
  if (canvasWidth === 0 || canvasHeight === 0) return;

  const data: SessionData = {
    imageSrc,
    annotations: annotations.map((item) => toStored(item, canvasWidth, canvasHeight)),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function restoreSession(
  imageSrc: string,
  canvasWidth: number,
  canvasHeight: number,
): Annotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const data: SessionData = JSON.parse(raw);
    if (data.imageSrc !== imageSrc || !Array.isArray(data.annotations)) return [];
    return data.annotations.map((stored) => fromStored(stored, canvasWidth, canvasHeight));
  } catch {
    return [];
  }
}
