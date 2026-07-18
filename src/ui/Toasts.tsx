import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../game/store';

// Floating notification stack (achievements, level-ups)
export function Toasts() {
  const toasts = useGameStore(s => s.toasts);
  const dismissToast = useGameStore(s => s.dismissToast);

  return (
    <div style={{
      position: 'fixed',
      top: '16px',
      right: '16px',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      fontFamily: '"JetBrains Mono", monospace',
    }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => dismissToast(toast.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'linear-gradient(135deg, rgba(30,25,60,0.95), rgba(15,20,40,0.95))',
              border: '1px solid rgba(192,132,252,0.4)',
              borderRadius: '12px',
              padding: '12px 16px',
              minWidth: '240px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(192,132,252,0.15)',
            }}
          >
            <div style={{ fontSize: '24px' }}>{toast.icon}</div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                {toast.desc}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
