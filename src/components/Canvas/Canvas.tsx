import { useEffect, useRef, useState, useCallback } from 'react';
import { ImageUpload } from '../ImageUpload';
import './Canvas.css';

const DEFAULT_IMAGE = 'https://picsum.photos/seed/annotator/900/600';

export function Canvas() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const imgRef         = useRef<HTMLImageElement | null>(null);
  const mouseCoordsRef = useRef({ x: 0, y: 0 });
  const startClick     = useRef<{ x: number; y: number } | null>(null);
  const isDrawing      = useRef(false);
  const isDirty        = useRef(false);
  const rafRef         = useRef<number>(0);
  const rects          = useRef<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const [imageSrc, setImageSrc]                 = useState(DEFAULT_IMAGE);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale]             = useState(100);

  const draw = useCallback(() => {
    console.log('draw');
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    if (isDrawing.current && startClick.current) {
      const { x: x1, y: y1 } = startClick.current;
      const { x: x2, y: y2 } = mouseCoordsRef.current;
      ctx.strokeStyle = '#673ab7';
      ctx.lineWidth   = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    rects.current.forEach(({ x1, y1, x2, y2 }) => {
      ctx.strokeStyle = '#673ab7';
      ctx.lineWidth   = 2;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    });
  }, []);

  const setup = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.x, y: e.clientY - rect.y };
    };

    const handleMouseDown = (e: MouseEvent) => {
      startClick.current = getPos(e);
      isDrawing.current  = true;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseCoordsRef.current = getPos(e);
      // like in games if something changed, is dirty, need rerender
      if (isDrawing.current) isDirty.current = true;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawing.current) return;
      mouseCoordsRef.current = getPos(e);
      const end = getPos(e);
      rects.current.push({ x1: startClick.current!.x, y1: startClick.current!.y, x2: end.x, y2: end.y });
      isDrawing.current  = false;
      startClick.current = null;
      draw();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup',   handleMouseUp);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const container = canvas.parentElement!;
      const maxW  = container.clientWidth - 32;
      const maxH  = container.clientHeight - 160;
      const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);

      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      imgRef.current = img;
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageScale(scale * 100);

      draw();
    };

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup',   handleMouseUp);
    };
  }, [draw]);

  useEffect(() => {
    const loop = () => {
      if (isDirty.current) {
        draw();
        isDirty.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  useEffect(() => {
    const cleanup = setup(imageSrc);
    return cleanup;
  }, [imageSrc, setup]);

  return (
    <div className="canvas-wrapper">
      <ImageUpload onUpload={setImageSrc} />
      <canvas ref={canvasRef} />
      <div className="canvas-meta">
        <span>{imageNaturalSize.width} × {imageNaturalSize.height}px</span>
        <span className="canvas-meta__divider" />
        <span>{imageScale.toFixed(0)}%</span>
      </div>
    </div>
  );
}
