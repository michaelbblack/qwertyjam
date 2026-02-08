import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/store';
import { NoteHighway } from './NoteHighway';
import { Keyboard } from './Keyboard';
import { HUD } from './HUD';

export function GameScreen() {
  const gameState = useGameStore(s => s.gameState);
  const countdownValue = useGameStore(s => s.countdownValue);
  const selectedSong = useGameStore(s => s.selectedSong);
  const returnToMenu = useGameStore(s => s.returnToMenu);
  const metronome = useGameStore(s => s.metronome);
  const toggleMetronome = useGameStore(s => s.toggleMetronome);

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"JetBrains Mono", monospace',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            {selectedSong?.title}
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '12px' }}>
            {selectedSong?.artist}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={toggleMetronome}
            style={{
              background: metronome ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${metronome ? '#60a5fa' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '6px',
              padding: '6px 14px',
              color: metronome ? '#60a5fa' : 'rgba(255,255,255,0.5)',
              fontSize: '11px',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Metronome {metronome ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={returnToMenu}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              padding: '6px 14px',
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Quit
          </button>
        </div>
      </div>

      {/* HUD */}
      <HUD />

      {/* Note Highway */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
        <NoteHighway />

        {/* Keyboard */}
        <Keyboard />
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {(gameState === 'countdown' || gameState === 'loading') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(10,14,26,0.85)',
              zIndex: 100,
            }}
          >
            {countdownValue !== null ? (
              <motion.div
                key={countdownValue}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  fontSize: '96px',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                {countdownValue}
              </motion.div>
            ) : (
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>
                Loading...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
