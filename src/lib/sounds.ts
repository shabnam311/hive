// sounds.ts — Synthesized sound effects using Web Audio API
// No external audio files needed — everything is generated

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

function resumeCtx() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

// ─── Timer Chime — warm bell tone (study → break transition) ────────────────

export function playTimerChime(mode: "study" | "break" = "break") {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;

    // Two stacked sine oscillators for a warm bell
    const freqs = mode === "break" ? [523, 659, 784] : [392, 523, 659]; // C5-E5-G5 or G4-C5-E5
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
    gain.connect(ctx.destination);

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(i === 0 ? 0.12 : 0.06, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + 2.5);
    });
  } catch {}
}

// ─── Soft Click — for button interactions ───────────────────────────────────

export function playSoftClick() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {}
}

// ─── Page Turn — rustling paper sound ───────────────────────────────────────

export function playPageTurn() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;

    // White noise burst filtered to sound like paper
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3000, now);
    filter.Q.setValueAtTime(0.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
  } catch {}
}

// ─── Library Open — deep resonant tone (opening a massive book) ─────────────

export function playLibraryOpen() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;

    // Low resonant tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.6);

    // Sub harmonics
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(360, now);
    osc2.frequency.exponentialRampToValueAtTime(240, now + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.04, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 1);
    osc2.stop(now + 0.8);
  } catch {}
}

// ─── Flashcard Flip ─────────────────────────────────────────────────────────

export function playFlip() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch {}
}

// ─── Success — for correct quiz answers or concept unlocked ─────────────────

export function playSuccess() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.08, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });
  } catch {}
}

// ─── Gentle Notification — for mode switch ──────────────────────────────────

export function playNotification() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1047, now + 0.1);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {}
}

// ─── Owl Hoot — for chat start or tutor interactions ────────────────────────

export function playHoot() {
  try {
    const ctx = resumeCtx();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Low, breathy flute-like tone for a hoot
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now); // initial breath
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.1); // pitch up
    osc.frequency.exponentialRampToValueAtTime(310, now + 0.4); // drop off
    
    // soft attack, sustain, slow release
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    // Add a lowpass filter for muffling the sound
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.7);
  } catch {}
}
