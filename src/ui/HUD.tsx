import { useGameStore } from '../game/store';
import { motion, AnimatePresence } from 'framer-motion';

const GRADE_COLORS = {
  perfect: '#34d399',
  great: '#60a5fa',
  good: '#fbbf24',
  miss: '#ef4444',
};

export function HUD() {
  const scoreState = useGameStore(s => s.scoreState);
  const lastGrade = useGameStore(s => s.lastGrade);
  const lastDeltaMs = useGameStore(s => s.lastDeltaMs);
  const controller = useGameStore(s => s.controller);
  const gameState = useGameStore(s => s.gameState);

  if (!scoreState && gameState !== 'playing') return null;

  const score = scoreState?.score ?? 0;
  const combo = scoreState?.combo ?? 0;
  const accuracy = scoreState?.accuracy ?? 100;
  const multiplier = controller.scoreEngine.getComboMultiplierValue();
  const fever = combo >= 25;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 24px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Score */}
      <div style={{ textAlign: 'left' }}>
        <div style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          Score
        </div>
        <div style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#fff',
          lineHeight: 1,
        }}>
          {score.toLocaleString()}
        </div>
      </div>

      {/* Grade flash */}
      <div style={{ position: 'relative', width: '120px', textAlign: 'center' }}>
        <AnimatePresence mode="wait">
          {lastGrade && (
            <motion.div
              key={`${lastGrade}-${Date.now()}`}
              initial={{ scale: 1.5, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: lastGrade === 'miss' && lastDeltaMs !== null ? '16px' : '20px',
                fontWeight: 800,
                color: lastGrade === 'miss' && lastDeltaMs !== null ? '#f97316' : (GRADE_COLORS[lastGrade] || '#fff'),
                textTransform: 'uppercase',
              }}
            >
              {/* Off-time press (has a delta) reads TOO EARLY/LATE; a timed-out note reads MISS */}
              {lastGrade === 'miss' && lastDeltaMs !== null
                ? (lastDeltaMs < 0 ? 'Too Early' : 'Too Late')
                : lastGrade}
              {lastDeltaMs !== null && Math.abs(lastDeltaMs) > 25 && (
                <div style={{
                  fontSize: '9px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '1px',
                  marginTop: '2px',
                }}>
                  {lastDeltaMs < 0 ? `${Math.abs(Math.round(lastDeltaMs))}ms EARLY` : `${Math.round(lastDeltaMs)}ms LATE`}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Combo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '10px',
          color: fever ? '#c084fc' : 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          {fever ? '⚡ Fever' : 'Combo'}
        </div>
        <motion.div
          animate={fever ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={fever ? { repeat: Infinity, duration: 0.6 } : undefined}
          style={{
            fontSize: '28px',
            fontWeight: 800,
            color: combo >= 50 ? '#f59e0b' : combo >= 25 ? '#c084fc' : combo >= 10 ? '#60a5fa' : '#fff',
            lineHeight: 1,
          }}
        >
          {combo}
          {multiplier > 1 && (
            <span style={{ fontSize: '14px', color: '#c084fc', marginLeft: '4px' }}>
              x{multiplier}
            </span>
          )}
        </motion.div>
      </div>

      {/* Accuracy */}
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
        }}>
          Accuracy
        </div>
        <div style={{
          fontSize: '28px',
          fontWeight: 800,
          color: accuracy >= 90 ? '#34d399' : accuracy >= 70 ? '#fbbf24' : '#ef4444',
          lineHeight: 1,
        }}>
          {accuracy.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
