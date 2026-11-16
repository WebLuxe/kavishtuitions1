// Writes a clearly labelled two-page sample PDF for a chapter that has no real notes yet.
// No libraries: a PDF is just text objects plus a table of byte offsets.
// The output is the same every build, so git only sees a change when a chapter changes.

/* Characters the built-in PDF fonts can show (WinAnsi). Anything else is spelled out. */
const WIN = { '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97, '•': 0x95, '½': 0xbd, '²': 0xb2, '³': 0xb3, '×': 0xd7, '·': 0xb7, '°': 0xb0 };
const SPELL = { '−': '-', 'θ': 'theta', 'α': 'alpha', 'ˣ': '^x', 'π': 'pi' };
function str(t) {
  let o = '(';
  for (const ch of String(t)) {
    const s = SPELL[ch];
    if (s) { o += s; continue; }
    const c = WIN[ch] || ch.charCodeAt(0);
    if (ch === '(' || ch === ')' || ch === '\\') o += '\\' + ch;
    else if (c < 32 || c > 255) o += '?';
    else if (c > 126) o += '\\' + c.toString(8).padStart(3, '0');
    else o += ch;
  }
  return o + ')';
}
/* rough Helvetica widths, good enough to wrap lines */
const width = (t, size, bold) => String(t).length * size * (bold ? .56 : .5);
function wrap(t, size, max, bold) {
  const out = []; let line = '';
  for (const w of String(t).split(/\s+/)) {
    const next = line ? line + ' ' + w : w;
    if (line && width(next, size, bold) > max) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

const W = 595, H = 842, M = 56; // A4 in points, page margin
const VIOLET = '0.486 0.361 1', CYAN = '0.133 0.827 0.933', INK = '0.11 0.11 0.2', MUTE = '0.45 0.47 0.58', BAR = '0.88 0.89 0.93';

function page() {
  const ops = [];
  const api = {
    ops,
    text(x, y, t, size, o = {}) { ops.push(`BT /${o.bold ? 'F2' : 'F1'} ${size} Tf ${o.color || INK} rg ${x} ${y} Td ${str(t)} Tj ET`); },
    rect(x, y, w, h, color) { ops.push(`${color} rg ${x} ${y} ${w} ${h} re f`); },
    line(x, y, w, color) { ops.push(`${color} RG 0.8 w ${x} ${y} m ${x + w} ${y} l S`); },
    box(x, y, w, h, color) { ops.push(`${color} RG 1 w ${x} ${y} ${w} ${h} re S`); },
    /* grey bars that stand in for lines of notes */
    filler(x, y, w, n, seed) {
      for (let i = 0; i < n; i++) {
        const f = .55 + ((seed * 37 + i * 53) % 40) / 100;
        api.rect(x, y - i * 15, Math.round(w * (i === n - 1 ? f * .6 : f)), 6, BAR);
      }
      return y - n * 15;
    },
    watermark() { ops.push(`q 0.955 0.95 0.99 rg BT /F2 120 Tf 0.707 0.707 -0.707 0.707 150 250 Tm ${str('SAMPLE')} Tj ET Q`); }
  };
  return api;
}

function footer(p, info, n, of) {
  p.line(M, 48, W - 2 * M, BAR);
  p.text(M, 32, `Kavish Maths  ·  ${info.course}  ·  Chapter ${info.num}  ·  Sample notes`, 8.5, { color: MUTE });
  p.text(W - M - 40, 32, `Page ${n} of ${of}`, 8.5, { color: MUTE });
}

function samplePdf(info) {
  // info: { num, title, course, board, code, subtopics }
  const subs = info.subtopics.slice(0, 5), seed = info.num + info.title.length;

  /* page 1: title, what's covered, key ideas */
  const a = page();
  a.watermark();
  a.rect(0, H - 150, W, 150, VIOLET);
  a.rect(0, H - 154, W, 4, CYAN);
  a.text(M, H - 52, `KAVISH MATHS  ·  ${info.board.toUpperCase()}${info.code ? '  (' + info.code + ')' : ''}`, 8.5, { bold: true, color: '1 1 1' });
  a.text(M, H - 80, `Chapter ${info.num}`, 13, { color: '0.88 0.86 1' });
  let y = H - 108;
  for (const l of wrap(info.title, 26, W - 2 * M, true).slice(0, 2)) { a.text(M, y, l, 26, { bold: true, color: '1 1 1' }); y -= 28; }

  y = H - 196;
  a.rect(M, y - 44, W - 2 * M, 56, '1 0.96 0.86');
  a.rect(M, y - 44, 4, 56, '0.96 0.62 0.04');
  a.text(M + 16, y - 6, 'Sample notes for testing the website', 11, { bold: true, color: '0.47 0.27 0' });
  a.text(M + 16, y - 24, 'These pages are a placeholder. Kavish’s real notes for this chapter will replace them.', 9.5, { color: '0.47 0.27 0' });

  y -= 84;
  a.text(M, y, 'What this chapter covers', 15, { bold: true });
  y -= 24;
  subs.forEach((s, i) => {
    a.rect(M, y - 3, 14, 14, CYAN);
    a.text(M + 4.2, y, String(i + 1), 9, { bold: true, color: '1 1 1' });
    a.text(M + 24, y, s, 11);
    y -= 20;
  });

  y -= 18;
  a.text(M, y, 'Key ideas', 15, { bold: true });
  y -= 26;
  subs.slice(0, 3).forEach((s, i) => {
    a.text(M, y, s, 11.5, { bold: true, color: VIOLET });
    y = a.filler(M, y - 16, W - 2 * M, 3, seed + i) - 14;
  });
  footer(a, info, 1, 2);

  /* page 2: worked examples and practice */
  const b = page();
  b.watermark();
  y = H - 70;
  b.text(M, y, 'Worked examples', 15, { bold: true });
  y -= 18;
  for (let i = 1; i <= 2; i++) {
    const h = 132;
    b.box(M, y - h, W - 2 * M, h, BAR);
    b.rect(M, y - 24, W - 2 * M, 24, '0.96 0.95 1');
    b.text(M + 12, y - 16, `Example ${i}  ·  ${subs[(i - 1) % subs.length]}`, 10.5, { bold: true, color: VIOLET });
    b.filler(M + 12, y - 44, W - 2 * M - 24, 2, seed + i * 3);
    b.text(M + 12, y - 84, 'Solution', 9.5, { bold: true, color: MUTE });
    b.filler(M + 12, y - 100, W - 2 * M - 24, 2, seed + i * 5);
    y -= h + 16;
  }
  y -= 10;
  b.text(M, y, 'Practice questions', 15, { bold: true });
  y -= 24;
  for (let i = 1; i <= 5; i++) {
    b.text(M, y, i + '.', 11, { bold: true });
    b.filler(M + 20, y + 1, W - 2 * M - 20, 1, seed + i * 7);
    y -= 28;
  }
  y -= 6;
  b.rect(M, y - 34, W - 2 * M, 40, '0.93 0.98 0.99');
  b.text(M + 14, y - 18, 'Answers are given in class. Message Kavish on WhatsApp if you get stuck.', 9.5, { color: '0.05 0.4 0.45' });
  footer(b, info, 2, 2);

  /* assemble the file */
  const pages = [a, b], objs = [];
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => (5 + i * 2) + ' 0 R').join(' ')}] /Count ${pages.length} >>`;
  objs[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objs[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  pages.forEach((p, i) => {
    const s = p.ops.join('\n');
    objs[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`;
    objs[6 + i * 2] = `<< /Length ${Buffer.byteLength(s, 'latin1')} >>\nstream\n${s}\nendstream`;
  });
  const info_ = objs.length;
  objs[info_] = `<< /Title ${str(`Chapter ${info.num}: ${info.title} (sample notes)`)} /Author (Kavish Maths) >>`;
  let out = '%PDF-1.4\n%âãÏÓ\n';
  const offs = [];
  for (let i = 1; i < objs.length; i++) { offs[i] = Buffer.byteLength(out, 'latin1'); out += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xref = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${objs.length}\n0000000000 65535 f \n` + offs.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${objs.length} /Root 1 0 R /Info ${info_} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

module.exports = { samplePdf };
