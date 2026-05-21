"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  z: number;
  size: number;
  twinkle: number;
  twinkleSpeed: number;
};

type Comet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
};

/**
 * StarField — статичное звёздное поле с параллаксом по скроллу и медленным
 * дрейфом + редкие кометы. Рендерится в <canvas>, прибит к viewport.
 *
 * Производительность: 1 RAF, прозрачное canvas над BG, не вычисляет на off-screen,
 * учитывает devicePixelRatio, прерывается prefers-reduced-motion.
 */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let stars: Star[] = [];
    let comets: Comet[] = [];
    let raf = 0;
    let lastT = performance.now();
    let cometCooldown = 4_000;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const density = Math.floor((window.innerWidth * window.innerHeight) / 4_500);
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 1.6, // запас для скролла
        z: Math.random(),
        size: Math.random() * 1.4 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.4 + Math.random() * 1.2
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const spawnComet = () => {
      const fromLeft = Math.random() > 0.5;
      const angle = (Math.random() * 0.3 + 0.15) * Math.PI; // диагональ
      const speed = 0.6 + Math.random() * 0.4;
      comets.push({
        x: fromLeft ? -100 : window.innerWidth + 100,
        y: Math.random() * window.innerHeight * 0.7,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed * 6,
        vy: Math.sin(angle) * speed * 4,
        life: 0,
        maxLife: 2400 + Math.random() * 1600
      });
    };

    const tick = (t: number) => {
      const dt = Math.min(64, t - lastT);
      lastT = t;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Звёзды — 3 слоя параллакса по z
      for (const s of stars) {
        const parallax = scrollRef.current * (0.05 + s.z * 0.35);
        // Нормализуем модуль к положительному диапазону, иначе при
        // длительном скролле звёзды кластеризуются и пропадают.
        const wrap = window.innerHeight + 200;
        const y = ((((s.y - parallax) % wrap) + wrap) % wrap) - 100;
        if (!reduced) s.twinkle += (dt / 1000) * s.twinkleSpeed;
        const alpha =
          0.35 +
          (Math.sin(s.twinkle) * 0.5 + 0.5) * 0.55 * (0.4 + s.z * 0.6);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, y, s.size * (0.6 + s.z * 0.8), 0, Math.PI * 2);
        ctx.fill();
        // Усилить самые большие звёзды лёгким glow
        if (s.size > 1.1) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(s.x, y, s.size * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Кометы (только если не reduced motion)
      if (!reduced) {
        cometCooldown -= dt;
        if (cometCooldown <= 0) {
          spawnComet();
          cometCooldown = 6000 + Math.random() * 8000;
        }

        comets = comets.filter((c) => {
          c.x += c.vx * (dt / 16);
          c.y += c.vy * (dt / 16);
          c.life += dt;
          const lifeP = c.life / c.maxLife;
          if (lifeP > 1) return false;
          const alpha = Math.sin(lifeP * Math.PI) * 0.9;
          // Хвост
          const tailLen = 80;
          const grad = ctx.createLinearGradient(
            c.x - (c.vx / 6) * tailLen,
            c.y - (c.vy / 6) * tailLen,
            c.x,
            c.y
          );
          grad.addColorStop(0, "rgba(255,255,255,0)");
          grad.addColorStop(1, `rgba(255,255,255,${alpha.toFixed(3)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(c.x - (c.vx / 6) * tailLen, c.y - (c.vy / 6) * tailLen);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
          // Голова
          ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(c.x, c.y, 1.6, 0, Math.PI * 2);
          ctx.fill();
          return true;
        });
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ background: "transparent" }}
    />
  );
}
