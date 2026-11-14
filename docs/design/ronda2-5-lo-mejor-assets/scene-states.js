/* confia.ing · estados de la escena "el hilo".
   Fuente unica: este archivo se incrusta en la pagina (WebGL) y lo usa build.mjs
   para generar las versiones SVG estaticas de la version ligera. */
function confiaStates(N, seed) {
  var s = seed >>> 0;
  function rnd() { s += 0x6D2B79F5; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) / 1.15; }
  var TAU = Math.PI * 2, i, k;
  var pos = []; for (k = 0; k < 6; k++) pos.push(new Float32Array(N * 3));
  var role = new Float32Array(N), r1 = new Float32Array(N), r2 = new Float32Array(N);
  var nE = 0, nA = 0;
  for (i = 0; i < N; i++) { role[i] = i % 4 === 0 ? 1 : 0; if (role[i]) nE++; else nA++; r1[i] = rnd(); r2[i] = rnd(); }
  var clumps = []; for (k = 0; k < 11; k++) clumps.push([(rnd() * 2 - 1) * 1.45, (rnd() * 2 - 1) * 0.8, (rnd() * 2 - 1) * 0.4, 0.07 + rnd() * 0.2]);
  var cols = Math.ceil(Math.sqrt(nA * 2.1)), rows = Math.ceil(nA / cols);
  var lats = 12, latCount = [], latTotal = 0;
  for (k = 0; k < lats; k++) { var la = -1.25 + 2.5 * k / (lats - 1); latCount.push(Math.cos(la)); latTotal += Math.cos(la); }
  function set(st, idx, x, y, z) { pos[st][idx * 3] = x; pos[st][idx * 3 + 1] = y; pos[st][idx * 3 + 2] = z; }
  function route(t) { return [-1.42 + 2.84 * t, -0.56 + 1.08 * t + 0.2 * Math.sin(t * TAU * 1.5), 0.18 * Math.sin(t * 5)]; }
  var e = 0, a = 0;
  for (i = 0; i < N; i++) {
    var x, y, z, ang, c, t, p;
    if (role[i]) {
      t = e / Math.max(1, nE - 1); e++;
      /* 0 · un hilo que cruza el desorden */
      var br = t * TAU * 8 + (e % 3) * 2.094, bw = 0.045 * (0.35 + 0.65 * Math.sin(t * Math.PI));
      set(0, i, -1.75 + 3.5 * t, -0.1 + 0.36 * Math.sin(t * TAU * 1.1 + 0.6) + bw * Math.sin(br), 0.3 * Math.cos(t * 5) + bw * Math.cos(br));
      /* 1 · conversacion: nuestro arco */
      ang = (230 + 260 * t) * Math.PI / 180;
      set(1, i, 0.33 + 0.62 * Math.cos(ang) + gauss() * 0.012, 0.62 * Math.sin(ang) + gauss() * 0.012, -0.2 * Math.sin(ang));
      /* 2 · diagnostico: el marco de lo priorizado */
      p = t * 4; var x0 = 0.12, x1 = 0.98, y0 = -0.14, y1 = 0.5;
      if (p < 1) { x = x0 + (x1 - x0) * p; y = y1; } else if (p < 2) { x = x1; y = y1 - (y1 - y0) * (p - 1); } else if (p < 3) { x = x1 - (x1 - x0) * (p - 2); y = y0; } else { x = x0; y = y0 + (y1 - y0) * (p - 3); }
      set(2, i, x, y, 0.1);
      /* 3 · roadmap: la ruta */
      p = route(t); set(3, i, p[0], p[1], p[2]);
      /* 4 · piloto: tres ciclos de feedback */
      k = Math.min(2, Math.floor(t * 3)); ang = (k * 120 + (t * 3 - k) * 96) * Math.PI / 180;
      set(4, i, 0.46 * Math.cos(ang), 0.46 * Math.sin(ang), 0.05);
      /* 5 · transferencia: nuestra orbita, afuera */
      ang = t * TAU; x = 1.06 * Math.cos(ang); y = 1.06 * Math.sin(ang) * 0.34; z = 1.06 * Math.sin(ang) * 0.94;
      set(5, i, x * 0.94 - y * 0.34, x * 0.34 + y * 0.94, z);
    } else {
      t = a / Math.max(1, nA - 1);
      /* 0 · trabajo manual disperso */
      if (rnd() < 0.28) { x = (rnd() * 2 - 1) * 1.7; y = (rnd() * 2 - 1) * 0.95; z = (rnd() * 2 - 1) * 0.5; }
      else { c = clumps[Math.floor(rnd() * clumps.length)]; x = c[0] + gauss() * c[3]; y = c[1] + gauss() * c[3] * 0.8; z = c[2] + gauss() * c[3]; }
      set(0, i, x, y, z);
      /* 1 · tu arco; el resto sigue disperso */
      if (a % 20 < 11) { ang = (50 + 260 * rnd()) * Math.PI / 180; set(1, i, -0.33 + 0.62 * Math.cos(ang) + gauss() * 0.014, 0.62 * Math.sin(ang) + gauss() * 0.014, 0.2 * Math.sin(ang)); }
      else set(1, i, x * 1.08, y * 1.1, z);
      /* 2 · todo sobre la mesa: una reticula */
      var gc = a % cols, gr = Math.floor(a / cols);
      set(2, i, -1.45 + 2.9 * gc / (cols - 1), -0.72 + 1.44 * gr / Math.max(1, rows - 1), 0.1 * Math.sin(gc * 0.5));
      /* 3 · hitos sobre la ruta y sus carriles */
      if (a % 5 < 3) { k = a % 5 === 0 ? Math.floor(rnd() * 5) : (a + Math.floor(a / 5)) % 5; p = route(k / 4); var rr = 0.07 + 0.028 * k; ang = rnd() * TAU; var rad = rr * (0.82 + 0.18 * rnd()); set(3, i, p[0] + rad * Math.cos(ang), p[1] + rad * Math.sin(ang), p[2] + gauss() * 0.02); }
      else { var tt = rnd(); p = route(tt); var off = (a % 2 ? 1 : -1) * (0.085 + 0.07 * ((a >> 1) % 2)); set(3, i, p[0] + off * 0.35, p[1] - off, p[2]); }
      /* 4 · el circuito del piloto */
      ang = rnd() * TAU; rad = 0.74 + gauss() * 0.045; set(4, i, rad * Math.cos(ang), rad * Math.sin(ang), gauss() * 0.05);
      /* 5 · una estructura completa: paralelos de una esfera */
      var u = rnd() * latTotal, li = 0; while (li < lats - 1 && u > latCount[li]) { u -= latCount[li]; li++; }
      la = -1.25 + 2.5 * li / (lats - 1); ang = rnd() * TAU;
      set(5, i, 0.72 * Math.cos(la) * Math.cos(ang), 0.72 * Math.sin(la), 0.72 * Math.cos(la) * Math.sin(ang));
      a++;
    }
  }
  return { pos: pos, role: role, r1: r1, r2: r2 };
}
