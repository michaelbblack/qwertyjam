import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_KEYMAP, getRowKeys, ALL_ROWS, ROW_COLORS, buildNoteToKeysMap, type KeyRow } from '../data/keymap';
import { useGameStore } from '../game/store';

const NOTE_TO_KEYS = buildNoteToKeysMap(DEFAULT_KEYMAP);

interface KeyState {
  pressed: boolean;
  grade: string | null;
  timestamp: number;
}

// Hint level for upcoming notes: the very next note is "next", notes soon after are "soon"
type HintLevel = 'next' | 'soon';

export function Keyboard() {
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>({});
  const [hints, setHints] = useState<Record<string, HintLevel>>({});
  const recentHits = useGameStore(s => s.recentHits);
  const gameState = useGameStore(s => s.gameState);
  const controller = useGameStore(s => s.controller);

  // Update key states from recent hits
  useEffect(() => {
    const now = Date.now();
    const newStates: Record<string, KeyState> = {};
    for (const hit of recentHits) {
      if (now - hit.timestamp < 300) {
        newStates[hit.key] = {
          pressed: true,
          grade: hit.grade,
          timestamp: hit.timestamp,
        };
      }
    }
    setKeyStates(newStates);
  }, [recentHits]);

  // Poll for upcoming notes to hint at the keys to press
  useEffect(() => {
    if (gameState !== 'playing') {
      setHints({});
      return;
    }
    const interval = setInterval(() => {
      const currentTime = controller.timingEngine.getCurrentTime();
      const schedule = controller.timingEngine.noteSchedule;
      const newHints: Record<string, HintLevel> = {};
      let nextFound = false;
      for (const note of schedule) {
        if (note.hit || note.grade === 'miss') continue;
        const until = note.time - currentTime;
        if (until < -0.1) continue;
        if (until > 2) break;
        const keys = NOTE_TO_KEYS[note.note];
        if (!keys || keys.length === 0) continue;
        const key = keys[0];
        if (!nextFound) {
          newHints[key] = 'next';
          nextFound = true;
        } else if (!newHints[key]) {
          newHints[key] = 'soon';
        }
      }
      setHints(prev => {
        // Avoid re-render churn when nothing changed
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(newHints);
        if (prevKeys.length === nextKeys.length && nextKeys.every(k => prev[k] === newHints[k])) {
          return prev;
        }
        return newHints;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [gameState, controller]);

  // Track physical key presses for visual feedback
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (DEFAULT_KEYMAP[key]) {
      setKeyStates(prev => ({
        ...prev,
        [key]: { pressed: true, grade: null, timestamp: Date.now() },
      }));
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    setKeyStates(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [gameState, handleKeyDown, handleKeyUp]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
      {ALL_ROWS.map((row) => (
        <KeyboardRow
          key={row}
          row={row}
          keyStates={keyStates}
          hints={hints}
        />
      ))}
    </div>
  );
}

function KeyboardRow({ row, keyStates, hints }: {
  row: KeyRow;
  keyStates: Record<string, KeyState>;
  hints: Record<string, HintLevel>;
}) {
  const keys = getRowKeys(row);
  const baseColor = ROW_COLORS[row];
  const offsetMap: Record<KeyRow, number> = { number: 0, top: 15, home: 25, bottom: 40 };

  return (
    <div style={{
      display: 'flex',
      gap: '3px',
      marginLeft: `${offsetMap[row]}px`,
    }}>
      {keys.map((key) => {
        const state = keyStates[key];
        const note = DEFAULT_KEYMAP[key];
        const isPressed = state?.pressed;
        const grade = state?.grade;
        const hint = hints[key];

        let bgColor = 'rgba(255,255,255,0.06)';
        let borderColor = 'rgba(255,255,255,0.12)';
        let shadow = 'none';
        let scale = 1;

        if (isPressed) {
          if (grade === 'perfect') {
            bgColor = '#34d39960';
            borderColor = '#34d399';
            shadow = `0 0 12px ${baseColor}80`;
            scale = 1.08;
          } else if (grade === 'great') {
            bgColor = '#60a5fa50';
            borderColor = '#60a5fa';
            shadow = `0 0 8px ${baseColor}60`;
            scale = 1.05;
          } else if (grade === 'good') {
            bgColor = '#fbbf2440';
            borderColor = '#fbbf24';
            scale = 1.03;
          } else if (grade === 'miss') {
            bgColor = '#ef444440';
            borderColor = '#ef4444';
          } else {
            bgColor = baseColor + '30';
            borderColor = baseColor + '80';
            scale = 1.02;
          }
        } else if (hint === 'next') {
          bgColor = baseColor + '28';
          borderColor = baseColor;
          shadow = `0 0 10px ${baseColor}70`;
          scale = 1.06;
        } else if (hint === 'soon') {
          bgColor = baseColor + '14';
          borderColor = baseColor + '70';
        }

        return (
          <div
            key={key}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              border: `1px solid ${borderColor}`,
              background: bgColor,
              boxShadow: shadow,
              transform: `scale(${scale})`,
              transition: 'all 0.08s ease-out',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: isPressed || hint === 'next' ? '#fff' : baseColor,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {key === ';' ? ';' : key.toUpperCase()}
            </span>
            <span style={{
              fontSize: '7px',
              color: 'rgba(255,255,255,0.35)',
              fontFamily: '"JetBrains Mono", monospace',
              marginTop: '1px',
            }}>
              {note}
            </span>
          </div>
        );
      })}
    </div>
  );
}
