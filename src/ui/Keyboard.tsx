import { useEffect, useState, useCallback } from 'react';
import { DEFAULT_KEYMAP, getRowKeys, ALL_ROWS, ROW_COLORS, type KeyRow } from '../data/keymap';
import { useGameStore } from '../game/store';

interface KeyState {
  pressed: boolean;
  grade: string | null;
  timestamp: number;
}

export function Keyboard() {
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>({});
  const recentHits = useGameStore(s => s.recentHits);
  const gameState = useGameStore(s => s.gameState);

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
        />
      ))}
    </div>
  );
}

function KeyboardRow({ row, keyStates }: { row: KeyRow; keyStates: Record<string, KeyState> }) {
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
              color: isPressed ? '#fff' : baseColor,
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
