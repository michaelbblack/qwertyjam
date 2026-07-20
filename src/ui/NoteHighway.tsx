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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 -> 0
  size: number;
  color: string;
}

const GRADE_COLORS: Record<string, string> = {
  perfect: '#34d399',
  great: '#60a5fa',
  good: '#fbbf24',
  miss: '#ef4444',
};

export function NoteHighway() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const processedHitsRef = useRef<Set<number>>(new Set());
  const lastFrameRef = useRef<number>(0);
  const controller = useGameStore(s => s.controller);
  const gameState = useGameStore(s => s.gameState);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Frame delta for particle physics
    const frameNow = performance.now();
    const dt = lastFrameRef.current ? Math.min((frameNow - lastFrameRef.current) / 1000, 0.05) : 0.016;
    lastFrameRef.current = frameNow;

    // Read reactive state without re-creating the draw loop
    const { recentHits, scoreState, settings } = useGameStore.getState();
    const combo = scoreState?.combo ?? 0;
    const fever = combo >= 25;

    // Handle DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    // Background — subtle vertical gradient, warmer during fever
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    if (fever) {
      const pulse = 0.5 + 0.5 * Math.sin(frameNow / 200);
      bg.addColorStop(0, `rgba(40, 20, ${50 + pulse * 15}, 1)`);
      bg.addColorStop(1, '#0a0e1a');
    } else {
      bg.addColorStop(0, '#0d1322');
      bg.addColorStop(1, '#0a0e1a');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const strikeX = 160;
    const laneCount = 4;
    const laneH = H / laneCount;
    const lookAhead = 4 / settings.scrollSpeed; // seconds of highway shown ahead

    const currentTime = controller.timingEngine.getCurrentTime();
    const timeToX = (t: number) => strikeX + ((t - currentTime) / lookAhead) * (W - strikeX);

    // Scrolling beat grid — vertical lines at every beat, brighter on downbeats
    const song = controller.getCurrentSong();
    const beatsPerMeasure = song?.timeSignature?.[0] ?? 4;
    const effectiveBpm = controller.timingEngine.bpm * controller.timingEngine.speedMultiplier;
    const secPerBeat = 60 / effectiveBpm;
    const firstBeat = Math.ceil(currentTime / secPerBeat);
    const lastBeat = Math.floor((currentTime + lookAhead) / secPerBeat);
    for (let b = firstBeat; b <= lastBeat; b++) {
      const x = timeToX(b * secPerBeat);
      const isMeasure = ((b % beatsPerMeasure) + beatsPerMeasure) % beatsPerMeasure === 0;
      ctx.strokeStyle = isMeasure ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.035)';
      ctx.lineWidth = isMeasure ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Lane separators
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < laneCount; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * laneH);
      ctx.lineTo(W, i * laneH);
      ctx.stroke();
    }

    // Lane labels
    const laneLabels = ['# SHARPS', 'QWERTY', 'HOME', 'ZXCV'];
    const laneColors = [ROW_COLORS.number, ROW_COLORS.top, ROW_COLORS.home, ROW_COLORS.bottom];
    ctx.font = '10px "JetBrains Mono", monospace';
    for (let i = 0; i < laneCount; i++) {
      ctx.fillStyle = laneColors[i] + '40';
      ctx.fillText(laneLabels[i], 8, i * laneH + 16);
    }

    // Strike zone — pulses on the beat
    const beatPhase = ((currentTime / secPerBeat) % 1 + 1) % 1;
    const beatPulse = Math.max(0, 1 - beatPhase * 3); // sharp flash at each beat
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + beatPulse * 0.4})`;
    ctx.lineWidth = 2 + beatPulse * 1.5;
    ctx.beginPath();
    ctx.moveTo(strikeX, 0);
    ctx.lineTo(strikeX, H);
    ctx.stroke();

    const glowColor = fever ? '192,132,252' : '96,165,250';
    const gradient = ctx.createLinearGradient(strikeX - 30, 0, strikeX + 30, 0);
    gradient.addColorStop(0, `rgba(${glowColor},0)`);
    gradient.addColorStop(0.5, `rgba(${glowColor},${0.1 + beatPulse * 0.08})`);
    gradient.addColorStop(1, `rgba(${glowColor},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(strikeX - 30, 0, 60, H);

    // Draw notes
    const schedule = controller.timingEngine.noteSchedule;

    for (const note of schedule) {
      const timeUntil = note.time - currentTime;

      // Skip notes too far in the past or future
      if (timeUntil < -1 || timeUntil > lookAhead) continue;

      const x = timeToX(note.time);
      const lane = getNoteLane(note.note);
      const y = lane * laneH + laneH * 0.15;
      const noteH = laneH * 0.7;
      const noteW = Math.max(44, (note.duration / lookAhead) * (W - strikeX));

      const color = getNoteColor(note.note);

      if (note.hit && note.grade !== 'miss') {
        // Hit note — flash and fade
        const elapsed = (currentTime - (note.hitTime ?? currentTime)) * 4;
        const alpha = Math.max(0, 1 - elapsed);
        ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.roundRect(x, y, noteW, noteH, 6);
        ctx.fill();
      } else if (note.grade === 'miss') {
        // Missed note — dark and dropping
        const elapsed = currentTime - note.time;
        const drop = elapsed * 40;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(x, y + drop, noteW, noteH, 6);
        ctx.fill();
      } else {
        // Upcoming note — bright glow when close to strike zone
        const glowAlpha = timeUntil < 0.5 ? 0.25 : 0.08;
        ctx.fillStyle = color + Math.floor(glowAlpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.roundRect(x - 3, y - 3, noteW + 6, noteH + 6, 8);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, noteW, noteH, 6);
        ctx.fill();

        // Key label on note — large and high contrast
        const key = getNoteKey(note.note);
        const fontSize = Math.min(22, noteH * 0.55);
        ctx.fillStyle = '#0a0e1a';
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, x + noteW / 2, y + noteH / 2);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // Spawn particles for new hits
    const now = Date.now();
    for (const hit of recentHits) {
      if (processedHitsRef.current.has(hit.timestamp)) continue;
      processedHitsRef.current.add(hit.timestamp);
      if (hit.grade === 'miss') continue;

      const lane = getNoteLane(hit.note);
      const y = lane * laneH + laneH / 2;
      const color = getNoteColor(hit.note);
      const count = hit.grade === 'perfect' ? 14 : hit.grade === 'great' ? 10 : 6;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        particlesRef.current.push({
          x: strikeX,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          life: 1,
          size: 2 + Math.random() * 3,
          color: Math.random() < 0.4 ? GRADE_COLORS[hit.grade] : color,
        });
      }
    }
    // Prune old processed timestamps so the set doesn't grow forever
    if (processedHitsRef.current.size > 64) {
      for (const ts of processedHitsRef.current) {
        if (now - ts > 2000) processedHitsRef.current.delete(ts);
      }
    }

    // Update + draw particles
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.life -= dt * 1.8;
      if (p.life <= 0) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 320 * dt; // gravity
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      alive.push(p);
    }
    ctx.globalAlpha = 1;
    particlesRef.current = alive;

    // Hit ring effects + early/late feedback at the strike zone
    for (const hit of recentHits) {
      const elapsed = (now - hit.timestamp) / 500;
      if (elapsed > 1) continue;
      const alpha = 1 - elapsed;
      const lane = getNoteLane(hit.note);
      const y = lane * laneH + laneH / 2;
      const size = 20 + elapsed * 30;

      const effectColor = GRADE_COLORS[hit.grade] ?? '#34d399';
      ctx.strokeStyle = effectColor + Math.floor(alpha * 200).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(strikeX, y, size, 0, Math.PI * 2);
      ctx.stroke();

      // Early/late text for any pressed note that wasn't perfect.
      // Off-time presses (grade 'miss' with a delta) get a louder orange label.
      if (hit.grade !== 'perfect' && Math.abs(hit.deltaMs) > 25) {
        const offTime = hit.grade === 'miss';
        const label = offTime
          ? (hit.deltaMs < 0 ? 'TOO EARLY' : 'TOO LATE')
          : (hit.deltaMs < 0 ? 'EARLY' : 'LATE');
        ctx.fillStyle = offTime
          ? `rgba(249,115,22,${alpha})`
          : `rgba(255,255,255,${alpha * 0.7})`;
        ctx.font = `bold ${offTime ? 11 : 9}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(label, strikeX, y - laneH * 0.42 - elapsed * 10);
        ctx.textAlign = 'left';
      }
    }

    // Fever border glow
    if (fever) {
      const pulse = 0.5 + 0.5 * Math.sin(frameNow / 150);
      ctx.strokeStyle = `rgba(192,132,252,${0.25 + pulse * 0.3})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    }

    // Song progress bar along the bottom
    const duration = controller.timingEngine.getSongDuration();
    if (duration > 0) {
      const progress = Math.max(0, Math.min(1, currentTime / duration));
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, H - 4, W, 4);
      const progGrad = ctx.createLinearGradient(0, 0, W, 0);
      progGrad.addColorStop(0, '#60a5fa');
      progGrad.addColorStop(1, '#c084fc');
      ctx.fillStyle = progGrad;
      ctx.fillRect(0, H - 4, W * progress, 4);
    }

    if (useGameStore.getState().gameState === 'playing') {
      animFrameRef.current = requestAnimationFrame(draw);
    }
  }, [controller]);

  useEffect(() => {
    if (gameState === 'playing') {
      lastFrameRef.current = 0;
      animFrameRef.current = requestAnimationFrame(draw);
    }
    if (gameState === 'countdown') {
      // Reset effect state for a fresh run
      particlesRef.current = [];
      processedHitsRef.current.clear();
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
        height: '300px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    />
  );
}
