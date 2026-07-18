import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../game/store';
import { loadProgress, getLevelInfo, ACHIEVEMENTS } from '../game/progression';
import { SONG_LIBRARY } from '../data/songs';

function formatPlayTime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

export function Profile() {
  const setScreen = useGameStore(s => s.setScreen);

  const progress = useMemo(() => loadProgress(), []);
  const levelInfo = getLevelInfo(progress.xp);
  const stats = progress.stats;
  const unlockedCount = Object.keys(progress.achievements).length;

  const totalHits = stats.perfects + stats.greats + stats.goods;
  const lifetimeAccuracy = totalHits + stats.misses > 0
    ? ((stats.perfects * 100 + stats.greats * 75 + stats.goods * 50) / (totalHits + stats.misses))
    : 0;

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      padding: '40px 20px 60px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <button
          onClick={() => setScreen('title')}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.6)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '13px',
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '2px' }}>
          PROFILE
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(192,132,252,0.08))',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{
          width: '84px',
          height: '84px',
          borderRadius: '50%',
          border: '3px solid #c084fc',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(192,132,252,0.1)',
          boxShadow: '0 0 30px rgba(192,132,252,0.2)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#c084fc', lineHeight: 1 }}>
            {levelInfo.level}
          </div>
          <div style={{ fontSize: '8px', color: '#c084fc', letterSpacing: '1px', marginTop: '2px' }}>
            LEVEL
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            <span>{progress.xp.toLocaleString()} XP total</span>
            <span>{levelInfo.intoLevel.toLocaleString()} / {levelInfo.neededForNext.toLocaleString()} to level {levelInfo.level + 1}</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #60a5fa, #c084fc)',
                borderRadius: '5px',
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* Lifetime stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          marginBottom: '24px',
        }}
      >
        <Stat label="Plays" value={stats.plays} />
        <Stat label="Notes Hit" value={stats.notesHit.toLocaleString()} />
        <Stat label="Best Combo" value={stats.bestCombo} />
        <Stat label="Play Time" value={formatPlayTime(stats.playTimeSec)} />
        <Stat label="Songs Tried" value={`${stats.songsPlayed.length}/${SONG_LIBRARY.length}`} />
        <Stat label="Lifetime Acc" value={`${lifetimeAccuracy.toFixed(1)}%`} />
        <Stat label="Full Combos" value={stats.fullCombos} />
        <Stat label="S Ranks" value={stats.sRanks} />
      </motion.div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Achievements
          </h2>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            {unlockedCount} / {ACHIEVEMENTS.length}
          </span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px',
        }}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = !!progress.achievements[ach.id];
            return (
              <div
                key={ach.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: unlocked ? 'rgba(192,132,252,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${unlocked ? 'rgba(192,132,252,0.35)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  opacity: unlocked ? 1 : 0.55,
                }}
              >
                <div style={{
                  fontSize: '20px',
                  filter: unlocked ? 'none' : 'grayscale(1)',
                }}>
                  {ach.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: unlocked ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                    {ach.name}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    {ach.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      padding: '14px 10px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{value}</div>
      <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}
