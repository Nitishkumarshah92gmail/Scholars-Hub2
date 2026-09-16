import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let particles = [];
    const PARTICLE_COUNT = 80;

    function resize() {
      if (!canvas || !parent) return;
      canvas.width = parent.offsetWidth * window.devicePixelRatio;
      canvas.height = parent.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function createParticles() {
      particles = [];
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.5 + 0.5,
          dx: (Math.random() - 0.5) * 0.2, // slower movement
          dy: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleDir: Math.random() > 0.5 ? 1 : -1,
        });
      }
    }

    function draw() {
      if (!parent) return;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        
        // Twinkle effect
        p.opacity += p.twinkleSpeed * p.twinkleDir;
        if (p.opacity >= 1) {
            p.opacity = 1;
            p.twinkleDir = -1;
        } else if (p.opacity <= 0.1) {
            p.opacity = 0.1;
            p.twinkleDir = 1;
        }

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        // Antigravity blueish star color
        ctx.fillStyle = `rgba(138, 180, 248, ${p.opacity})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      resize();
      createParticles();
    });
    
    resizeObserver.observe(parent);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="particles-canvas absolute inset-0 w-full h-full pointer-events-none z-0" />;
}
