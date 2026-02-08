import { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from '../game/store';
import { buildNoteToKeysMap, DEFAULT_KEYMAP, getKeyRow, ROW_COLORS, type KeyRow } from '../data/keymap';

const NOTE_TO_KEYS = buildNoteToKeysMap(DEFAULT_KEYMAP);

// Color for a note based on which keyboard row it maps to
function getNoteColor(note: string): string {
  const keys = NOTE_TO_KEYS[note];
  if (!keys || keys.length === 0) return '#888';
  const row = getKeyRow(keys[0]);
  return row ? ROW_COLORS[row] : '#888';
}

// Y lane position for a note (0-3 based on keyboard row)
function getNoteLane(note: string): number {
  const keys = NOTE_TO_KEYS[note];
  if (!keys || keys.length === 0) return 2;
  const row = getKeyRow(keys[0]);
  const laneMap: Record<KeyRow, number> = { number: 0, top: 1, home: 2, bottom: 3 };
  return row ? laneMap[row] : 2;
}

// Get the display key for a note
function getNoteKey(note: string): string {
  const keys = NOTE_TO_KEYS[note];
  if (!keys || keys.length === 0) return '?';
  return keys[0].toUpperCase();
}

export function NoteHighway() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const controller = useGameStore(s => s.controller);
  const gameState = useGameStore(s => s.gameState);
  const recentHits = useGameStore(s => s.recentHits);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Clear
    ctx.fillStyle = '#0a0e1a';
    ctx.fillRect(0, 0, W, H);

    // Strike zone
    const strikeX = 160;
    const laneCount = 4;
    const laneH = H / laneCount;
    const lookAhead = 4; // seconds to show ahead

    // Draw lane lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < laneCount; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * laneH);
      ctx.lineTo(W, i * laneH);
      ctx.stroke();
    }

    // Draw lane labels
    const laneLabels = ['# SHARPS', 'QWERTY', 'HOME', 'ZXCV'];
    const laneColors = [ROW_COLORS.number, ROW_COLORS.top, ROW_COLORS.home, ROW_COLORS.bottom];
    ctx.font = '10px "JetBrains Mono", monospace';
    for (let i = 0; i < laneCount; i++) {
      ctx.fillStyle = laneColors[i] + '40';
      ctx.fillText(laneLabels[i], 8, i * laneH + 16);
    }

    // Draw strike zone line
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(strikeX, 0);
    ctx.lineTo(strikeX, H);
    ctx.stroke();

    // Glow effect on strike zone
    const gradient = ctx.createLinearGradient(strikeX - 30, 0, strikeX + 30, 0);
    gradient.addColorStop(0, 'rgba(96,165,250,0)');
    gradient.addColorStop(0.5, 'rgba(96,165,250,0.1)');
    gradient.addColorStop(1, 'rgba(96,165,250,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(strikeX - 30, 0, 60, H);

    // Draw notes
    const currentTime = controller.timingEngine.getCurrentTime();
    const schedule = controller.timingEngine.noteSchedule;

    for (const note of schedule) {
      const timeUntil = note.time - currentTime;

      // Skip notes too far in the past or future
      if (timeUntil < -1 || timeUntil > lookAhead) continue;

      const x = strikeX + (timeUntil / lookAhead) * (W - strikeX);
      const lane = getNoteLane(note.note);
      const y = lane * laneH + laneH * 0.15;
      const noteH = laneH * 0.7;
      const noteW = Math.max(30, (note.duration / lookAhead) * (W - strikeX));

      const color = getNoteColor(note.note);

      if (note.hit && note.grade !== 'miss') {
        // Hit note — flash and fade
        const elapsed = (currentTime - (note.hitTime ?? currentTime)) * 4;
        const alpha = Math.max(0, 1 - elapsed);
        ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.shadowColor = color;
        ctx.shadowBlur = 20 * alpha;
        ctx.beginPath();
        ctx.roundRect(x, y, noteW, noteH, 6);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (note.grade === 'miss') {
        // Missed note — dark and dropping
        const elapsed = currentTime - note.time;
        const drop = elapsed * 40;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(x, y + drop, noteW, noteH, 6);
        ctx.fill();
      } else {
        // Upcoming note
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = timeUntil < 0.3 ? 15 : 5;
        ctx.beginPath();
        ctx.roundRect(x, y, noteW, noteH, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Key label on note
        const key = getNoteKey(note.note);
        ctx.fillStyle = '#0a0e1a';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, x + noteW / 2, y + noteH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // Draw recent hit effects
    const now = Date.now();
    for (const hit of recentHits) {
      const elapsed = (now - hit.timestamp) / 500;
      if (elapsed > 1) continue;
      const alpha = 1 - elapsed;
      const lane = getNoteLane(hit.note);
      const y = lane * laneH + laneH / 2;
      const size = 20 + elapsed * 30;

      let effectColor = '#34d399';
      if (hit.grade === 'great') effectColor = '#60a5fa';
      else if (hit.grade === 'good') effectColor = '#fbbf24';
      else if (hit.grade === 'miss') effectColor = '#ef4444';

      ctx.strokeStyle = effectColor + Math.floor(alpha * 200).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(strikeX, y, size, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(draw);
    }
  }, [controller, gameState, recentHits]);

  useEffect(() => {
    if (gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameState, draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '280px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
