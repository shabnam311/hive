// ProceduralTextures.tsx — Canvas-based procedural textures for The Den
// Generates wood, fabric, plaster, cork, and night-sky textures at runtime
// No external files needed — everything is synthesized
import { useMemo } from "react";
import * as THREE from "three";

// ── Utility: Create a canvas texture ──────────────────────────────
function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number],
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

// ── WOOD GRAIN (floor/furniture) ──────────────────────────────────
export function createWoodTexture(
  baseColor = "#3A2210",
  grainColor = "#2A1808",
  width = 256,
  height = 256,
): THREE.CanvasTexture {
  return canvasTexture(
    width,
    height,
    (ctx, w, h) => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      // Wood grain lines
      ctx.strokeStyle = grainColor;
      for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.globalAlpha = 0.15 + Math.random() * 0.25;
        const y = Math.random() * h;
        ctx.moveTo(0, y);
        for (let x = 0; x < w; x += 4) {
          ctx.lineTo(x, y + Math.sin(x * 0.02 + i) * 3 + (Math.random() - 0.5) * 1.5);
        }
        ctx.stroke();
      }

      // Knots
      ctx.globalAlpha = 1;
      for (let k = 0; k < 3; k++) {
        const kx = Math.random() * w;
        const ky = Math.random() * h;
        const kr = 4 + Math.random() * 8;
        const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr);
        grad.addColorStop(0, grainColor);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
      }
    },
    [4, 4],
  );
}

// ── WOOD PLANK FLOOR ──────────────────────────────────────────────
export function createFloorTexture(): THREE.CanvasTexture {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#3A2210";
      ctx.fillRect(0, 0, w, h);

      const plankH = h / 7;
      for (let row = 0; row < 7; row++) {
        const baseY = row * plankH;
        const shade = row % 2 === 0 ? "#3E2612" : "#452A14";
        ctx.fillStyle = shade;
        ctx.fillRect(0, baseY + 2, w, plankH - 4);

        // Grain on each plank
        ctx.strokeStyle = "#2A1505";
        for (let g = 0; g < 20; g++) {
          ctx.beginPath();
          ctx.lineWidth = 0.3 + Math.random() * 1;
          ctx.globalAlpha = 0.12 + Math.random() * 0.2;
          const gy = baseY + Math.random() * plankH;
          ctx.moveTo(0, gy);
          for (let x = 0; x < w; x += 3) {
            ctx.lineTo(x, gy + Math.sin(x * 0.015 + g * 0.7) * 2 + (Math.random() - 0.5));
          }
          ctx.stroke();
        }

        // Plank gap — dark groove
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#1A0C04";
        ctx.fillRect(0, baseY, w, 2);
      }
      ctx.globalAlpha = 1;
    },
    [2, 2],
  );
}

// ── FABRIC / DUVET WEAVE ──────────────────────────────────────────
export function createFabricTexture(
  baseColor = "#3A5A58",
  threadColor = "#2A4A48",
  width = 128,
  height = 128,
): THREE.CanvasTexture {
  return canvasTexture(
    width,
    height,
    (ctx, w, h) => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      // Warp threads
      ctx.strokeStyle = threadColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 3) {
        ctx.globalAlpha = 0.15 + Math.random() * 0.1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 0.5, h);
        ctx.stroke();
      }
      // Weft threads
      for (let y = 0; y < h; y += 3) {
        ctx.globalAlpha = 0.12 + Math.random() * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + (Math.random() - 0.5) * 0.5);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
    [6, 6],
  );
}

// ── PLASTER / WALL TEXTURE ────────────────────────────────────────
export function createPlasterTexture(
  baseColor = "#DBC8A8",
  width = 256,
  height = 256,
): THREE.CanvasTexture {
  return canvasTexture(
    width,
    height,
    (ctx, w, h) => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);

      // Subtle mottling
      for (let i = 0; i < 300; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 2 + Math.random() * 15;
        ctx.globalAlpha = 0.02 + Math.random() * 0.05;
        ctx.fillStyle = Math.random() > 0.5 ? "#C8B898" : "#E8D8B8";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [2, 2],
  );
}

// ── CORK BOARD ────────────────────────────────────────────────────
export function createCorkTexture(): THREE.CanvasTexture {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#5A3818";
      ctx.fillRect(0, 0, w, h);

      // Porous dots
      for (let i = 0; i < 800; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const r = 0.5 + Math.random() * 2;
        ctx.globalAlpha = 0.1 + Math.random() * 0.25;
        ctx.fillStyle = Math.random() > 0.5 ? "#4A2810" : "#6A4828";
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [3, 3],
  );
}

// ── RUG PATTERN ───────────────────────────────────────────────────
export function createRugTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const cx = w / 2,
      cy = h / 2;
    // Outer fill
    ctx.fillStyle = "#2A4020";
    ctx.fillRect(0, 0, w, h);

    // Concentric rings (persian-style)
    const colors = ["#324A28", "#3A5230", "#2A4020", "#405838", "#324A28"];
    colors.forEach((c, i) => {
      const r = w / 2 - i * 40 - 20;
      if (r < 10) return;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = c;
      ctx.lineWidth = 8 + Math.random() * 4;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
    });

    // Decorative cross-hatch center
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#1A3010";
    ctx.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60);
      ctx.stroke();
    }

    // Border fringe effect
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#5A4030";
    for (let i = 0; i < 200; i++) {
      const angle = (i / 200) * Math.PI * 2;
      const r1 = w / 2 - 5;
      const r2 = w / 2 + 3 + Math.random() * 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

// ── NIGHT SKY gradient ────────────────────────────────────────────
export function createNightSkyTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#050810");
    grad.addColorStop(0.4, "#0A0E20");
    grad.addColorStop(0.7, "#101830");
    grad.addColorStop(1, "#182040");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.7; // More stars at top
      const r = 0.3 + Math.random() * 1.2;
      ctx.globalAlpha = 0.3 + Math.random() * 0.7;
      ctx.fillStyle = "#E8E0D0";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Moon glow
    const mx = w * 0.7,
      my = h * 0.15;
    const moonGrad = ctx.createRadialGradient(mx, my, 0, mx, my, 40);
    moonGrad.addColorStop(0, "rgba(200, 210, 240, 0.3)");
    moonGrad.addColorStop(1, "transparent");
    ctx.globalAlpha = 1;
    ctx.fillStyle = moonGrad;
    ctx.fillRect(mx - 40, my - 40, 80, 80);
    // Moon disc
    ctx.fillStyle = "#C8D0E0";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(mx, my, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

// ── Normal map from canvas noise ──────────────────────────────────
export function createNoiseNormalMap(intensity = 0.5, size = 64): THREE.CanvasTexture {
  return canvasTexture(
    size,
    size,
    (ctx, w, h) => {
      const imgData = ctx.createImageData(w, h);
      for (let p = 0; p < imgData.data.length; p += 4) {
        const nx = 128 + (Math.random() - 0.5) * 255 * intensity;
        const ny = 128 + (Math.random() - 0.5) * 255 * intensity;
        imgData.data[p] = nx; // R = X normal
        imgData.data[p + 1] = ny; // G = Y normal
        imgData.data[p + 2] = 255; // B = Z normal (up)
        imgData.data[p + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
    },
    [4, 4],
  );
}

// ── Hook: Memoized texture set for The Den ────────────────────────
export function useDenTextures() {
  return useMemo(() => getDenTextures(), []);
}

// ── Singleton: shared across all components ───────────────────────
let _cached: ReturnType<typeof _buildTextures> | null = null;

function _buildTextures() {
  return {
    floor: createFloorTexture(),
    wood: createWoodTexture(),
    woodLight: createWoodTexture("#4A2A12", "#3A1A08"),
    fabric: createFabricTexture(),
    throwBlanket: createFabricTexture("#C4501A", "#A84018"),
    curtain: createFabricTexture("#6B3A2A", "#5A2A1A"),
    plasterBack: createPlasterTexture("#DBC8A8"),
    plasterLeft: createPlasterTexture("#D8C4A2"),
    plasterRight: createPlasterTexture("#D4C09E"),
    plasterCeiling: createPlasterTexture("#EDE0C8"),
    cork: createCorkTexture(),
    rug: createRugTexture(),
    nightSky: createNightSkyTexture(),
    normalWood: createNoiseNormalMap(0.3),
    normalPlaster: createNoiseNormalMap(0.15),
    normalFabric: createNoiseNormalMap(0.2),
  };
}

export function getDenTextures() {
  if (!_cached) _cached = _buildTextures();
  return _cached;
}
