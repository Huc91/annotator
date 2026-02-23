import { useEffect, useRef, useState } from 'react';
import { ImageUpload } from '../ImageUpload';
import './Canvas.css';

const DEFAULT_IMAGE = 'https://picsum.photos/seed/annotator/900/600';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState(DEFAULT_IMAGE);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
  }, [imageSrc]);

  return (
    <div className="canvas-wrapper">
      <ImageUpload onUpload={setImageSrc} />
      <canvas ref={canvasRef} />
    </div>
  );
}
