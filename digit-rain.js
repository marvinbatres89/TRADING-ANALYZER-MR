(function () {
  "use strict";

  const canvas = document.getElementById("rainCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const chars = "0123456789";

  let columns = 0;
  let drops = [];
  let fontSize = 16;
  let watermarkPulse = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fontSize = window.innerWidth < 620 ? 14 : 16;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () =>
      Math.floor((Math.random() * canvas.height) / fontSize) * -1
    );
  }

  function drawWatermark() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const scale = Math.min(canvas.width, canvas.height) * 0.62;

    watermarkPulse += 0.004;
    const glow = 0.05 + Math.sin(watermarkPulse) * 0.018;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.12);
    ctx.font = `700 ${scale}px 'Playfair Display', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(232,190,109,${glow})`;
    ctx.fillText("MR", 0, 0);
    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = "rgba(10,8,6,0.14)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawWatermark();

    ctx.font = `${fontSize}px 'IBM Plex Mono', monospace`;

    for (let i = 0; i < columns; i += 1) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      const leading = Math.random() > 0.94;
      ctx.fillStyle = leading ? "rgba(248,223,160,0.75)" : "rgba(201,138,79,0.18)";
      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 1;
    }
  }

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  resize();
  window.addEventListener("resize", resize);

  if (!reduceMotion) {
    setInterval(draw, 75);
  } else {
    drawWatermark();
  }
})();
