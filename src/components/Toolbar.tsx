import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { ImageUploadModal } from './ImageUploadModal';
import type { ToolType } from '../types';
import './Toolbar.css';

export function Toolbar() {
  const activeTool    = useAppStore((s) => s.activeTool);
  const setActiveTool = useAppStore((s) => s.setActiveTool);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'r' || e.key === 'R') setActiveTool('rectangle');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setActiveTool]);

  const toolBtn = (tool: ToolType, label: string, icon: React.ReactNode, disabled = false) => (
    <button
      className={`toolbar__btn ${activeTool === tool ? 'toolbar__btn--active' : ''}`}
      onClick={() => !disabled && setActiveTool(tool)}
      title={label}
      disabled={disabled}
    >
      {icon}
    </button>
  );

  return (
    <>
      <div className="toolbar">
        {toolBtn('select', 'Select (V)',
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M7 2l10 10-4 1 3 5.5-2.5 1.5-3-5.5-3.5 3z" />
          </svg>,
        )}
        {toolBtn('rectangle', 'Rectangle (R)',
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="1" />
          </svg>,
        )}
        {toolBtn('circle', 'Circle (coming soon)',
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>,
          true,
        )}

        <div className="toolbar__separator" />

        <button
          className="toolbar__btn"
          title="Change image"
          onClick={() => setImageModalOpen(true)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </button>
      </div>

      <ImageUploadModal open={imageModalOpen} onClose={() => setImageModalOpen(false)} />
    </>
  );
}
