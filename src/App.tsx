import './App.css';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas/Canvas';
import { LabelModal } from './components/LabelModal';

export default function App() {
  return (
    <div className="app">
      <h1>Annotator</h1>
      <div className="app__canvas"><Canvas /></div>
      <div className="app__toolbar"><Toolbar /></div>
      <LabelModal />
    </div>
  );
}
