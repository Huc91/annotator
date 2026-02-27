# :black_nib: Image Annotator

A browser-based image annotation tool built with React, TypeScript and Canvas 2D.

## Main Features

- **Rectangle annotations** — click and drag to draw a bounding box
- **Circle annotations** — click to set the center, drag to set the radius
- **Select & edit** — click an annotation to select it, then drag handles to resize or the center handle to move it
- **Labels** — after drawing a shape you're prompted for a label; click the label badge on a selected annotation to edit it
- **Hover highlighting** — annotations light up on mouse hover when the select tool is active
- **Image upload** — load any image from your file system

## Extra Features

- **Keyboard shortcuts** — V (select), R (rectangle), C (circle), Escape (deselect), Delete/Backspace (remove)
- **Auto-save** — session is persisted to localStorage every 2 seconds and restored on reload
- **CSV export** — download all annotations as a CSV with normalised coordinates
- **Image upload bu URL** — load image by URL
- **High-DPI rendering** — canvas scales to `devicePixelRatio` for sharp output on Retina displays

## Getting started

```bash
npm install
npm run dev
```

## Running tests

This project uses **Vitest** for unit tests.

```bash
npm test
```

## Architecture

### Stack

React 19, TypeScript, Vite, Zustand (state), HTML Canvas 2D.

### Why refs instead of React state for annotations?

Dragging a handle fires `mousemove` 60+ times per second. If each event triggered `setState` and a React re-render, the UI would be sluggish. Instead:

- Annotation data lives in a `useRef` mutated directly during user interaction
- A `needsRedraw` flag tells a `requestAnimationFrame` loop when to repaint the canvas
- React state is only updated when the user finishes an action (selects, stops dragging, edits a label) to position the HTML overlay elements (label button, text input)

This way I do not trigger continuosly a React re-render.

### Choices and philosophy

I thought of this like a videogame, so I used a kind of hitboxes concept for selection, the animation frame to render etc...
I have splitted the most important pieces of code into multiple parts.
Files inside Canvas directory:

```
  types.ts        — TS types
  constants.ts    — colors, sizes, localStorage key
  geometry.ts     — hit testing, drag math, bounding boxes (pure functions)
  drawing.ts      — canvas 2D rendering: previews, shapes, handles, labels
  persistence.ts  — normalise to [0..1], save/restore localStorage, CSV export
  Canvas.tsx      — orchestrator: owns refs, event loop, mouse handlers, React overlays
```

for example `geometry.ts` and `drawing.ts` are pure and testable in isolation. 
All imperative "glue" is confined to `Canvas.tsx`.

### Normalised coordinates

Annotations are stored in normalised image coordinates (0 to 1). You can export them in csv format so this app can communicate with other apps.
