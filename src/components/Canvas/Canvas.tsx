import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../store';
import { drawRectanglePreview, drawCirclePreview, drawAnnotation } from './drawing';
import {
  normalizeAnnotation, getHandleAtPoint, findAnnotationAtPoint,
  isPointInsideAnnotation, applyDrag, getCursorForHandle, getAnnotationBounds,
} from './geometry';
import { saveSession, restoreSession } from './persistence';
import type { Annotation, AnnotationCircle, DragMode, Point } from './types';
import './Canvas.css';

export function Canvas() {
  /* ── canvas & image ────────────────────────────────────── */
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const imageRef         = useRef<HTMLImageElement | null>(null);
  const canvasLogicalSize = useRef({ width: 0, height: 0 });

  /* ── drawing-in-progress state ─────────────────────────── */
  const mousePosition        = useRef<Point>({ x: 0, y: 0 });
  const drawingStartPosition = useRef<Point | null>(null);
  const isDrawingNewRect     = useRef(false);
  const isDrawingNewCircle   = useRef(false);

  /* ── render loop ───────────────────────────────────────── */
  const needsRedraw      = useRef(false);
  const animationFrameId = useRef(0);

  /* ── annotations (source of truth lives in a ref) ──────── */
  const annotations             = useRef<Annotation[]>([]);
  const selectedAnnotationIndex = useRef<number | null>(null);
  const hoveredAnnotationIndex  = useRef<number | null>(null);
  const editingAnnotationIndex  = useRef<number | null>(null);

  /* ── drag state ────────────────────────────────────────── */
  const activeDragMode    = useRef<DragMode | null>(null);
  const dragStartPosition = useRef<Point | null>(null);
  const dragOriginal      = useRef<Annotation | null>(null);

  /* ── React state (drives HTML overlays & meta display) ── */
  const imageSrc = useAppStore((s) => s.imageSrc);
  const [imageNaturalSize, setImageNaturalSize]   = useState({ width: 0, height: 0 });
  const [imageScalePercent, setImageScalePercent]  = useState(100);
  const [editingLabelIndex, setEditingLabelIndex] = useState<number | null>(null);
  const [labelInputText, setLabelInputText]       = useState('');
  const [selectedOverlay, setSelectedOverlay]     = useState<Annotation | null>(null);
  const [editingOverlay, setEditingOverlay]       = useState<Annotation | null>(null);

  useEffect(() => { editingAnnotationIndex.current = editingLabelIndex; }, [editingLabelIndex]);

  /* ── helpers to keep refs + React state in sync ────────── */

  const selectAnnotation = useCallback((index: number | null) => {
    selectedAnnotationIndex.current = index;
    const annotation = index !== null ? annotations.current[index] : null;
    setSelectedOverlay(annotation ? { ...annotation } : null);
  }, []);

  const startLabelEditing = useCallback((index: number | null, text = '') => {
    editingAnnotationIndex.current = index;
    setEditingLabelIndex(index);
    setLabelInputText(index !== null ? (text || annotations.current[index]?.label || '') : '');
    const annotation = index !== null ? annotations.current[index] : null;
    setEditingOverlay(annotation ? { ...annotation } : null);
  }, []);

  const refreshSelectedOverlay = useCallback(() => {
    const index      = selectedAnnotationIndex.current;
    const annotation = index !== null ? annotations.current[index] : null;
    setSelectedOverlay(annotation ? { ...annotation } : null);
  }, []);

  /* ── persistence ───────────────────────────────────────── */

  const persist = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    const { width, height } = canvasLogicalSize.current;
    saveSession(imageSrc, annotations.current, width, height);
  }, [imageSrc]);

  /* ── draw (renders everything onto the canvas) ─────────── */

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image  = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d')!;
    const { width, height } = canvasLogicalSize.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    if (isDrawingNewRect.current && drawingStartPosition.current) {
      drawRectanglePreview(ctx, drawingStartPosition.current, mousePosition.current);
    }

    if (isDrawingNewCircle.current && drawingStartPosition.current) {
      drawCirclePreview(ctx, drawingStartPosition.current, mousePosition.current);
    }

    const isDragging = activeDragMode.current !== null;

    annotations.current.forEach((annotation, index) => {
      const isSelected = index === selectedAnnotationIndex.current;
      const isHovered  = index === hoveredAnnotationIndex.current && !isSelected;
      const isEditing  = index === editingAnnotationIndex.current;

      drawAnnotation(ctx, annotation, {
        isSelected,
        isHovered,
        showLabel: (!isSelected && !isEditing) || (isSelected && isDragging),
      });
    });
  }, []);

  /* ── setup (loads image + attaches mouse handlers) ─────── */

  const setup = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    annotations.current             = [];
    selectedAnnotationIndex.current = null;
    hoveredAnnotationIndex.current  = null;

    const getMousePosition = (e: MouseEvent): Point => {
      const bounds = canvas.getBoundingClientRect();
      return { x: e.clientX - bounds.x, y: e.clientY - bounds.y };
    };

    /* ── MOUSE DOWN ────────────────────────────────────── */

    const handleMouseDown = (e: MouseEvent) => {
      const tool  = useAppStore.getState().activeTool;
      const mouse = getMousePosition(e);

      if (tool === 'rectangle') {
        selectAnnotation(null);
        drawingStartPosition.current = mouse;
        isDrawingNewRect.current     = true;
        return;
      }

      if (tool === 'circle') {
        selectAnnotation(null);
        drawingStartPosition.current = mouse;
        isDrawingNewCircle.current   = true;
        return;
      }

      if (tool === 'select') {
        const currentlySelected = selectedAnnotationIndex.current;

        if (currentlySelected !== null) {
          const annotation = annotations.current[currentlySelected];
          const handle     = getHandleAtPoint(mouse, annotation);

          if (handle) {
            activeDragMode.current = handle;
          } else if (isPointInsideAnnotation(mouse, annotation)) {
            activeDragMode.current = 'move';
          } else {
            selectAnnotation(null);
            const clickedIndex = findAnnotationAtPoint(mouse, annotations.current);
            if (clickedIndex !== null) {
              selectAnnotation(clickedIndex);
              activeDragMode.current    = 'move';
              dragStartPosition.current = mouse;
              dragOriginal.current      = { ...annotations.current[clickedIndex] };
              setSelectedOverlay(null);
            }
            needsRedraw.current = true;
            return;
          }

          if (activeDragMode.current) {
            dragStartPosition.current = mouse;
            dragOriginal.current      = { ...annotations.current[currentlySelected] };
            setSelectedOverlay(null);
          }
        } else {
          const clickedIndex = findAnnotationAtPoint(mouse, annotations.current);
          if (clickedIndex !== null) {
            selectAnnotation(clickedIndex);
            activeDragMode.current    = 'move';
            dragStartPosition.current = mouse;
            dragOriginal.current      = { ...annotations.current[clickedIndex] };
            setSelectedOverlay(null);
          }
        }

        needsRedraw.current = true;
      }
    };

    /* ── MOUSE MOVE ────────────────────────────────────── */

    const handleMouseMove = (e: MouseEvent) => {
      const mouse = getMousePosition(e);
      const tool  = useAppStore.getState().activeTool;
      mousePosition.current = mouse;

      if (tool === 'rectangle') {
        canvas.style.cursor = 'crosshair';
        if (isDrawingNewRect.current) needsRedraw.current = true;
        return;
      }

      if (tool === 'circle') {
        canvas.style.cursor = 'crosshair';
        if (isDrawingNewCircle.current) needsRedraw.current = true;
        return;
      }

      if (tool === 'select') {
        const mode     = activeDragMode.current;
        const origin   = dragStartPosition.current;
        const original = dragOriginal.current;
        const selected = selectedAnnotationIndex.current;

        if (mode && origin && original && selected !== null) {
          const dx = mouse.x - origin.x;
          const dy = mouse.y - origin.y;
          annotations.current[selected] = applyDrag(original, dx, dy, mode);
          needsRedraw.current = true;
          return;
        }

        if (selected !== null) {
          const annotation = annotations.current[selected];
          const handle     = getHandleAtPoint(mouse, annotation);

          if (handle)                                       canvas.style.cursor = getCursorForHandle(handle);
          else if (isPointInsideAnnotation(mouse, annotation)) canvas.style.cursor = 'move';
          else                                              canvas.style.cursor = 'default';
        } else {
          canvas.style.cursor = 'default';
        }

        const hovered = findAnnotationAtPoint(mouse, annotations.current);
        if (hovered !== null && selected === null) canvas.style.cursor = 'pointer';
        if (hovered !== hoveredAnnotationIndex.current) {
          hoveredAnnotationIndex.current = hovered;
          needsRedraw.current = true;
        }
      }
    };

    /* ── MOUSE UP ──────────────────────────────────────── */

    const handleMouseUp = (e: MouseEvent) => {
      const tool = useAppStore.getState().activeTool;

      if (tool === 'rectangle' && isDrawingNewRect.current) {
        const endPosition   = getMousePosition(e);
        const startPosition = drawingStartPosition.current!;
        const tooSmall      = Math.abs(endPosition.x - startPosition.x) < 3
                           && Math.abs(endPosition.y - startPosition.y) < 3;

        isDrawingNewRect.current     = false;
        drawingStartPosition.current = null;

        if (tooSmall) { needsRedraw.current = true; return; }

        const newRect = normalizeAnnotation({
          type: 'rectangle',
          x1: startPosition.x, y1: startPosition.y,
          x2: endPosition.x,   y2: endPosition.y,
          label: '',
        });
        annotations.current.push(newRect);
        startLabelEditing(annotations.current.length - 1, '');
        draw();
        return;
      }

      if (tool === 'circle' && isDrawingNewCircle.current) {
        const endPosition = getMousePosition(e);
        const center      = drawingStartPosition.current!;
        const radius      = Math.sqrt(
          (endPosition.x - center.x) ** 2 + (endPosition.y - center.y) ** 2,
        );

        isDrawingNewCircle.current   = false;
        drawingStartPosition.current = null;

        if (radius < 3) { needsRedraw.current = true; return; }

        const newCircle: AnnotationCircle = {
          type: 'circle',
          cx: center.x, cy: center.y,
          radius,
          label: '',
        };
        annotations.current.push(newCircle);
        startLabelEditing(annotations.current.length - 1, '');
        draw();
        return;
      }

      if (tool === 'select' && activeDragMode.current) {
        if (selectedAnnotationIndex.current !== null) {
          annotations.current[selectedAnnotationIndex.current] =
            normalizeAnnotation(annotations.current[selectedAnnotationIndex.current]);
        }
        activeDragMode.current    = null;
        dragStartPosition.current = null;
        dragOriginal.current      = null;
        needsRedraw.current       = true;
        refreshSelectedOverlay();
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup',   handleMouseUp);

    /* ── load image ────────────────────────────────────── */

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = src;
    image.onload = () => {
      const container    = canvas.closest('.canvas-wrapper')! as HTMLElement;
      const maxWidth     = container.clientWidth - 32;
      const maxHeight    = container.clientHeight - 160;
      const scale        = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
      const dpr          = window.devicePixelRatio || 1;
      const logicalWidth  = Math.round(image.naturalWidth  * scale);
      const logicalHeight = Math.round(image.naturalHeight * scale);

      canvas.width        = logicalWidth  * dpr;
      canvas.height       = logicalHeight * dpr;
      canvas.style.width  = logicalWidth  + 'px';
      canvas.style.height = logicalHeight + 'px';

      canvasLogicalSize.current = { width: logicalWidth, height: logicalHeight };
      imageRef.current = image;

      setImageNaturalSize({ width: image.naturalWidth, height: image.naturalHeight });
      setImageScalePercent(scale * 100);

      annotations.current = restoreSession(src, logicalWidth, logicalHeight);
      draw();
    };

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [draw, selectAnnotation, startLabelEditing, refreshSelectedOverlay]);

  /* ── effects ───────────────────────────────────────────── */

  useEffect(() => {
    const loop = () => {
      if (needsRedraw.current) { draw(); needsRedraw.current = false; }
      animationFrameId.current = requestAnimationFrame(loop);
    };
    animationFrameId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [draw]);

  useEffect(() => setup(imageSrc), [imageSrc, setup]);

  useEffect(() => {
    const intervalId = setInterval(persist, 2000);
    return () => clearInterval(intervalId);
  }, [persist]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'Escape') {
        selectAnnotation(null);
        startLabelEditing(null);
        needsRedraw.current = true;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationIndex.current !== null) {
        annotations.current.splice(selectedAnnotationIndex.current, 1);
        selectAnnotation(null);
        startLabelEditing(null);
        needsRedraw.current = true;
        persist();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [persist, selectAnnotation, startLabelEditing]);

  /* ── label editing ─────────────────────────────────────── */

  const submitLabel = useCallback(() => {
    if (editingLabelIndex === null) return;

    const index   = editingLabelIndex;
    const trimmed = labelInputText.trim();

    // If the label is empty after editing, delete the annotation instead of keeping an unlabeled shape.
    if (!trimmed) {
      annotations.current.splice(index, 1);

      const selected = selectedAnnotationIndex.current;
      if (selected !== null) {
        if (selected === index) {
          selectAnnotation(null);
        } else if (selected > index) {
          selectedAnnotationIndex.current = selected - 1;
        }
      }

      const hovered = hoveredAnnotationIndex.current;
      if (hovered !== null) {
        if (hovered === index) {
          hoveredAnnotationIndex.current = null;
        } else if (hovered > index) {
          hoveredAnnotationIndex.current = hovered - 1;
        }
      }

      startLabelEditing(null);
      needsRedraw.current = true;
      draw();
      persist();
      return;
    }

    annotations.current[index].label = trimmed;
    startLabelEditing(null);
    refreshSelectedOverlay();
    draw();
    persist();
    useAppStore.getState().triggerTutorial();
  }, [
    draw,
    editingLabelIndex,
    labelInputText,
    persist,
    refreshSelectedOverlay,
    selectAnnotation,
    startLabelEditing,
  ]);

  const openLabelEditor = useCallback(() => {
    const index = selectedAnnotationIndex.current;
    if (index === null) return;
    startLabelEditing(index, annotations.current[index]?.label || '');
  }, [startLabelEditing]);

  /* ── compute overlay positions ─────────────────────────── */

  const selectedBounds = selectedOverlay ? getAnnotationBounds(selectedOverlay) : null;
  const editingBounds  = editingOverlay  ? getAnnotationBounds(editingOverlay)  : null;

  /* ── render ────────────────────────────────────────────── */

  return (
    <div className="canvas-wrapper">

      <div className="canvas-container">
        <canvas ref={canvasRef} />

        {selectedBounds && editingLabelIndex === null && (
          <button
            className="canvas-edit-label-btn"
            style={{
              left: selectedBounds.left,
              top:  selectedBounds.top - 22,
            }}
            onClick={openLabelEditor}
          >
            {selectedOverlay!.label || 'Add label'}
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </button>
        )}

        {editingBounds && editingLabelIndex !== null && (
          <input
            className="canvas-inline-label"
            style={{
              left: editingBounds.left,
              top:  editingBounds.top - 22,
            }}
            type="text"
            placeholder="Label"
            value={labelInputText}
            onChange={(e) => setLabelInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitLabel();
              if (e.key === 'Escape') startLabelEditing(null);
            }}
            onBlur={submitLabel}
            autoFocus
          />
        )}
      </div>

      <div className="canvas-meta">
        <span>{imageNaturalSize.width} × {imageNaturalSize.height}px</span>
        <span className="canvas-meta__divider" />
        <span>{imageScalePercent.toFixed(0)}%</span>
      </div>
    </div>
  );
}
