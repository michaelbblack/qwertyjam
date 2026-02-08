import { useGameStore } from './game/store';
import { TitleScreen } from './ui/TitleScreen';
import { SongSelect } from './ui/SongSelect';
import { GameScreen } from './ui/GameScreen';
import { Results } from './ui/Results';

function App() {
  const screen = useGameStore(s => s.screen);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#fff' }}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'songSelect' && <SongSelect />}
      {screen === 'game' && <GameScreen />}
      {screen === 'results' && <Results />}
    </div>
  );
}

export default App;
