// den-sounds.ts — Ambient sound system for The Den
// Rain, vinyl crackle, room tone — all synthesized via Web Audio API

let audioCtx: AudioContext | null = null;
let rainNode: AudioBufferSourceNode | null = null;
let crackleNode: AudioBufferSourceNode | null = null;
let rainGain: GainNode | null = null;
let crackleGain: GainNode | null = null;
let isPlaying = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

// Generate pink noise buffer (rain-like)
function createRainBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * seconds;
  const buf = ctx.createBuffer(2, len, sr);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    }
  }
  return buf;
}

// Generate vinyl crackle buffer
function createCrackleBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = sr * seconds;
  const buf = ctx.createBuffer(1, len, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    // Sparse pops and crackles
    if (Math.random() < 0.002) {
      data[i] = (Math.random() - 0.5) * 0.3;
    } else if (Math.random() < 0.008) {
      data[i] = (Math.random() - 0.5) * 0.08;
    } else {
      data[i] = (Math.random() - 0.5) * 0.005; // very quiet base hiss
    }
  }
  return buf;
}

export function startDenAmbience() {
  if (isPlaying) return;
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    // Rain
    const rainBuf = createRainBuffer(ctx, 8);
    rainNode = ctx.createBufferSource();
    rainNode.buffer = rainBuf;
    rainNode.loop = true;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0.08; // very soft
    // Low-pass to make it sound like rain outside a window
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 800;
    lp.Q.value = 0.5;
    rainNode.connect(lp);
    lp.connect(rainGain);
    rainGain.connect(ctx.destination);
    rainNode.start();

    // Vinyl crackle
    const crackleBuf = createCrackleBuffer(ctx, 6);
    crackleNode = ctx.createBufferSource();
    crackleNode.buffer = crackleBuf;
    crackleNode.loop = true;
    crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.04; // barely audible
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2000;
    bp.Q.value = 1;
    crackleNode.connect(bp);
    bp.connect(crackleGain);
    crackleGain.connect(ctx.destination);
    crackleNode.start();

    isPlaying = true;
  } catch {}
}

export function stopDenAmbience() {
  try {
    rainNode?.stop();
    crackleNode?.stop();
    rainNode = null;
    crackleNode = null;
    isPlaying = false;
  } catch {}
}

// Zone entry sound — warm soft tone
export function playZoneEnter() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.15);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {}
}

// Zone exit sound — descending tone
export function playZoneExit() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.2);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {}
}
