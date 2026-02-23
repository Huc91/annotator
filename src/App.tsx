import './App.css';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas/Canvas';
import { LabelModal } from './components/LabelModal';

export default function App() {
  return (
    <div className="app">
      <div className="app__toolbar"><Toolbar /></div>
      <div className="app__canvas"><Canvas /></div>
      <LabelModal />
    </div>
  );
}
