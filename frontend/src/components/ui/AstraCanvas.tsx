import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  alpha: number;
  color: string;
  twinkleSpeed: number;
  twinkleOffset: number;
  type: 'star' | 'dot' | 'cross' | 'ring';
}

const COLORS = [
  'rgba(20,184,166,',
  'rgba(139,92,246,',
  'rgba(59,130,246,',
  'rgba(255,255,255,',
  'rgba(99,102,241,',
  'rgba(20,184,166,',
  'rgba(255,255,255,',
];

interface AstraCanvasProps {
  density?: number; // particles per 6000px²  (default 1)
  repulseRadius?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const AstraCanvas: React.FC<AstraCanvasProps> = ({
  density = 1,
  repulseRadius = 130,
  className = 'absolute inset-0 w-full h-full',
  style,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const animRef  = useRef<number>(0);
  const particles = useRef<Particle[]>([]);
  const time = useRef(0);

  const init = useCallback((w: number, h: number) => {
    const count = Math.min(Math.floor((w * h) / 6000 * density), 200);
    particles.current = Array.from({ length: count }, () => {
      const r = Math.random() * 1.8 + 0.4;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: r,
        baseRadius: r,
        alpha: Math.random() * 0.55 + 0.2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinkleOffset: Math.random() * Math.PI * 2,
        type: (['star', 'dot', 'dot', 'cross', 'ring'] as const)[Math.floor(Math.random() * 5)],
      };
    });
  }, [density]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init(canvas.width, canvas.height);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    window.addEventListener('mousemove', onMove);

    /* ── Draw helpers ── */
    const drawStar = (x: number, y: number, r: number) => {
      const spikes = 4, inner = r * 0.38;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(x + Math.cos(rot) * r, y + Math.sin(rot) * r); rot += step;
        ctx.lineTo(x + Math.cos(rot) * inner, y + Math.sin(rot) * inner); rot += step;
      }
      ctx.closePath();
    };

    const drawCross = (x: number, y: number, r: number) => {
      const arm = r * 1.7;
      ctx.beginPath();
      ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y);
      ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm);
    };

    /* ── Animation loop ── */
    const animate = () => {
      time.current += 1;
      const w = canvas.width, h = canvas.height;
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      ctx.clearRect(0, 0, w, h);

      const ps = particles.current;

      /* Constellation lines */
      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y;
          const d = Math.hypot(dx, dy);
          if (d < 85) {
            ctx.beginPath();
            ctx.moveTo(ps[i].x, ps[i].y);
            ctx.lineTo(ps[j].x, ps[j].y);
            ctx.strokeStyle = `rgba(20,184,166,${0.07 * (1 - d / 85)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      /* Particles */
      for (const p of ps) {
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.hypot(dx, dy);

        if (dist < repulseRadius && dist > 0) {
          const f = (repulseRadius - dist) / repulseRadius;
          p.vx += (dx / dist) * f * 0.38;
          p.vy += (dy / dist) * f * 0.38;
        }

        p.vx *= 0.94; p.vy *= 0.94;
        const spd = Math.hypot(p.vx, p.vy);
        if (spd > 2.4) { p.vx = p.vx / spd * 2.4; p.vy = p.vy / spd * 2.4; }
        p.vx += (Math.random() - 0.5) * 0.018;
        p.vy += (Math.random() - 0.5) * 0.018;
        p.x += p.vx; p.y += p.vy;

        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        const tw = 0.5 + 0.5 * Math.sin(time.current * p.twinkleSpeed + p.twinkleOffset);
        const al = p.alpha * (0.45 + 0.55 * tw);
        p.radius = p.baseRadius * (0.8 + 0.35 * tw);

        ctx.save();
        ctx.globalAlpha = al;
        ctx.fillStyle   = `${p.color}${al})`;
        ctx.strokeStyle = `${p.color}${al * 0.9})`;
        ctx.lineWidth   = 0.9;
        ctx.shadowBlur  = p.radius * 4;
        ctx.shadowColor = `${p.color}0.8)`;

        if (p.type === 'star') {
          drawStar(p.x, p.y, p.radius * 2.4); ctx.fill();
        } else if (p.type === 'cross') {
          drawCross(p.x, p.y, p.radius); ctx.stroke();
        } else if (p.type === 'ring') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.4, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      /* Cursor aura */
      if (mx > 0 && mx < w && my > 0 && my < h) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
        g.addColorStop(0,   'rgba(20,184,166,0.13)');
        g.addColorStop(0.5, 'rgba(139,92,246,0.06)');
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(mx, my, 90, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, [init, repulseRadius]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: 'block', pointerEvents: 'none', ...style }}
    />
  );
};
