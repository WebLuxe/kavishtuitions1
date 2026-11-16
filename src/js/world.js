/* The site once ran a 3D engine behind every page. It is gone, and these stand-ins let the
   rest of the code carry on without it. The only 3D left is the cubes in the homepage hero,
   which the browser draws by itself. */
window.KTFigs = { solid: function () { return false; } };
window.Cosmos = (function () {
  var no = function () {};
  return {
    ok: false, dimmed: false,
    s: { glyphs: 0, burst: 0, warp: 0, dim: 1, gdim: 1, mix: 1, mask: 0, maskScale: 1, sky: 0, sun: 0, alpha: 1, x: 0, y: 0, scale: 1, pitch: 0 },
    init: function () { return false; }, quality: function () { return null; },
    tick: no, start: no, wake: no, prepare: no, prepareMask: no, figure: no, glyphLayout: no, theme: no, ripple: no, lite: no
  };
})();
