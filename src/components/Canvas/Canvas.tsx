import { useEffect, useRef, useState } from 'react';
import { ImageUpload } from '../ImageUpload';
import './Canvas.css';

const DEFAULT_IMAGE = 'https://picsum.photos/seed/annotator/900/600';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState(DEFAULT_IMAGE);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [imageScale, setImageScale] = useState(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const container = canvas.parentElement!;
      const maxW = container.clientWidth - 32;
      const maxH = container.clientHeight - 160;
      const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setCanvasSize({ width: canvas.width, height: canvas.height });
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageScale(scale * 100);
    };
  }, [imageSrc]);

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
