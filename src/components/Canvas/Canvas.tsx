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
  type RectWithLabel = { x1: number; y1: number; x2: number; y2: number; label: string };
  const rects = useRef<RectWithLabel[]>([]);

  const [imageSrc, setImageSrc]                 = useState(DEFAULT_IMAGE);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale]             = useState(100);
  const [pendingLabel, setPendingLabel]         = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [labelInput, setLabelInput]             = useState('');

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
      ctx.strokeStyle = '#0000FF';
      ctx.lineWidth   = 1;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

      ctx.beginPath();
      ctx.rect(x1 - 2, y1 - 2, 4, 4);
      ctx.rect(x2 - 2, y2 - 2, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
    }

    rects.current.forEach(({ x1, y1, x2, y2, label }) => {
      ctx.strokeStyle = '#673ab7';
      ctx.lineWidth   = 1;
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      if (label) {
        ctx.font         = '12px sans-serif';
        ctx.fillStyle    = '#673ab7';
        ctx.textBaseline = 'bottom';
        ctx.fillText(label, x1, y1 - 4);
      }
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
      const x1 = startClick.current!.x;
      const y1 = startClick.current!.y;
      setPendingLabel({ x1, y1, x2: end.x, y2: end.y });
      setLabelInput('');
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
      const container = canvas.closest('.canvas-wrapper')! as HTMLElement;
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

  const submitLabel = () => {
    if (!pendingLabel) return;
    rects.current.push({ ...pendingLabel, label: labelInput.trim() });
    setPendingLabel(null);
    setLabelInput('');
    draw();
  };

  return (
    <div className="canvas-wrapper">
      <ImageUpload onUpload={setImageSrc} />
      <div className="canvas-container">
        <canvas ref={canvasRef} />
        {pendingLabel && (
          <input
            className="canvas-inline-label"
            style={{
              left: Math.min(pendingLabel.x1, pendingLabel.x2),
              top:  Math.min(pendingLabel.y1, pendingLabel.y2) - 28,
            }}
            type="text"
            placeholder="Label"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitLabel()}
            onBlur={submitLabel}
            autoFocus
          />
        )}
      </div>
      <div className="canvas-meta">
        <span>{imageNaturalSize.width} × {imageNaturalSize.height}px</span>
        <span className="canvas-meta__divider" />
        <span>{imageScale.toFixed(0)}%</span>
      </div>
    </div>
  );
}
