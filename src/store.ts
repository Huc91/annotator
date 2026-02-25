import { create } from 'zustand';
import type { ToolType } from './types';

const DEFAULT_IMAGE_URL = 'https://picsum.photos/seed/picsum/900/600';
const STORAGE_KEY = 'annotator-session';

function getSavedImageSrc(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.imageSrc) return data.imageSrc;
    }
  } catch { /* ignore */ }
  return DEFAULT_IMAGE_URL;
}

const TUTORIAL_SEEN_KEY = 'annotator-tutorial-seen';

interface AppState {
  activeTool: ToolType;
  setActiveTool: (tool: ToolType) => void;
  imageSrc: string;
  setImageSrc: (src: string) => void;
  showTutorial: boolean;
  triggerTutorial: () => void;
  dismissTutorial: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTool: 'rectangle',
  setActiveTool: (tool) => set({ activeTool: tool }),
  imageSrc: getSavedImageSrc(),
  setImageSrc: (src) => set({ imageSrc: src }),
  showTutorial: false,
  triggerTutorial: () => {
    if (localStorage.getItem(TUTORIAL_SEEN_KEY)) return;
    set({ showTutorial: true });
  },
  dismissTutorial: () => {
    localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    set({ showTutorial: false });
  },
}));
