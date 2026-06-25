import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReduced = mediaQuery.matches;

    const handleMediaChange = (e: MediaQueryListEvent) => {
      isReduced = e.matches;
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Color palette matching the Antigravity monochrome styling
    const colors = [
      "rgba(0, 0, 0, ",       // Pure Black
      "rgba(20, 20, 20, ",    // Dark Charcoal
      "rgba(60, 60, 60, ",    // Slate Gray
      "rgba(140, 140, 140, ",  // Cool Gray
    ];

    const particles: Particle[] = [];
    const particleCount = Math.min(110, Math.floor((width * height) / 15000));

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2, // slower, more majestic floating motion
        vy: (Math.random() - 0.5) * 0.2,
        radius: Math.random() * 3.0 + 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Draw / Animation loop
    const animate = () => {
      if (isReduced) {
        // Draw static beautiful particles if reduced motion is preferred
        ctx.clearRect(0, 0, width, height);
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.alpha + ")";
          ctx.fill();
        });
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Damp mouse interpolation for smooth lag effect
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      // Mouse parallax offsets
      const offsetX = (mouseRef.current.x - width / 2) * 0.02;
      const offsetY = (mouseRef.current.y - height / 2) * 0.02;

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;

      // Draw and update particles
      particles.forEach((p, idx) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap boundaries
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // Apply mouse parallax offset to actual rendering position
        const renderX = p.x + offsetX * (p.radius * 0.3);
        const renderY = p.y + offsetY * (p.radius * 0.3);

        // Draw particle
        ctx.beginPath();
        ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ")";
        ctx.fill();

        // Optional depth blur glow for larger floating dots
        if (p.radius > 3.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color + "0.2)";
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.radius + 1, 0, Math.PI * 2);
          ctx.fillStyle = p.color + "0.05)";
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }

        // Draw connection from mouse to this particle if close
        const mdx = renderX - mouseX;
        const mdy = renderY - mouseY;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < 140) {
          const mAlpha = (1 - mdist / 140) * 0.18;
          ctx.beginPath();
          ctx.moveTo(renderX, renderY);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(0, 0, 0, ${mAlpha})`;
          ctx.lineWidth = 0.55;
          ctx.stroke();
        }

        // Draw connections between close particles (Antigravity web look)
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const r2X = p2.x + offsetX * (p2.radius * 0.3);
          const r2Y = p2.y + offsetY * (p2.radius * 0.3);

          const dx = renderX - r2X;
          const dy = renderY - r2Y;
          const dist = Math.hypot(dx, dy);

          if (dist < 120) {
            const lineAlpha = (1 - dist / 120) * 0.12;
            ctx.beginPath();
            ctx.moveTo(renderX, renderY);
            ctx.lineTo(r2X, r2Y);
            ctx.strokeStyle = `rgba(0, 0, 0, ${lineAlpha})`;
            ctx.lineWidth = 0.45;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.55 }}
    />
  );
}
