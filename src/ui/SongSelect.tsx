import { useState, useMemo, useEffect, useCallback } from 'react';
import { SONG_LIBRARY } from '../data/songs';
import { useGameStore } from '../game/store';
import { getRecord, getBestGradeForSong } from '../game/records';
import type { Song } from '../data/songs/types';
import type { LetterGrade } from '../engine/ScoreEngine';

const DIFFICULTY_STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

const GENRE_COLORS: Record<string, string> = {
  'Rock': '#ef4444',
  'Classical': '#c084fc',
  'Hip-Hop': '#fbbf24',
  'Alternative': '#34d399',
  'Folk': '#38bdf8',
  'Ragtime': '#f472b6',
};

const GRADE_COLORS: Record<LetterGrade, string> = {
  S: '#fbbf24',
  A: '#34d399',
  B: '#60a5fa',
  C: '#c084fc',
  D: '#f97316',
  F: '#ef4444',
};

// A layer is locked if it declares a threshold and the previous layer's best accuracy is below it
function isLayerLocked(song: Song, layerIndex: number): boolean {
  if (layerIndex === 0) return false;
  const threshold = song.layers[layerIndex].unlockThreshold;
  if (threshold === undefined) return false;
  const prevRecord = getRecord(song.id, layerIndex - 1);
  return (prevRecord?.accuracy ?? 0) < threshold;
}

export function SongSelect() {
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string>(SONG_LIBRARY[0].id);
  const [selectedLayer, setSelectedLayer] = useState(0);
  const selectSong = useGameStore(s => s.selectSong);
  const startGame = useGameStore(s => s.startGame);
  const speed = useGameStore(s => s.speed);
  const setSpeed = useGameStore(s => s.setSpeed);
  const setScreen = useGameStore(s => s.setScreen);
  const metronome = useGameStore(s => s.metronome);
  const toggleMetronome = useGameStore(s => s.toggleMetronome);
  const setSettingsOpen = useGameStore(s => s.setSettingsOpen);
  const settingsOpen = useGameStore(s => s.settingsOpen);

  const genres = useMemo(
    () => ['All', ...Array.from(new Set(SONG_LIBRARY.map(s => s.genre)))],
    [],
  );

  const filteredSongs = useMemo(
    () => genreFilter === 'All' ? SONG_LIBRARY : SONG_LIBRARY.filter(s => s.genre === genreFilter),
    [genreFilter],
  );

  // Keep selection valid when the filter changes
  useEffect(() => {
    if (!filteredSongs.some(s => s.id === selectedId)) {
      setSelectedId(filteredSongs[0]?.id ?? SONG_LIBRARY[0].id);
      setSelectedLayer(0);
    }
  }, [filteredSongs, selectedId]);

  const song = filteredSongs.find(s => s.id === selectedId) ?? filteredSongs[0] ?? SONG_LIBRARY[0];
  const selectedIdx = filteredSongs.findIndex(s => s.id === song.id);

  const record = useMemo(
    () => getRecord(song.id, selectedLayer),
    [song.id, selectedLayer],
  );

  const clearedCount = useMemo(
    () => SONG_LIBRARY.filter(s => getBestGradeForSong(s.id, s.layers.length) !== null).length,
    [],
  );

  const layerLocked = isLayerLocked(song, selectedLayer);

  const handlePlay = useCallback(async () => {
    if (isLayerLocked(song, selectedLayer)) return;
    selectSong(song, selectedLayer);
    await startGame();
  }, [song, selectedLayer, selectSong, startGame]);

  // Keyboard navigation: arrows + enter
  useEffect(() => {
    if (settingsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        const next = Math.max(0, Math.min(filteredSongs.length - 1, selectedIdx + dir));
        setSelectedId(filteredSongs[next].id);
        setSelectedLayer(0);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        setSelectedLayer(l => Math.max(0, Math.min(song.layers.length - 1, l + dir)));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handlePlay();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filteredSongs, selectedIdx, song, settingsOpen, handlePlay]);

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '32px 20px 48px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
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
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '2px' }}>
            SELECT SONG
          </h1>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
            {clearedCount}/{SONG_LIBRARY.length} cleared · ↑↓ song · ←→ layer · Enter play
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setScreen('profile')}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            👤
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Genre filter chips */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {genres.map((g) => {
          const active = g === genreFilter;
          const color = g === 'All' ? '#60a5fa' : (GENRE_COLORS[g] ?? '#888');
          return (
            <button
              key={g}
              onClick={() => setGenreFilter(g)}
              style={{
                background: active ? `${color}25` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px',
                padding: '5px 14px',
                color: active ? color : 'rgba(255,255,255,0.5)',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              {g}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Song list */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
          {filteredSongs.map((s) => (
            <SongCard
              key={s.id}
              song={s}
              selected={s.id === song.id}
              onClick={() => { setSelectedId(s.id); setSelectedLayer(0); }}
            />
          ))}
        </div>

        {/* Song details panel */}
        <div style={{
          width: '340px',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          alignSelf: 'flex-start',
          position: 'sticky',
          top: '20px',
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
              {song.layers.map((layer, i) => {
                const locked = isLayerLocked(song, i);
                const layerRecord = getRecord(song.id, i);
                return (
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
                      opacity: locked ? 0.6 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>
                        {locked ? '🔒 ' : ''}{layer.name}
                      </div>
                      {layerRecord && (
                        <span style={{ fontSize: '13px', fontWeight: 800, color: GRADE_COLORS[layerRecord.grade] }}>
                          {layerRecord.grade}
                        </span>
                      )}
                    </div>
                    {locked ? (
                      <div style={{ fontSize: '10px', color: '#fbbf24', marginTop: '2px' }}>
                        Requires {layer.unlockThreshold}% accuracy on {song.layers[i - 1].name}
                      </div>
                    ) : layer.description ? (
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                        {layer.description}
                      </div>
                    ) : null}
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                      {layer.notes.length} notes
                    </div>
                  </button>
                );
              })}
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
            disabled={layerLocked}
            style={{
              background: layerLocked
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #60a5fa, #c084fc)',
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: layerLocked ? 'rgba(255,255,255,0.35)' : '#fff',
              fontSize: '16px',
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: layerLocked ? 'not-allowed' : 'pointer',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => { if (!layerLocked) e.currentTarget.style.transform = 'scale(0.97)'; }}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {layerLocked ? '🔒 LOCKED' : 'PLAY'}
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
