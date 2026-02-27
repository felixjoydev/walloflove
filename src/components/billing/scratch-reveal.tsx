"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BillingCard } from "@/components/billing/billing-card";
import { Button } from "@/components/ui/button";

const GRADIENT_STOPS = [
  { offset: 0, color: "#FF5159" },
  { offset: 0.2022, color: "#D048FF" },
  { offset: 0.4044, color: "#6C73FF" },
  { offset: 0.6011, color: "#407CFF" },
  { offset: 0.7978, color: "#54FF9C" },
  { offset: 1, color: "#FFE23C" },
];

const SCRATCH_RADIUS = 26;
const REVEAL_THRESHOLD = 0.7;

function fillGradient(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const baseGrad = ctx.createLinearGradient(0, h, 0, 0);
  baseGrad.addColorStop(0, "#e6e6e6");
  baseGrad.addColorStop(1, "#ffffff");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.filter = "blur(4px)";
  ctx.globalAlpha = 0.26;

  const rainbowGrad = ctx.createLinearGradient(0, 0, w, 0);
  for (const stop of GRADIENT_STOPS) {
    rainbowGrad.addColorStop(stop.offset, stop.color);
  }
  ctx.fillStyle = rainbowGrad;
  ctx.fillRect(-8, -8, w + 16, h + 16);
  ctx.restore();
}

function getRevealPercent(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;

  const step = 8;
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;

  let total = 0;
  let transparent = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const idx = (y * w + x) * 4;
      total++;
      if (data[idx + 3] === 0) transparent++;
    }
  }

  return total > 0 ? transparent / total : 0;
}

/** Draw a jagged, rough circle with scattered edge particles */
function drawRaggedCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number
) {
  const points = 18;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const jitter = r * (0.78 + Math.random() * 0.44);
    const px = x + Math.cos(angle) * jitter;
    const py = y + Math.sin(angle) * jitter;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  const numParticles = 6;
  for (let i = 0; i < numParticles; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = r * (0.7 + Math.random() * 0.7);
    const dotR = 1 + Math.random() * 3;
    ctx.beginPath();
    ctx.arc(
      x + Math.cos(angle) * dist,
      y + Math.sin(angle) * dist,
      dotR,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

export function ScratchReveal() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const checkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [canvasReady, setCanvasReady] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [cursorPos, setCursorPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Initialize canvas size and gradient
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      fillGradient(canvas);
      setCanvasReady(true);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  /** Update cursor position (percentage) relative to container */
  const updateCursorPos = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container || revealed) return;
      const cRect = container.getBoundingClientRect();
      setCursorPos({
        x: ((clientX - cRect.left) / cRect.width) * 100,
        y: ((clientY - cRect.top) / cRect.height) * 100,
      });
    },
    [revealed]
  );

  const scratch = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || revealed) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const r = SCRATCH_RADIUS;

      ctx.save();
      ctx.globalCompositeOperation = "destination-out";

      const last = lastPosRef.current;
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(dist / (r * 0.4)));

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const ix = last.x + dx * t;
          const iy = last.y + dy * t;
          drawRaggedCircle(ctx, ix, iy, r);
        }
      } else {
        drawRaggedCircle(ctx, x, y, r);
      }

      ctx.restore();
      lastPosRef.current = { x, y };

      // Throttled reveal check
      if (!checkTimerRef.current) {
        checkTimerRef.current = setTimeout(() => {
          checkTimerRef.current = null;
          const pct = getRevealPercent(canvas);
          if (pct >= REVEAL_THRESHOLD) {
            setRevealed(true);
          }
        }, 200);
      }
    },
    [revealed]
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      scratchingRef.current = true;
      lastPosRef.current = null;
      setScratching(true);
      updateCursorPos(clientX, clientY);
      scratch(clientX, clientY);
    },
    [scratch, updateCursorPos]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!scratchingRef.current) return;
      updateCursorPos(clientX, clientY);
      scratch(clientX, clientY);
    },
    [scratch, updateCursorPos]
  );

  const handleEnd = useCallback(() => {
    scratchingRef.current = false;
    lastPosRef.current = null;
  }, []);

  // Mouse events — track cursor for hologram even without mousedown
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => handleStart(e.clientX, e.clientY),
    [handleStart]
  );
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      updateCursorPos(e.clientX, e.clientY);
      if (scratchingRef.current) {
        scratch(e.clientX, e.clientY);
      }
    },
    [scratch, updateCursorPos]
  );
  const onMouseLeave = useCallback(() => {
    setCursorPos(null);
  }, []);

  // Touch events
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      handleStart(t.clientX, t.clientY);
    },
    [handleStart]
  );
  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      handleMove(t.clientX, t.clientY);
    },
    [handleMove]
  );

  // Global mouseup/touchend to handle release outside canvas
  useEffect(() => {
    const end = () => handleEnd();
    window.addEventListener("mouseup", end);
    window.addEventListener("touchend", end);
    return () => {
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchend", end);
    };
  }, [handleEnd]);

  // Hologram tilt + shine driven by cursor position (hover or scratch)
  const isTilting = cursorPos !== null && !revealed;
  const tiltX = isTilting ? ((cursorPos!.x - 50) / 50) * 6 : 0;
  const tiltY = isTilting ? ((cursorPos!.y - 50) / 50) * -6 : 0;
  const tilt = isTilting ? { x: tiltX, y: tiltY } : undefined;
  const shine = isTilting
    ? { x: cursorPos!.x, y: cursorPos!.y }
    : undefined;

  return (
    <div className="w-full max-w-[620px] flex flex-col gap-[32px]">
      {/* Card + scratch overlay — hidden until canvas is painted to prevent content flash */}
      <div
        ref={containerRef}
        className="relative select-none"
        style={{
          opacity: canvasReady || revealed ? 1 : 0,
          // Only apply 3D transform before reveal — after reveal, BillingCard handles its own tilt
          ...(revealed
            ? {}
            : {
                transform: `perspective(800px) rotateY(${tiltX}deg) rotateX(${tiltY}deg)`,
                transition: isTilting
                  ? "transform 0.1s ease"
                  : "transform 0.4s ease-out",
                transformStyle: "preserve-3d" as const,
              }),
        }}
      >
        <BillingCard
          externalTilt={tilt}
          externalShine={shine}
          externalHovering={isTilting}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 rounded-[16px]"
          style={{
            cursor: revealed ? "default" : "grab",
            opacity: revealed ? 0 : 1,
            transition: "opacity 0.6s ease-out",
            pointerEvents: revealed ? "none" : "auto",
            touchAction: "none",
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={handleEnd}
        />

        {/* Scratch hint */}
        {!scratching && !revealed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[16px] font-semibold text-black/60 bg-white/60 backdrop-blur-sm px-[16px] py-[8px] rounded-full">
              Scratch to reveal
            </span>
          </div>
        )}
      </div>

      {/* Continue button — appears after reveal */}
      <div
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? "translateY(0)" : "translateY(8px)",
          transition:
            "opacity 0.4s ease-out 0.3s, transform 0.4s ease-out 0.3s",
          pointerEvents: revealed ? "auto" : "none",
        }}
      >
        <Button onClick={() => router.push("/create-guestbook")}>
          Continue
        </Button>
      </div>
    </div>
  );
}
