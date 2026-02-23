import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { LabelModal } from './components/LabelModal';

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Toolbar />
      <Canvas />
      <LabelModal />
    </div>
  );
}
