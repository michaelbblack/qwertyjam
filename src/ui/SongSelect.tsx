import { useState, useMemo } from 'react';
import { SONG_LIBRARY } from '../data/songs';
import { useGameStore } from '../game/store';
import { getRecord, getBestGradeForSong } from '../game/records';
import type { Song } from '../data/songs/types';
import type { LetterGrade } from '../engine/ScoreEngine';

const DIFFICULTY_STARS = ['', '\u2605', '\u2605\u2605', '\u2605\u2605\u2605', '\u2605\u2605\u2605\u2605', '\u2605\u2605\u2605\u2605\u2605'];

const GENRE_COLORS: Record<string, string> = {
  'Rock': '#ef4444',
  'Classical': '#c084fc',
  'Hip-Hop': '#fbbf24',
  'Alternative': '#34d399',
};

const GRADE_COLORS: Record<LetterGrade, string> = {
  S: '#fbbf24',
  A: '#34d399',
  B: '#60a5fa',
  C: '#c084fc',
  D: '#f97316',
  F: '#ef4444',
};

export function SongSelect() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const selectSong = useGameStore(s => s.selectSong);
  const startGame = useGameStore(s => s.startGame);
  const speed = useGameStore(s => s.speed);
  const setSpeed = useGameStore(s => s.setSpeed);
  const setScreen = useGameStore(s => s.setScreen);
  const metronome = useGameStore(s => s.metronome);
  const toggleMetronome = useGameStore(s => s.toggleMetronome);

  const song = SONG_LIBRARY[selectedIdx];

  // Personal best for the currently selected song + layer
  const record = useMemo(
    () => getRecord(song.id, selectedLayer),
    [song.id, selectedLayer],
  );

  const handlePlay = async () => {
    selectSong(song, selectedLayer);
    await startGame();
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px',
      }}>
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
          &larr; Back
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 800,
          color: '#fff',
          margin: 0,
        }}>
          SELECT SONG
        </h1>
        <div style={{ width: '80px' }} />
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Song list */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {SONG_LIBRARY.map((s, i) => (
            <SongCard
              key={s.id}
              song={s}
              selected={i === selectedIdx}
              onClick={() => { setSelectedIdx(i); setSelectedLayer(0); }}
            />
          ))}
        </div>

        {/* Song details panel */}
        <div style={{
          width: '340px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff' }}>
              {song.title}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              {song.artist}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>BPM </span>
              <span style={{ color: '#fff', fontWeight: 700 }}>{song.bpm}</span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Difficulty </span>
              <span style={{ color: '#fbbf24' }}>{DIFFICULTY_STARS[song.difficulty]}</span>
            </div>
          </div>

          {/* Personal best */}
          {record && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '10px 14px',
            }}>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: GRADE_COLORS[record.grade],
                lineHeight: 1,
              }}>
                {record.grade}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                  {record.score.toLocaleString()} pts
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                  {record.accuracy.toFixed(1)}% · {record.maxCombo} combo · {record.plays} {record.plays === 1 ? 'play' : 'plays'}
                </div>
              </div>
              {record.fullCombo && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  color: '#f59e0b',
                  border: '1px solid #f59e0b60',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  letterSpacing: '1px',
                }}>
                  FC
                </span>
              )}
            </div>
          )}

          {/* Layer selection */}
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              Layer
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {song.layers.map((layer, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedLayer(i)}
                  style={{
                    background: i === selectedLayer ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${i === selectedLayer ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                    {layer.name}
                  </div>
                  {layer.description && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      {layer.description}
                    </div>
                  )}
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                    {layer.notes.length} notes
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Speed control */}
          <div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              Speed: {speed.toFixed(2)}x
            </div>
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#60a5fa',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
              <span>0.25x</span>
              <span>1.0x</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Metronome toggle */}
          <button
            onClick={toggleMetronome}
            style={{
              background: metronome ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${metronome ? '#60a5fa' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              padding: '10px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
              Metronome
            </span>
            <span style={{
              fontSize: '11px',
              color: metronome ? '#60a5fa' : 'rgba(255,255,255,0.3)',
              fontWeight: 700,
            }}>
              {metronome ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Play button */}
          <button
            onClick={handlePlay}
            style={{
              background: 'linear-gradient(135deg, #60a5fa, #c084fc)',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            PLAY
          </button>
        </div>
      </div>
    </div>
  );
}

function SongCard({ song, selected, onClick }: { song: Song; selected: boolean; onClick: () => void }) {
  const genreColor = GENRE_COLORS[song.genre] || '#888';
  const bestGrade = getBestGradeForSong(song.id, song.layers.length);

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        background: selected ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? '#60a5fa40' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '10px',
        padding: '14px 16px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        width: '100%',
        transition: 'all 0.15s',
      }}
    >
      {/* Difficulty badge */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        background: `${genreColor}20`,
        border: `1px solid ${genreColor}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 800,
        color: genreColor,
        flexShrink: 0,
      }}>
        {song.difficulty}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#fff',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {song.title}
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '2px',
        }}>
          {song.artist}
        </div>
      </div>

      <div style={{
        fontSize: '10px',
        color: genreColor,
        padding: '3px 8px',
        borderRadius: '4px',
        background: `${genreColor}15`,
        flexShrink: 0,
      }}>
        {song.genre}
      </div>

      {/* Earned grade badge */}
      <div style={{
        width: '24px',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: 800,
        color: bestGrade ? GRADE_COLORS[bestGrade] : 'rgba(255,255,255,0.12)',
        flexShrink: 0,
      }}>
        {bestGrade ?? '–'}
      </div>
    </button>
  );
}
