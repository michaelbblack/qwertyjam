import { motion } from 'framer-motion';
import { useGameStore } from '../game/store';

export function TitleScreen() {
  const setScreen = useGameStore(s => s.setScreen);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '"JetBrains Mono", monospace',
      padding: '20px',
    }}>
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ textAlign: 'center', marginBottom: '16px' }}
      >
        <h1 style={{
          fontSize: '72px',
          fontWeight: 800,
          margin: 0,
          background: 'linear-gradient(135deg, #60a5fa, #c084fc, #f472b6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-2px',
          lineHeight: 1,
        }}>
          KEYTAR
        </h1>
        <div style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '8px',
          textTransform: 'uppercase',
          marginTop: '8px',
        }}>
          Musical Typing
        </div>
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: '14px',
          maxWidth: '400px',
          textAlign: 'center',
          lineHeight: 1.6,
          marginBottom: '48px',
        }}
      >
        Your keyboard is an instrument. Type melodies from your favorite songs.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '260px' }}
      >
        <button
          onClick={() => setScreen('songSelect')}
          style={{
            background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
            border: 'none',
            borderRadius: '12px',
            padding: '18px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          PLAY
        </button>
      </motion.div>

      {/* Keyboard hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        style={{
          marginTop: '64px',
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}
      >
        {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K'].map((key, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.4, y: 0 }}
            transition={{ delay: 1 + i * 0.05 }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
            }}
          >
            {key}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
