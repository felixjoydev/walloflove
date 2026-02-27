import type { CSSProperties } from "react";

/**
 * CSS mask that cuts truly transparent punch holes at the top of a modal card.
 * Apply the returned style to the Card / wrapper element.
 * The mask uses intersecting radial gradients — same technique as the
 * widget transparent-background punch holes.
 */
export function getModalPunchHoleMask(count: number = 8): CSSProperties {
  const r = 12; // radius → 24px diameter
  const y = 28; // vertical center: 16px padding + 12px radius
  const xPad = 40; // horizontal edge offset: 28px padding + 12px radius

  const gradients = Array.from({ length: count }, (_, i) => {
    const frac = count === 1 ? 0.5 : i / (count - 1);
    const x = `calc(${xPad}px + (100% - ${xPad * 2}px) * ${frac})`;
    return `radial-gradient(circle ${r}px at ${x} ${y}px, transparent ${r - 0.5}px, black ${r + 0.5}px)`;
  });

  const img = gradients.join(", ");
  const comp = Array(Math.max(count - 1, 1)).fill("intersect").join(", ");
  const wComp = Array(Math.max(count - 1, 1))
    .fill("destination-in")
    .join(", ");

  return {
    maskImage: img,
    WebkitMaskImage: img,
    maskComposite: comp,
    WebkitMaskComposite: wComp,
  } as CSSProperties;
}

/**
 * Inset-shadow circles rendered OUTSIDE the CSS mask.
 * Must be a sibling of the masked element (not a child),
 * positioned absolutely in a shared relative wrapper.
 */
export function ModalPunchHoles({ count = 8 }: { count?: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-[28px] pt-[16px] pointer-events-none z-10">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-[24px] h-[24px] rounded-full"
          style={{ boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.18) inset" }}
        />
      ))}
    </div>
  );
}
