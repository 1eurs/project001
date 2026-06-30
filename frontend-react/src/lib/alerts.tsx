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

/**
 * A bright arpeggio so staff notice a new order across the room. Routed through a
 * master gain + limiter so we can push the volume hard (triangle waves carry further
 * than sine) without clipping into harsh distortion. `repeats` plays it as a
 * double/triple ring for extra urgency on a new order.
 */
export function playChime(opts?: { repeats?: number; gain?: number }) {
  if (!audioCtx) { unlockAudio(); }
  const ctx = audioCtx;
  if (!ctx || ctx.state !== 'running') return;
  const repeats = Math.max(1, opts?.repeats ?? 1);
  const peak = opts?.gain ?? 0.55;

  // Brick-wall-ish limiter keeps the loud signal clean instead of clipping.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 20;
  limiter.attack.value = 0.002; limiter.release.value = 0.12;
  const master = ctx.createGain();
  master.gain.value = 0.95;
  master.connect(limiter); limiter.connect(ctx.destination);

  const notes = [660, 880, 1175]; // E5 · A5 · D6
  const span = notes.length * 0.12 + 0.28;     // length of one arpeggio
  const now = ctx.currentTime;
  for (let r = 0; r < repeats; r++) {
    const base = now + r * span;
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(master);
      o.type = 'triangle';
      o.frequency.value = freq;
      const t = base + i * 0.12;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
      o.start(t); o.stop(t + 0.36);
    });
  }
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

let _lastNotif: Notification | null = null;

/** Best-effort system notification — only when granted and the tab is hidden. */
export function notify(title: string, body: string) {
  try {
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      _lastNotif?.close();
      const n = new Notification(title, { body, tag: 'serva-order', silent: true });
      _lastNotif = n;
      setTimeout(() => { n.close(); if (_lastNotif === n) _lastNotif = null; }, 6000);
    }
  } catch { /* ignore */ }
}

/** Dismiss the pending order notification (e.g. when the badge is cleared). */
export function closeNotify() {
  try { _lastNotif?.close(); _lastNotif = null; } catch { /* ignore */ }
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
    playChime({ repeats: 2, gain: 0.72 });       // louder double-ring for a new order
    vibrate([120, 90, 120, 90, 220]);
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
