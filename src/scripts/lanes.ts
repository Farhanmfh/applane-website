// Hero 3D scene: particles flow along "lanes", then assemble into a phone (apps)
// and a browser window with a spinning globe (websites) as the visitor scrolls.
// One point-sprite draw call in plain WebGL, so no 3D library has to download.
// Loaded only after first paint, paused off-screen, never loaded for reduced motion.

type Mat4 = Float32Array;

function perspective(fovDeg: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(eye: number[], target: number[]): Mat4 {
  let zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz);
  zx /= l; zy /= l; zz /= l;
  // x axis = world up (0, 1, 0) × z
  let xx = zz, xy = 0, xz = -zx;
  l = Math.hypot(xx, xy, xz);
  xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

/** translate · rotateX · rotateY · uniform scale, column-major. */
function model(tx: number, ty: number, rx: number, ry: number, sc: number): Mat4 {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
  return new Float32Array([
    cy * sc, sx * sy * sc, -cx * sy * sc, 0,
    0, cx * sc, sx * sc, 0,
    sy * sc, -sx * cy * sc, cx * cy * sc, 0,
    tx, ty, 0, 1,
  ]);
}

type Opts = {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  panels: HTMLElement[];
  onReady?: () => void;
};

const TAU = Math.PI * 2;

function pickCount() {
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  if (mem <= 2 || cores <= 2) return 2600;
  if (w < 700) return 4200;
  if (w < 1100) return 6500;
  return 9000;
}

// Simple seeded RNG so the shapes are identical on every load.
function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roundedRectPoint(w: number, h: number, r: number, u: number): [number, number] {
  // Point at fraction u along the perimeter of a rounded rectangle centred on 0.
  const sw = w - 2 * r, sh = h - 2 * r, arc = (Math.PI / 2) * r;
  const per = 2 * sw + 2 * sh + 4 * arc;
  let d = u * per;
  const seg: [number, () => [number, number]][] = [
    [sw, () => [-sw / 2 + d, h / 2]],
    [arc, () => { const a = Math.PI / 2 - d / r; return [sw / 2 + r * Math.cos(a), sh / 2 + r * Math.sin(a)]; }],
    [sh, () => [w / 2, sh / 2 - d]],
    [arc, () => { const a = -d / r; return [sw / 2 + r * Math.cos(a), -sh / 2 + r * Math.sin(a)]; }],
    [sw, () => [sw / 2 - d, -h / 2]],
    [arc, () => { const a = -Math.PI / 2 - d / r; return [-sw / 2 + r * Math.cos(a), -sh / 2 + r * Math.sin(a)]; }],
    [sh, () => [-w / 2, -sh / 2 + d]],
    [arc, () => { const a = Math.PI - d / r; return [-sw / 2 + r * Math.cos(a), sh / 2 + r * Math.sin(a)]; }],
  ];
  for (const [len, fn] of seg) {
    if (d <= len) return fn();
    d -= len;
  }
  return [-w / 2, h / 2];
}

function buildShapes(n: number) {
  const R = rng(11);
  const lane = new Float32Array(n * 3);
  const phone = new Float32Array(n * 3);
  const web = new Float32Array(n * 4);
  const rand = new Float32Array(n * 4);
  const color = new Float32Array(n * 3);

  const palette = [
    [0.09, 0.82, 0.43], // bright green
    [0.61, 0.91, 0.75], // pale green
    [0.04, 0.54, 0.28], // brand green
    [0.86, 1.0, 0.93], // near white
  ];

  const LANES = 9;
  for (let i = 0; i < n; i++) {
    const r0 = R(), r1 = R(), r2 = R(), r3 = R();
    rand.set([r0, r1, r2, r3], i * 4);

    const c = r1 < 0.42 ? palette[0] : r1 < 0.72 ? palette[1] : r1 < 0.92 ? palette[2] : palette[3];
    color.set(c, i * 3);

    // Lanes: rows of particles on a floor; ambient dust for the rest (r3 < 0.12).
    if (r3 < 0.12) {
      lane.set([(R() - 0.5) * 18, (R() - 0.3) * 7, -R() * 22 + 2], i * 3);
    } else {
      const k = Math.floor(R() * LANES);
      const x0 = (k - (LANES - 1) / 2) * 0.95;
      lane.set([x0 + (R() - 0.5) * 0.12, -1.7 + (R() - 0.5) * 0.06, R() * 34], i * 3);
    }

    // Phone: outline, header bar, bill rows, total, button, screen haze.
    const u = R();
    let px = 0, py = 0, pz = (R() - 0.5) * 0.06;
    const W = 1.75, H = 3.5;
    if (u < 0.3) {
      [px, py] = roundedRectPoint(W, H, 0.28, R());
      pz = R() < 0.5 ? -0.09 : 0.09;
    } else if (u < 0.36) {
      [px, py] = roundedRectPoint(W - 0.16, H - 0.16, 0.2, R());
    } else if (u < 0.44) {
      px = (R() - 0.5) * (W - 0.4); py = 1.28 + (R() - 0.5) * 0.22;
    } else if (u < 0.7) {
      const row = Math.floor(R() * 6);
      const y = 0.9 - row * 0.3;
      if (R() < 0.62) { px = -0.68 + R() * (0.55 + ((row * 37) % 5) * 0.08); }
      else { px = 0.32 + R() * 0.36; }
      py = y + (R() - 0.5) * 0.035;
    } else if (u < 0.77) {
      px = (R() - 0.5) * (W - 0.4); py = -0.95 + (R() - 0.5) * 0.02;
      if (R() < 0.5) { px = 0.2 + R() * 0.48; py = -1.12 + (R() - 0.5) * 0.06; }
    } else if (u < 0.88) {
      [px, py] = roundedRectPoint(1.25, 0.32, 0.16, R());
      py -= 1.42;
      if (R() < 0.4) { px = (R() - 0.5) * 1.1; py = -1.42 + (R() - 0.5) * 0.2; }
    } else {
      px = (R() - 0.5) * (W - 0.3); py = (R() - 0.5) * (H - 0.3); pz = -0.05 - R() * 0.2;
    }
    phone.set([px, py, pz], i * 3);

    // Browser window: frame, address bar, dots, text block, button, globe.
    const v = R();
    let wx = 0, wy = 0, wz = (R() - 0.5) * 0.05, sphere = 0;
    const BW = 4.6, BH = 2.9;
    if (v < 0.2) {
      [wx, wy] = roundedRectPoint(BW, BH, 0.18, R());
      wz = R() < 0.5 ? -0.06 : 0.06;
    } else if (v < 0.25) {
      wx = (R() - 0.5) * BW; wy = BH / 2 - 0.34;
    } else if (v < 0.28) {
      const dot = Math.floor(R() * 3);
      const a = R() * TAU, rr = Math.sqrt(R()) * 0.06;
      wx = -BW / 2 + 0.25 + dot * 0.2 + Math.cos(a) * rr; wy = BH / 2 - 0.17 + Math.sin(a) * rr;
    } else if (v < 0.36) {
      const line = Math.floor(R() * 2);
      wx = -1.95 + R() * (line === 0 ? 1.7 : 1.25); wy = 0.62 - line * 0.32 + (R() - 0.5) * 0.12;
    } else if (v < 0.45) {
      const line = Math.floor(R() * 3);
      wx = -1.95 + R() * (line === 2 ? 1.1 : 1.6); wy = -0.12 - line * 0.17 + (R() - 0.5) * 0.02;
    } else if (v < 0.52) {
      [wx, wy] = roundedRectPoint(0.9, 0.28, 0.14, R());
      wx += -1.5; wy -= 0.95;
    } else if (v < 0.9) {
      // Fibonacci sphere, rotated in the shader.
      const k = R();
      const phi = Math.acos(1 - 2 * k);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const rad = 0.85;
      wx = 1.15 + rad * Math.sin(phi) * Math.cos(theta);
      wy = -0.15 + rad * Math.cos(phi);
      wz = 0.25 + rad * Math.sin(phi) * Math.sin(theta);
      sphere = 1;
    } else {
      wx = (R() - 0.5) * (BW - 0.2); wy = (R() - 0.5) * (BH - 0.5) - 0.15; wz = -0.08 - R() * 0.2;
    }
    web.set([wx, wy, wz, sphere], i * 4);
  }
  return { lane, phone, web, rand, color };
}

const vertex = /* glsl */ `
  precision highp float;
  uniform mat4 uProj;
  uniform mat4 uMV;
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixel;
  attribute vec3 aLane;
  attribute vec3 aPhone;
  attribute vec4 aWeb;
  attribute vec4 aRand;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;

  vec3 lanePos(vec3 p, vec4 r) {
    if (r.w < 0.12) {
      return p + vec3(0.0, sin(uTime * 0.3 + r.x * 6.2831) * 0.18, 0.0);
    }
    float L = 34.0;
    float z = mod(p.z + uTime * (1.1 + r.y * 0.7), L) - 26.0;
    float x = p.x + sin(z * 0.16 + uTime * 0.25) * 1.1;
    float y = p.y + sin(z * 0.22 + p.x * 0.7 + uTime * 0.4) * 0.2;
    return vec3(x, y, z);
  }

  float stage(float m, float r) {
    float t = clamp((m - r * 0.35) / 0.65, 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  void main() {
    vec3 a = lanePos(aLane, aRand);

    vec3 b = aPhone + vec3(0.0, sin(uTime * 0.8 + aRand.y * 6.2831) * 0.008, 0.0);

    vec3 c = aWeb.xyz;
    if (aWeb.w > 0.5) {
      vec3 ctr = vec3(1.15, -0.15, 0.25);
      vec3 q = c - ctr;
      float ang = uTime * 0.45;
      float cs = cos(ang), sn = sin(ang);
      q = vec3(q.x * cs - q.z * sn, q.y, q.x * sn + q.z * cs);
      c = ctr + q;
    }

    float e1 = stage(uMorph, aRand.x);
    float e2 = stage(uMorph - 1.0, aRand.x);
    vec3 p = mix(mix(a, b, e1), c, e2);
    float burst = sin(3.14159 * e1) + sin(3.14159 * e2);
    p += (aRand.yzw - 0.5) * burst * 1.8;

    vec4 mv = uMV * vec4(p, 1.0);
    gl_Position = uProj * mv;

    float shapeK = max(e1, e2);
    float size = uSize * (0.55 + aRand.z * 0.9) * mix(1.0, 0.36, shapeK);
    if (aWeb.w > 0.5) size *= mix(1.0, 1.2, e2);
    gl_PointSize = size * uPixel * (6.0 / max(0.5, -mv.z));

    float laneA = smoothstep(-26.0, -12.0, a.z) * (1.0 - smoothstep(2.5, 7.0, a.z));
    if (aRand.w < 0.12) laneA = 0.45;
    vAlpha = mix(laneA, 0.8, shapeK);
    vColor = aColor;
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = pow(smoothstep(0.5, 0.0, d), 1.7);
    gl_FragColor = vec4(vColor * (0.55 + a * 0.9), a * vAlpha);
  }
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
  return sh;
}

export function start({ canvas, stage, panels, onReady }: Opts) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('no webgl');

  const lowPower = (navigator.hardwareConcurrency || 4) <= 4;
  const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.75);

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vertex));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fragment));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
  gl.useProgram(prog);

  const n = pickCount();
  const s = buildShapes(n);
  const attrs: [string, Float32Array, number][] = [
    ['aLane', s.lane, 3], ['aPhone', s.phone, 3], ['aWeb', s.web, 4], ['aRand', s.rand, 4], ['aColor', s.color, 3],
  ];
  for (const [name, data, size] of attrs) {
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) continue;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  const u = {
    proj: gl.getUniformLocation(prog, 'uProj'),
    mv: gl.getUniformLocation(prog, 'uMV'),
    time: gl.getUniformLocation(prog, 'uTime'),
    morph: gl.getUniformLocation(prog, 'uMorph'),
    size: gl.getUniformLocation(prog, 'uSize'),
    pixel: gl.getUniformLocation(prog, 'uPixel'),
  };
  gl.uniform1f(u.size, window.innerWidth < 700 ? 15 : 13);
  gl.uniform1f(u.pixel, dpr);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  const FOV = 50;
  let aspect = 1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let morph = 0;
  let targetMorph = 0;
  let w = 0, h = 0;

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    aspect = w / h;
    gl.uniformMatrix4fv(u.proj, false, perspective(FOV, aspect, 0.1, 80));
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const readScroll = () => {
    const vh = window.innerHeight;
    let m = 0;
    for (const p of panels) {
      const top = p.getBoundingClientRect().top;
      m += Math.min(1, Math.max(0, (vh * 0.95 - top) / (vh * 0.6)));
    }
    targetMorph = m;
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();
  morph = targetMorph;

  let running = false;
  let raf = 0;
  let last = performance.now();
  let time = 0;

  const draw = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    morph += (targetMorph - morph) * Math.min(1, dt * 4.5);
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 3);

    const shapeMix = Math.min(1, morph);
    const wide = w / h > 0.95;
    // Half the visible width at the shape's depth, so shapes always fit the screen.
    const hw = Math.tan((FOV * Math.PI) / 360) * 6 * aspect;
    const shapeW = 1.75 + (4.6 - 1.75) * Math.min(1, Math.max(0, morph - 1));
    // Desktop: shapes sit in the right half, beside the text. Phones: above it, smaller.
    const fit = wide ? Math.min(1, (hw - 0.4) / (shapeW * 1.08)) : Math.min(0.68, (hw * 2 - 0.3) / (shapeW * 1.05));
    const gx = wide ? ((0.15 + hw - 0.25) / 2) * shapeMix : 0;
    const gy = wide ? 0 : -0.55 * (1 - shapeMix) + 1.05 * shapeMix;
    // On narrow screens the lanes are pulled in so they read as a road, not a wall of lines.
    const laneScale = wide ? 1 : 0.62;
    const scale = laneScale + (fit - laneScale) * shapeMix;
    const ry = pointer.x * 0.22 * (0.4 + shapeMix) + Math.sin(time * 0.35) * 0.22 * shapeMix;
    const rx = pointer.y * 0.08 + 0.04 * shapeMix;

    const view = lookAt([0, 0.8 * (1 - shapeMix), 6], [0, -0.45 * (1 - shapeMix), -6]);
    gl.uniformMatrix4fv(u.mv, false, multiply(view, model(gx, gy, rx, ry, scale)));
    gl.uniform1f(u.time, time);
    gl.uniform1f(u.morph, morph);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, n);
  };

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    draw(now);
  };

  const play = () => {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  let inView = true;
  const io = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView && !document.hidden) play(); else pause();
  });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(); else if (inView) play();
  });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    pause();
    stage.classList.remove('has-3d');
  });

  // Draw one frame before revealing the canvas so it fades in fully drawn.
  draw(performance.now());
  onReady?.();
  if (inView) play();
}
