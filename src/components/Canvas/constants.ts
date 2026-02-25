export const HANDLE_SIZE      = 8;
export const HANDLE_HALF_SIZE = HANDLE_SIZE / 2;
export const HANDLE_HIT_TOLERANCE = HANDLE_HALF_SIZE + 2;

export const STORAGE_KEY = 'annotator-session';

export const LABEL_BADGE_HEIGHT  = 20;
export const LABEL_BADGE_PADDING = 6;
export const LABEL_BADGE_RADIUS  = 4;
export const LABEL_FONT          = '12px sans-serif';

export const COLORS = {
  selected:      '#0000FF',
  annotation:    '#673ab7',
  handleFill:    '#ffffff',
  hoverOverlay:  'rgba(103, 58, 183, 0.1)',
  labelText:     '#ffffff',
  previewCorner: '#ffffff',
} as const;
