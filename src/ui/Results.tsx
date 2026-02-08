import { useMemo } from 'react';
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

export function Results() {
  const getResults = useGameStore(s => s.getResults);
  const returnToMenu = useGameStore(s => s.returnToMenu);
  const selectSong = useGameStore(s => s.selectSong);
  const startGame = useGameStore(s => s.startGame);

  const results = useMemo(() => getResults(), [getResults]);

  if (!results) return null;

  const { song, layerIndex, score, grade, speed } = results;
  const gradeColor = GRADE_COLORS[grade];

  const handleRetry = async () => {
    selectSong(song, layerIndex);
    await startGame();
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '60px 20px',
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
          margin: '40px auto',
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

      {/* Score */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ fontSize: '40px', fontWeight: 800, color: '#fff' }}>
          {score.score.toLocaleString()}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>
          POINTS
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '32px',
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
          marginBottom: '40px',
        }}
      >
        <StatBox label="Accuracy" value={`${score.accuracy.toFixed(1)}%`} color="#c084fc" />
        <StatBox label="Max Combo" value={score.maxCombo} color="#f59e0b" />
        <StatBox label="Total Notes" value={score.totalNotes} color="rgba(255,255,255,0.5)" />
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
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
