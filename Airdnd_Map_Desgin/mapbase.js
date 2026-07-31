// Procedural light-theme map background. Algorithmically generated (not hand-drawn):
// seeded PRNG lays down water, parks and a jittered road grid in muted Google-style tones.
function buildMapSVG(w, h) {
  // small seeded PRNG so the map is stable across renders
  let s = 20260610;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const jit = (amt) => (rnd() - 0.5) * amt;

  const C = {
    land: "#e7eb", // placeholder, set below
  };
  const land = "#e8ecee";
  const block = "#eef1f3";
  const water = "#c4dcea";
  const waterEdge = "#aaccdd";
  const park = "#d4e8cf";
  const roadCase = "#dfe3e6";
  const roadFill = "#ffffff";
  const roadMinor = "#f4f6f7";

  let parts = [];
  parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="${land}"/>`);

  // ---- Water: a river sweeping across, plus a lake ----
  const riverPts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    riverPts.push([t * w, h * 0.62 + Math.sin(t * 6) * 70 + jit(40)]);
  }
  const riverPath = riverPts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(0) + " " + p[1].toFixed(0)).join(" ");
  parts.push(`<path d="${riverPath}" fill="none" stroke="${water}" stroke-width="74" stroke-linecap="round" stroke-linejoin="round"/>`);
  parts.push(`<path d="${riverPath}" fill="none" stroke="${waterEdge}" stroke-width="78" stroke-linecap="round" stroke-linejoin="round" opacity="0.35"/>`);
  parts.push(`<path d="${riverPath}" fill="none" stroke="${water}" stroke-width="74" stroke-linecap="round" stroke-linejoin="round"/>`);
  // lake
  parts.push(`<ellipse cx="${w * 0.84}" cy="${h * 0.2}" rx="110" ry="78" fill="${water}"/>`);

  // ---- Parks ----
  const parks = [
    [w * 0.16, h * 0.18, 150, 120],
    [w * 0.62, h * 0.78, 190, 130],
    [w * 0.4, h * 0.46, 120, 100],
  ];
  parks.forEach(([x, y, pw, ph]) => {
    parts.push(`<rect x="${x}" y="${y}" width="${pw}" height="${ph}" rx="26" fill="${park}"/>`);
  });

  // ---- Block tint between roads (subtle) ----
  const gx = 9, gy = 7;
  const cellW = w / gx, cellH = h / gy;
  for (let i = 0; i < gx; i++) {
    for (let j = 0; j < gy; j++) {
      if (rnd() < 0.5) continue;
      const bx = i * cellW + 14 + jit(8);
      const by = j * cellH + 14 + jit(8);
      parts.push(`<rect x="${bx.toFixed(0)}" y="${by.toFixed(0)}" width="${(cellW - 32).toFixed(0)}" height="${(cellH - 32).toFixed(0)}" rx="8" fill="${block}" opacity="0.7"/>`);
    }
  }

  // ---- Road grid (jittered). Casing first, then fill. ----
  const vLines = [], hLines = [];
  for (let i = 1; i < gx; i++) {
    const x = i * cellW + jit(26);
    vLines.push({ x, major: i % 2 === 0 });
  }
  for (let j = 1; j < gy; j++) {
    const y = j * cellH + jit(26);
    hLines.push({ y, major: j % 2 === 1 });
  }
  const drawLine = (x1, y1, x2, y2, wdt, col) =>
    `<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="${col}" stroke-width="${wdt}" stroke-linecap="round"/>`;
  // casing
  vLines.forEach((l) => parts.push(drawLine(l.x, -10, l.x + jit(30), h + 10, l.major ? 13 : 7, roadCase)));
  hLines.forEach((l) => parts.push(drawLine(-10, l.y, w + 10, l.y + jit(30), l.major ? 13 : 7, roadCase)));
  // a couple diagonals for variety
  parts.push(drawLine(0, h * 0.32, w, h * 0.12, 13, roadCase));
  parts.push(drawLine(w * 0.2, 0, w * 0.5, h, 9, roadCase));
  // fill
  vLines.forEach((l) => parts.push(drawLine(l.x, -10, l.x + jit(30), h + 10, l.major ? 9 : 4, l.major ? roadFill : roadMinor)));
  hLines.forEach((l) => parts.push(drawLine(-10, l.y, w + 10, l.y + jit(30), l.major ? 9 : 4, l.major ? roadFill : roadMinor)));
  parts.push(drawLine(0, h * 0.32, w, h * 0.12, 9, roadFill));
  parts.push(drawLine(w * 0.2, 0, w * 0.5, h, 5, roadFill));

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">${parts.join("")}</svg>`;
}

window.buildMapSVG = buildMapSVG;
