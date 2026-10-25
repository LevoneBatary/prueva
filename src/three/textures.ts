import * as THREE from 'three';

/**
 * Generates a high-resolution procedural precision studio floor grid & radial turntable scale.
 */
export function createStudioFloorTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Fine grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const step = 32;
  for (let i = 0; i <= size; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Concentric measurement rings
  const radii = [140, 240, 340, 440, 480];
  radii.forEach((r, idx) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = idx === 2 ? 'rgba(245, 158, 11, 0.28)' : 'rgba(255, 255, 255, 0.11)';
    ctx.lineWidth = idx === 2 ? 2 : 1.2;
    ctx.stroke();
  });

  // Degree tick marks around outer ring
  for (let deg = 0; deg < 360; deg += 3) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const isMid = deg % 15 === 0;
    const innerR = isMajor ? 416 : isMid ? 426 : 433;
    const outerR = 440;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rad) * innerR, cy + Math.sin(rad) * innerR);
    ctx.lineTo(cx + Math.cos(rad) * outerR, cy + Math.sin(rad) * outerR);
    ctx.strokeStyle = isMajor ? 'rgba(245, 158, 11, 0.55)' : 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.stroke();
  }

  // Crosshair axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 480, cy);
  ctx.lineTo(cx + 480, cy);
  ctx.moveTo(cx, cy - 480);
  ctx.lineTo(cx, cy + 480);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a soft radial contact shadow texture for grounding objects at Y=0.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, size * 0.46);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.82)');
  grad.addColorStop(0.38, 'rgba(0, 0, 0, 0.45)');
  grad.addColorStop(0.72, 'rgba(0, 0, 0, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a linear-space brushed metal roughness/bump map for realistic anisotropic surfaces.
 */
export function createBrushedRoughnessTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Deterministic pseudo-random micro-scratches
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 2400; i++) {
    const y = rand() * size;
    const x = rand() * size;
    const len = 30 + rand() * 140;
    const shade = Math.floor(105 + rand() * 55);
    ctx.strokeStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.lineWidth = 0.7 + rand() * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rand() - 0.5) * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a razor-sharp horological chronograph dial texture with guilloché rings and indices.
 */
export function createHorologyDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Deep metallic slate base
  const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 490);
  bgGrad.addColorStop(0, '#1B202B');
  bgGrad.addColorStop(0.65, '#11151E');
  bgGrad.addColorStop(1, '#090C12');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle concentric guilloché rings
  for (let r = 80; r < 460; r += 6) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = r % 24 === 0 ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Chapter ring minute & hour markers
  for (let i = 0; i < 60; i++) {
    const angle = (i * 6 * Math.PI) / 180 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const inner = isHour ? 395 : 422;
    const outer = 445;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.strokeStyle = isHour ? '#F59E0B' : 'rgba(243, 244, 246, 0.65)';
    ctx.lineWidth = isHour ? 5 : 2;
    ctx.stroke();
  }

  // Sub-dials at 9 and 3 o'clock
  const subDials = [
    { x: cx - 175, y: cy, r: 95 },
    { x: cx + 175, y: cy, r: 95 },
  ];
  subDials.forEach((sd) => {
    ctx.beginPath();
    ctx.arc(sd.x, sd.y, sd.r, 0, Math.PI * 2);
    ctx.fillStyle = '#0D1017';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let j = 0; j < 12; j++) {
      const a = (j * 30 * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(sd.x + Math.cos(a) * (sd.r - 16), sd.y + Math.sin(a) * (sd.r - 16));
      ctx.lineTo(sd.x + Math.cos(a) * (sd.r - 4), sd.y + Math.sin(a) * (sd.r - 4));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });

  // Brand typography on dial
  ctx.fillStyle = '#F3F4F6';
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ATELIER VOXEL', cx, cy - 170);

  ctx.fillStyle = '#F59E0B';
  ctx.font = '500 17px "JetBrains Mono", monospace';
  ctx.fillText('CALIBRE KV-09 · CHRONOGRAPHE', cx, cy - 140);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}
