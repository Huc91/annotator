import './App.css';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas/Canvas';
import { TutorialToast } from './components/TutorialToast';
import { Toast } from './components/Toast';

export default function App() {
  return (
    <div className="app">
      <div className="app__canvas"><Canvas /></div>
      <div className="app__toolbar"><Toolbar /></div>
      <TutorialToast />
      <Toast />
    </div>
  );
}
