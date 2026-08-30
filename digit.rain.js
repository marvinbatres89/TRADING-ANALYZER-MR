(function () {
  "use strict";

  const canvas = document.getElementById("rainCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const chars = "0123456789";

  let columns = 0;
  let drops = [];
  let fontSize = 16;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    fontSize = window.innerWidth < 620 ? 14 : 16;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }, () =>
      Math.floor((Math.random() * canvas.height) / fontSize) * -1
    );
  }

  function draw() {
    ctx.fillStyle = "rgba(3,20,30,0.16)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${fontSize}px 'IBM Plex Mono', monospace`;

    for (let i = 0; i < columns; i += 1) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      const leading = Math.random() > 0.93;
      ctx.fillStyle = leading ? "rgba(166,255,239,0.9)" : "rgba(123,240,224,0.28)";
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
    setInterval(draw, 70);
  } else {
    draw();
  }
})();
