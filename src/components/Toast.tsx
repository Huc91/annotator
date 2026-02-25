import { useAppStore } from '../store';
import './Toast.css';

export function Toast() {
  const message = useAppStore((s) => s.toastMessage);
  if (!message) return null;

  return <div className="toast" role="alert">{message}</div>;
}
