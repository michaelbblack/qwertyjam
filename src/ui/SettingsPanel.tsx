import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/store';

const CALIBRATION_TICKS = 12;
const CALIBRATION_INTERVAL_MS = 500;

type CalibrationPhase = 'idle' | 'running' | 'done';

export function SettingsPanel() {
  const open = useGameStore(s => s.settingsOpen);
  const setOpen = useGameStore(s => s.setSettingsOpen);
  const settings = useGameStore(s => s.settings);
  const updateSettings = useGameStore(s => s.updateSettings);
  const controller = useGameStore(s => s.controller);

  const [calPhase, setCalPhase] = useState<CalibrationPhase>('idle');
  const [calResult, setCalResult] = useState<number | null>(null);
  const [calTaps, setCalTaps] = useState(0);
  const calTickTimes = useRef<number[]>([]);
  const calOffsets = useRef<number[]>([]);
  const calTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCalibration = useCallback(() => {
    if (calTimer.current) {
      clearInterval(calTimer.current);
      calTimer.current = null;
    }
  }, []);

  const finishCalibration = useCallback(() => {
    stopCalibration();
    const offsets = calOffsets.current;
    if (offsets.length >= 4) {
      // Median offset is robust against stray taps
      const sorted = [...offsets].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const rounded = Math.round(median);
      setCalResult(rounded);
      updateSettings({ inputOffsetMs: Math.max(-200, Math.min(200, rounded)) });
    } else {
      setCalResult(null);
    }
    setCalPhase('done');
  }, [stopCalibration, updateSettings]);

  const startCalibration = useCallback(async () => {
    await controller.audioEngine.init();
    calTickTimes.current = [];
    calOffsets.current = [];
    setCalResult(null);
    setCalTaps(0);
    setCalPhase('running');

    let count = 0;
    calTimer.current = setInterval(() => {
      count++;
      if (count > CALIBRATION_TICKS) {
        finishCalibration();
        return;
      }
      controller.audioEngine.playMetronomeTick(count % 4 === 1);
      calTickTimes.current.push(performance.now());
    }, CALIBRATION_INTERVAL_MS);
  }, [controller, finishCalibration]);

  // Capture taps during calibration
  useEffect(() => {
    if (calPhase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      e.preventDefault();
      const now = performance.now();
      // Find the nearest tick and record the signed offset
      let best: number | null = null;
      for (const tick of calTickTimes.current) {
        const delta = now - tick;
        if (Math.abs(delta) < 250 && (best === null || Math.abs(delta) < Math.abs(best))) {
          best = delta;
        }
      }
      if (best !== null) {
        calOffsets.current.push(best);
        setCalTaps(calOffsets.current.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [calPhase]);

  // Clean up if the panel closes mid-calibration
  useEffect(() => {
    if (!open) {
      stopCalibration();
      setCalPhase('idle');
    }
  }, [open, stopCalibration]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5,8,16,0.8)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '420px',
              maxWidth: '92vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#0d1322',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '2px' }}>
                SETTINGS
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '18px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>

            {/* Volume */}
            <SettingRow label={`Volume: ${Math.round(settings.volume * 100)}%`}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#60a5fa' }}
              />
            </SettingRow>

            {/* Note approach speed */}
            <SettingRow
              label={`Note Speed: ${settings.scrollSpeed.toFixed(2)}x`}
              hint="Higher = notes travel faster with more spacing"
            >
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={settings.scrollSpeed}
                onChange={(e) => updateSettings({ scrollSpeed: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#60a5fa' }}
              />
            </SettingRow>

            {/* Input offset */}
            <SettingRow
              label={`Input Offset: ${settings.inputOffsetMs > 0 ? '+' : ''}${settings.inputOffsetMs}ms`}
              hint="Positive if your hits register late (audio latency)"
            >
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={settings.inputOffsetMs}
                onChange={(e) => updateSettings({ inputOffsetMs: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#c084fc' }}
              />
            </SettingRow>

            {/* Calibration */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                Latency Calibration
              </div>
              {calPhase === 'idle' && (
                <>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: '10px' }}>
                    Tap any key along with {CALIBRATION_TICKS} metronome ticks. Your average timing is measured and the offset is set automatically.
                  </div>
                  <button onClick={startCalibration} style={buttonStyle('#60a5fa')}>
                    Start Calibration
                  </button>
                </>
              )}
              {calPhase === 'running' && (
                <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 700 }}>
                  🎵 Tap any key with each tick... ({calTaps} taps)
                </div>
              )}
              {calPhase === 'done' && (
                <>
                  <div style={{ fontSize: '12px', color: calResult !== null ? '#34d399' : '#ef4444', fontWeight: 700, marginBottom: '10px' }}>
                    {calResult !== null
                      ? `Offset set to ${calResult > 0 ? '+' : ''}${calResult}ms`
                      : 'Not enough taps — try again'}
                  </div>
                  <button onClick={startCalibration} style={buttonStyle('#60a5fa')}>
                    Recalibrate
                  </button>
                </>
              )}
            </div>

            {/* Key hints toggle */}
            <button
              onClick={() => updateSettings({ keyHints: !settings.keyHints })}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: settings.keyHints ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${settings.keyHints ? '#60a5fa' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Key Hints</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                  Glow upcoming keys on the keyboard
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: settings.keyHints ? '#60a5fa' : 'rgba(255,255,255,0.3)' }}>
                {settings.keyHints ? 'ON' : 'OFF'}
              </span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
        {label}
      </div>
      {children}
      {hint && (
        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function buttonStyle(color: string): React.CSSProperties {
  return {
    background: `${color}20`,
    border: `1px solid ${color}`,
    borderRadius: '8px',
    padding: '8px 16px',
    color,
    fontSize: '11px',
    fontWeight: 700,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };
}
