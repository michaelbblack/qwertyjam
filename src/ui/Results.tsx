import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../game/store';
import type { LetterGrade } from '../engine/ScoreEngine';

const GRADE_COLORS: Record<LetterGrade, string> = {
  S: '#fbbf24',
  A: '#34d399',
  B: '#60a5fa',
  C: '#c084fc',
  D: '#f97316',
  F: '#ef4444',
};

const GRADE_LABELS: Record<LetterGrade, string> = {
  S: 'SUPERSTAR',
  A: 'AMAZING',
  B: 'BRILLIANT',
  C: 'COOL',
  D: 'DECENT',
  F: 'FAILED',
};

const TIMELINE_COLORS: Record<string, string> = {
  perfect: '#34d399',
  great: '#60a5fa',
  good: '#fbbf24',
  miss: '#ef4444',
};

// Animate a number from 0 to target after an initial delay
function useCountUp(target: number, delayMs: number, durationMs = 1100): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts;
        const t = Math.min(1, (ts - start) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(target * eased));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delayMs, durationMs]);
  return value;
}

export function Results() {
  const getResults = useGameStore(s => s.getResults);
  const returnToMenu = useGameStore(s => s.returnToMenu);
  const selectSong = useGameStore(s => s.selectSong);
  const startGame = useGameStore(s => s.startGame);
  const recordInfo = useGameStore(s => s.recordInfo);
  const progressInfo = useGameStore(s => s.progressInfo);

  const results = useMemo(() => getResults(), [getResults]);
  const displayScore = useCountUp(results?.score.score ?? 0, 600);

  if (!results) return null;

  const { song, layerIndex, score, grade, speed, timeline, duration } = results;
  const gradeColor = GRADE_COLORS[grade];
  const fullCombo = score.misses === 0 && score.totalNotes > 0;
  const newRecord = !!recordInfo && !recordInfo.firstPlay && recordInfo.newBestScore;
  const leveledUp = !!progressInfo && progressInfo.levelAfter > progressInfo.levelBefore;

  const handleRetry = async () => {
    selectSong(song, layerIndex);
    await startGame();
  };

  return (
    <div style={{
      maxWidth: '620px',
      margin: '0 auto',
      padding: '48px 20px 60px',
      fontFamily: '"JetBrains Mono", monospace',
      textAlign: 'center',
    }}>
      {/* Song info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
          {song.layers[layerIndex].name} {speed !== 1 && `@ ${speed.toFixed(2)}x`}
        </div>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#fff' }}>
          {song.title}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          {song.artist}
        </p>
      </motion.div>

      {/* Grade */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
        style={{
          margin: '32px auto 24px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          border: `3px solid ${gradeColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${gradeColor}10`,
          boxShadow: `0 0 40px ${gradeColor}30`,
        }}
      >
        <div style={{ fontSize: '56px', fontWeight: 800, color: gradeColor, lineHeight: 1 }}>
          {grade}
        </div>
        <div style={{ fontSize: '10px', color: gradeColor, letterSpacing: '2px', marginTop: '4px' }}>
          {GRADE_LABELS[grade]}
        </div>
      </motion.div>

      {/* Badges */}
      {(fullCombo || newRecord) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.55, type: 'spring', stiffness: 300 }}
          style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}
        >
          {newRecord && (
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#34d399',
              border: '1px solid #34d39960',
              background: '#34d39915',
              borderRadius: '6px',
              padding: '6px 14px',
              letterSpacing: '2px',
            }}>
              ★ NEW RECORD
            </span>
          )}
          {fullCombo && (
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#f59e0b',
              border: '1px solid #f59e0b60',
              background: '#f59e0b15',
              borderRadius: '6px',
              padding: '6px 14px',
              letterSpacing: '2px',
            }}>
              ⚡ FULL COMBO
            </span>
          )}
        </motion.div>
      )}

      {/* Score count-up */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ marginBottom: '24px' }}
      >
        <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
          {displayScore.toLocaleString()}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>
          POINTS
        </div>
        {recordInfo && !recordInfo.newBestScore && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
            Best: {recordInfo.record.score.toLocaleString()}
          </div>
        )}
      </motion.div>

      {/* Performance timeline */}
      {timeline.length > 0 && duration > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ marginBottom: '28px' }}
        >
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px', textAlign: 'left' }}>
            Timeline
          </div>
          <div style={{
            position: 'relative',
            height: '36px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            {timeline.map((n, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${Math.min(99, (n.time / duration) * 100)}%`,
                  top: n.grade === 'miss' ? '55%' : '20%',
                  width: '3px',
                  height: '25%',
                  borderRadius: '2px',
                  background: n.grade ? TIMELINE_COLORS[n.grade] : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <StatBox label="Perfect" value={score.perfects} color="#34d399" />
        <StatBox label="Great" value={score.greats} color="#60a5fa" />
        <StatBox label="Good" value={score.goods} color="#fbbf24" />
        <StatBox label="Miss" value={score.misses} color="#ef4444" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <StatBox label="Accuracy" value={`${score.accuracy.toFixed(1)}%`} color="#c084fc" />
        <StatBox label="Max Combo" value={score.maxCombo} color="#f59e0b" />
        <StatBox label="Total Notes" value={score.totalNotes} color="rgba(255,255,255,0.5)" />
      </motion.div>

      {/* XP bar */}
      {progressInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#c084fc' }}>
              +{progressInfo.xpGained} XP
            </span>
            <span style={{ fontSize: '11px', color: leveledUp ? '#fbbf24' : 'rgba(255,255,255,0.4)', fontWeight: leveledUp ? 800 : 400 }}>
              {leveledUp
                ? `🆙 LEVEL UP! ${progressInfo.levelBefore} → ${progressInfo.levelAfter}`
                : `Level ${progressInfo.levelAfter}`}
            </span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressInfo.levelInfo.progress * 100}%` }}
              transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
                borderRadius: '4px',
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}
      >
        <button
          onClick={returnToMenu}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '10px',
            padding: '14px 28px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Song Select
        </button>
        <button
          onClick={handleRetry}
          style={{
            background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 28px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </motion.div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '10px',
      padding: '14px 8px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color }}>
        {value}
      </div>
      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}
