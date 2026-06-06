// ============================================================================
// Order alerts: sound + vibration + (best-effort) system notification.
// Built for a café running the live board on a phone or propped-up tablet.
//
// Mobile browsers block audio until a user gesture, so we "arm" the
// AudioContext on the first tap anywhere in the dashboard. The sound
// preference is remembered; the chime is a short attention-grabbing arpeggio.
// ============================================================================
import { useCallback, useEffect, useRef, useState } from 'react';

let audioCtx: AudioContext | null = null;

/** Create (once) and resume the AudioContext — must run inside a user gesture. */
export function unlockAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } catch { /* audio unsupported — fail silently */ }
}

/** A bright three-note arpeggio so staff notice a new order across the room. */
export function playChime() {
  if (!audioCtx) { unlockAudio(); }
  const ctx = audioCtx;
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const notes = [660, 880, 1175]; // E5 · A5 · D6
  notes.forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.value = freq;
    const t = now + i * 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    o.start(t); o.stop(t + 0.36);
  });
}

export function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}

export function requestNotify() {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }
  } catch { /* ignore */ }
}

/** Best-effort system notification — only when granted and the tab is hidden. */
export function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const n = new Notification(title, { body, tag: 'serva-order', silent: true });
      setTimeout(() => n.close(), 6000);
    }
  } catch { /* ignore */ }
}

/**
 * Arm audio for the current view: try to unlock immediately (works right after an
 * in-app navigation that followed a tap, e.g. customer pressing "Place order"), and
 * also unlock on the first gesture as a fallback. Use on pages that play a chime but
 * don't own a sound toggle (e.g. the customer order-tracking screen).
 */
export function useAudioArm() {
  useEffect(() => {
    unlockAudio();
    let armed = false;
    const arm = () => { if (!armed) { unlockAudio(); armed = true; } };
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => { window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); };
  }, []);
}

const KEY = 'cafeqr_sound';

/**
 * Sound preference + a `ping()` to fire on a new order.
 * Audio auto-arms on the first pointer interaction anywhere in the app.
 */
export function useOrderSound() {
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(KEY) !== 'off');
  const armed = useRef(false);

  useEffect(() => {
    const arm = () => { if (!armed.current) { unlockAudio(); armed.current = true; } };
    window.addEventListener('pointerdown', arm);
    window.addEventListener('keydown', arm);
    return () => { window.removeEventListener('pointerdown', arm); window.removeEventListener('keydown', arm); };
  }, []);

  const toggle = useCallback(() => {
    setSoundOn((v) => {
      const next = !v;
      localStorage.setItem(KEY, next ? 'on' : 'off');
      if (next) { unlockAudio(); armed.current = true; requestNotify(); playChime(); }
      return next;
    });
  }, []);

  const ping = useCallback(() => {
    if (!soundOn) return;
    playChime();
    vibrate([60, 70, 60]);
  }, [soundOn]);

  return { soundOn, toggle, ping };
}

export function SoundToggle({ soundOn, onToggle }: { soundOn: boolean; onToggle: () => void }) {
  return (
    <button
      className={'sndtgl' + (soundOn ? ' on' : '')}
      onClick={onToggle}
      aria-pressed={soundOn}
      title={soundOn ? 'Order sound on — tap to mute' : 'Muted — tap for sound + alerts'}
    >
      {soundOn ? '🔔' : '🔕'}
    </button>
  );
}
