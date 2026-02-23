import { useEffect, useRef, useState, useCallback } from 'react';
import { ImageUpload } from '../ImageUpload';
import './Canvas.css';

const DEFAULT_IMAGE = 'https://picsum.photos/seed/annotator/900/600';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);

  const [imageSrc, setImageSrc]           = useState(DEFAULT_IMAGE);
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale]       = useState(100);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // TODO: draw annotations here
    ctx.beginPath(); // Start a new path
    ctx.rect(10, 20, 150, 100); // Add a rectangle to the current path
    ctx.fill(); // Render the path
    ctx.closePath(); // Close the path
  }, []);

  const setup = useCallback((src: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const container = canvas.parentElement!;
      const maxW  = container.clientWidth - 32;
      const maxH  = container.clientHeight - 160;
      const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);

      canvas.width  = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);

      imgRef.current = img;
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageScale(scale * 100);

      draw();
    };
  }, [draw]);

  useEffect(() => { setup(imageSrc); }, [imageSrc, setup]);

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
