import type { Annotation, AnnotationCircle, AnnotationRect, Point } from './types';
import {
  HANDLE_SIZE, HANDLE_HALF_SIZE, COLORS,
  LABEL_BADGE_HEIGHT, LABEL_BADGE_PADDING, LABEL_BADGE_RADIUS, LABEL_FONT,
} from './constants';
import { getAnnotationBounds } from './geometry';

/* ── creation previews ──────────────────────────────────────── */

export function drawRectanglePreview(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
  ctx.strokeStyle = COLORS.selected;
  ctx.lineWidth   = 1;
  ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);

  ctx.beginPath();
  ctx.rect(start.x - 2, start.y - 2, 4, 4);
  ctx.rect(end.x - 2, end.y - 2, 4, 4);
  ctx.fillStyle = COLORS.previewCorner;
  ctx.fill();
  ctx.stroke();
}

export function drawCirclePreview(ctx: CanvasRenderingContext2D, center: Point, edge: Point) {
  const radius = Math.sqrt((edge.x - center.x) ** 2 + (edge.y - center.y) ** 2);

  ctx.strokeStyle = COLORS.selected;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(center.x - 2, center.y - 2, 4, 4);
  ctx.fillStyle = COLORS.previewCorner;
  ctx.fill();
  ctx.strokeStyle = COLORS.selected;
  ctx.stroke();
}

/* ── single annotation ──────────────────────────────────────── */

interface DrawOptions {
  isSelected: boolean;
  isHovered: boolean;
  showLabel: boolean;
}

export function drawAnnotation(ctx: CanvasRenderingContext2D, annotation: Annotation, options: DrawOptions) {
  if (annotation.type === 'circle') {
    drawCircleAnnotation(ctx, annotation, options);
  } else {
    drawRectAnnotation(ctx, annotation, options);
  }
}

/* ── rectangle ──────────────────────────────────────────────── */

function drawRectAnnotation(ctx: CanvasRenderingContext2D, rect: AnnotationRect, options: DrawOptions) {
  const color = options.isSelected ? COLORS.selected : COLORS.annotation;

  if (options.isHovered) {
    ctx.fillStyle = COLORS.hoverOverlay;
    ctx.fillRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);
  }

  ctx.strokeStyle = color;
  ctx.lineWidth   = options.isSelected ? 2 : 1;
  ctx.strokeRect(rect.x1, rect.y1, rect.x2 - rect.x1, rect.y2 - rect.y1);

  if (rect.label && options.showLabel) {
    drawLabelBadge(ctx, rect, color);
  }

  if (options.isSelected) {
    drawRectSelectionHandles(ctx, rect);
  }
}

function drawRectSelectionHandles(ctx: CanvasRenderingContext2D, rect: AnnotationRect) {
  const corners: [number, number][] = [
    [rect.x1, rect.y1], [rect.x2, rect.y1],
    [rect.x1, rect.y2], [rect.x2, rect.y2],
  ];

  for (const [x, y] of corners) {
    ctx.fillStyle   = COLORS.handleFill;
    ctx.strokeStyle = COLORS.selected;
    ctx.lineWidth   = 1;
    ctx.fillRect(x - HANDLE_HALF_SIZE, y - HANDLE_HALF_SIZE, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(x - HANDLE_HALF_SIZE, y - HANDLE_HALF_SIZE, HANDLE_SIZE, HANDLE_SIZE);
  }

  drawCenterMoveHandle(ctx, (rect.x1 + rect.x2) / 2, (rect.y1 + rect.y2) / 2);
}

/* ── circle ─────────────────────────────────────────────────── */

function drawCircleAnnotation(ctx: CanvasRenderingContext2D, circle: AnnotationCircle, options: DrawOptions) {
  const color = options.isSelected ? COLORS.selected : COLORS.annotation;

  if (options.isHovered) {
    ctx.fillStyle = COLORS.hoverOverlay;
    ctx.beginPath();
    ctx.arc(circle.cx, circle.cy, circle.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth   = options.isSelected ? 2 : 1;
  ctx.beginPath();
  ctx.arc(circle.cx, circle.cy, circle.radius, 0, Math.PI * 2);
  ctx.stroke();

  if (circle.label && options.showLabel) {
    drawLabelBadge(ctx, circle, color);
  }

  if (options.isSelected) {
    drawCircleSelectionHandles(ctx, circle);
  }
}

function drawCircleSelectionHandles(ctx: CanvasRenderingContext2D, circle: AnnotationCircle) {
  const handleX = circle.cx + circle.radius;
  const handleY = circle.cy;

  ctx.fillStyle   = COLORS.handleFill;
  ctx.strokeStyle = COLORS.selected;
  ctx.lineWidth   = 1;
  ctx.fillRect(handleX - HANDLE_HALF_SIZE, handleY - HANDLE_HALF_SIZE, HANDLE_SIZE, HANDLE_SIZE);
  ctx.strokeRect(handleX - HANDLE_HALF_SIZE, handleY - HANDLE_HALF_SIZE, HANDLE_SIZE, HANDLE_SIZE);

  drawCenterMoveHandle(ctx, circle.cx, circle.cy);
}

/* ── shared helpers ─────────────────────────────────────────── */

function drawCenterMoveHandle(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, HANDLE_HALF_SIZE, 0, Math.PI * 2);
  ctx.fillStyle   = COLORS.handleFill;
  ctx.strokeStyle = COLORS.selected;
  ctx.lineWidth   = 1;
  ctx.fill();
  ctx.stroke();
}

function drawLabelBadge(ctx: CanvasRenderingContext2D, annotation: Annotation, backgroundColor: string) {
  const bounds = getAnnotationBounds(annotation);

  ctx.font = LABEL_FONT;
  const textWidth  = ctx.measureText(annotation.label).width;
  const badgeWidth = textWidth + LABEL_BADGE_PADDING * 2;
  const badgeX     = bounds.left;
  const badgeY     = bounds.top - LABEL_BADGE_HEIGHT - 2;

  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, LABEL_BADGE_HEIGHT, LABEL_BADGE_RADIUS);
  ctx.fill();

  ctx.fillStyle    = COLORS.labelText;
  ctx.textBaseline = 'middle';
  ctx.fillText(annotation.label, badgeX + LABEL_BADGE_PADDING, badgeY + LABEL_BADGE_HEIGHT / 2);
}
