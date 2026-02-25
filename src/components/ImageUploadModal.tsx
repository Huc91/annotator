import { useRef } from 'react';
import { useAppStore } from '../store';
import './ImageUploadModal.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ImageUploadModal({ open, onClose }: Props) {
  const setImageSrc = useAppStore((s) => s.setImageSrc);
  const urlInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageSrc(URL.createObjectURL(file));
    onClose();
  };

  const handleUrl = () => {
    const url = urlInputRef.current?.value.trim();
    if (!url) return;
    setImageSrc(url);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__title">Choose image</h3>

        <label className="modal__file-label">
          Upload from file
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>

        <div className="modal__divider">or</div>

        <div className="modal__url-row">
          <input
            ref={urlInputRef}
            className="modal__url-input"
            type="text"
            placeholder="Paste image URL"
            onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
          />
          <button className="modal__url-btn" onClick={handleUrl}>Load</button>
        </div>

        <button className="modal__close" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
