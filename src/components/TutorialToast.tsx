import { useAppStore } from '../store';
import './TutorialToast.css';

export function TutorialToast() {
  const show    = useAppStore((s) => s.showTutorial);
  const dismiss = useAppStore((s) => s.dismissTutorial);

  if (!show) return null;

  return (
    <div className="tutorial-toast">
      <p className="tutorial-toast__title">Keyboard shortcuts</p>
      <ul className="tutorial-toast__list">
        <li><kbd>V</kbd> Select tool</li>
        <li><kbd>R</kbd> Rectangle tool</li>
        <li><kbd>C</kbd> Circle tool</li>
        <li><kbd>Backspace</kbd> Delete selected</li>
        <li><kbd>Esc</kbd> Deselect</li>
      </ul>
      <button className="tutorial-toast__dismiss" onClick={dismiss}>Got it</button>
    </div>
  );
}
