"use client";

import { useRef, useState, useCallback } from "react";

interface BillingCardProps {
  externalTilt?: { x: number; y: number };
  externalShine?: { x: number; y: number };
  externalHovering?: boolean;
}

export function BillingCard({
  externalTilt,
  externalShine,
  externalHovering,
}: BillingCardProps = {}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shine, setShine] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const activeTilt = externalTilt ?? tilt;
  const activeShine = externalShine ?? shine;
  const activeHovering = externalHovering ?? hovering;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (externalTilt) return; // Skip internal tracking when externally controlled
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const fx = (e.clientX - cx) / (rect.width / 2); // -1 to 1
    const fy = (e.clientY - cy) / (rect.height / 2); // -1 to 1
    setTilt({ x: fx * 8, y: fy * -8 });
    setShine({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, [externalTilt]);

  const handleMouseLeave = useCallback(() => {
    if (externalTilt) return;
    setHovering(false);
    setTilt({ x: 0, y: 0 });
  }, [externalTilt]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => !externalTilt && setHovering(true)}
      onMouseLeave={handleMouseLeave}
      className="relative w-full rounded-[16px] bg-gradient-to-t from-[#e6e6e6] to-white p-[24px] flex flex-col justify-between"
      style={{
        // Skip 3D transform when externally controlled (parent applies it)
        ...(externalTilt
          ? {}
          : {
              transform: `perspective(800px) rotateY(${activeTilt.x}deg) rotateX(${activeTilt.y}deg)`,
              transition: activeHovering
                ? "transform 0.1s ease"
                : "transform 0.4s ease-out",
              transformStyle: "preserve-3d" as const,
            }),
        boxShadow:
          "0px 1px 3px 0px rgba(0,0,0,0.13), 0px 0px 0px 0px rgba(0,0,0,0.08), 0px 7px 20px 0px rgba(0,0,0,0.1), 0px 6px 14px 0px rgba(0,0,0,0.14)",
      }}
    >
      {/* Top row: title + crown */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-[8px]">
          <p className="font-mono font-semibold text-[32px] text-black leading-none">
            FREE PASS
          </p>
          <img
            src="/barcode.svg"
            alt=""
            className="w-[175px] h-[28px]"
            draggable={false}
          />
        </div>
        <img
          src="/freepass-crown.svg"
          alt=""
          className="w-[132px] h-[132px] shrink-0"
          draggable={false}
        />
      </div>

      {/* Body copy */}
      <div className="flex flex-col gap-[32px] mt-[16px] text-[16px] font-medium leading-normal">
        <div className="text-[#626262] flex flex-col gap-[16px]">
          <p>For a limited time, every feature is completely free.</p>
          <p>
            Unlimited guestbooks, unlimited entries, custom domains, full theme
            customization, and more. No credit card needed.
          </p>
        </div>
        <p className="text-black">
          We&apos;ll introduce plans down the road
        </p>
      </div>

      {/* Inner inset highlight border */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          boxShadow:
            "inset 0px -1.5px 0px 0px rgba(255,255,255,0.45), inset 0px 1.5px 0px 0px rgba(255,255,255,0.45)",
        }}
      />

      {/* Holographic shine overlay */}
      {activeHovering && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${activeShine.x}% ${activeShine.y}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
          }}
        />
      )}
    </div>
  );
}
