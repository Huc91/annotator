import type { AnnotationRect, Point } from './types';
import {
  HANDLE_SIZE, HANDLE_HALF_SIZE, COLORS,
  LABEL_BADGE_HEIGHT, LABEL_BADGE_PADDING, LABEL_BADGE_RADIUS, LABEL_FONT,
} from './constants';

/* ── rectangle creation preview ──────────────────────────── */

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

/* ── single annotation (stroke + optional label + optional handles) */

interface DrawOptions {
  isSelected: boolean;
  isHovered: boolean;
  showLabel: boolean;
}

export function drawAnnotation(ctx: CanvasRenderingContext2D, rect: AnnotationRect, options: DrawOptions) {
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
    drawSelectionHandles(ctx, rect);
  }
}

/* ── label badge (filled rounded rect with white text) ───── */

function drawLabelBadge(ctx: CanvasRenderingContext2D, rect: AnnotationRect, backgroundColor: string) {
  ctx.font = LABEL_FONT;
  const textWidth  = ctx.measureText(rect.label).width;
  const badgeWidth = textWidth + LABEL_BADGE_PADDING * 2;
  const badgeX     = Math.min(rect.x1, rect.x2);
  const badgeY     = Math.min(rect.y1, rect.y2) - LABEL_BADGE_HEIGHT - 2;

  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, LABEL_BADGE_HEIGHT, LABEL_BADGE_RADIUS);
  ctx.fill();

  ctx.fillStyle    = COLORS.labelText;
  ctx.textBaseline = 'middle';
  ctx.fillText(rect.label, badgeX + LABEL_BADGE_PADDING, badgeY + LABEL_BADGE_HEIGHT / 2);
}

/* ── corner handles on selected annotation ───────────────── */

function drawSelectionHandles(ctx: CanvasRenderingContext2D, rect: AnnotationRect) {
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

  // center move handle (small circle)
  const cx = (rect.x1 + rect.x2) / 2;
  const cy = (rect.y1 + rect.y2) / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, HANDLE_HALF_SIZE, 0, Math.PI * 2);
  ctx.fillStyle   = COLORS.handleFill;
  ctx.strokeStyle = COLORS.selected;
  ctx.lineWidth   = 1;
  ctx.fill();
  ctx.stroke();
}
