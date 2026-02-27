"use client";

import { useEffect, useRef, useId } from "react";

const COLORS = ["#FFF9C6", "#FFD6E0", "#D4F0FF", "#D5F5E3", "#F3E5F5", "#FFE0B2"];
// Pre-computed darker fold colors for each
const FOLD_COLORS = ["#A99F5B", "#A6696E", "#6A9EAD", "#6BA87A", "#8A6E93", "#A6805A"];
const FOLD_MID = ["#DABE13", "#D46A7A", "#6AAFCC", "#6AC88A", "#B06AC8", "#D49A3A"];
const INTERVAL = 800;

export function InlineStickyNote() {
  const uid = useId();
  const p0 = `sn_paint0${uid}`;
  const p1 = `sn_paint1${uid}`;
  const p2 = `sn_paint2${uid}`;
  const bodyRef = useRef<SVGPathElement>(null);
  const fold0aRef = useRef<SVGStopElement>(null);
  const fold1bRef = useRef<SVGStopElement>(null);
  const fold2bRef = useRef<SVGStopElement>(null);
  const indexRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    let rafId = 0;
    const tick = (time: number) => {
      if (time - lastRef.current >= INTERVAL) {
        lastRef.current = time;
        indexRef.current = (indexRef.current + 1) % COLORS.length;
        const i = indexRef.current;
        if (bodyRef.current) bodyRef.current.setAttribute("fill", COLORS[i]);
        if (fold0aRef.current) fold0aRef.current.setAttribute("stop-color", FOLD_COLORS[i]);
        if (fold1bRef.current) fold1bRef.current.setAttribute("stop-color", FOLD_MID[i]);
        if (fold2bRef.current) fold2bRef.current.setAttribute("stop-color", FOLD_COLORS[i]);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <span className="inline-block align-middle">
      <svg width="26" height="25" viewBox="0 0 42 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 19.9043C0 10.5213 0 5.82984 2.90763 2.91492C5.81526 0 10.495 0 19.8545 0H27.3887C31.7519 0 33.9335 0 35.6679 0.67556C38.2643 1.68684 40.3174 3.7451 41.3261 6.34797C42 8.08675 42 10.2738 42 14.6479C42 22.2184 42 26.0037 40.8337 29.0131C39.0878 33.5181 35.5343 37.0805 31.0406 38.8308C28.0387 40 24.2629 40 16.7113 40H15.3803C10.2948 40 7.75204 40 5.77611 39.0881C3.62554 38.0957 1.89957 36.3654 0.90959 34.2094C0 32.2285 0 29.6794 0 24.5812V19.9043Z" fill={`url(#${p0})`} />
        <path d="M0 19.9043C0 10.5213 0 5.82984 2.90763 2.91492C5.81526 0 10.495 0 19.8545 0H28.35C31.8135 0 33.5453 0 34.9545 0.428536C38.1272 1.3934 40.6101 3.88247 41.5725 7.0632C42 8.47589 42 10.212 42 13.6842C42 20.3615 42 23.7002 41.178 26.4169C39.3271 32.5337 34.5524 37.3204 28.4509 39.1759C25.741 40 22.4106 40 15.75 40H14.3684C10.2329 40 8.16507 40 6.51053 39.392C3.77035 38.385 1.61099 36.2202 0.60651 33.4732C0 31.8145 0 29.7415 0 25.5956V19.9043Z" fill={`url(#${p1})`} />
        <path d="M0 19.9595C0 10.5765 0 5.88504 2.90763 2.97012C5.81526 0.0552062 10.495 0.0552062 19.8545 0.0552062H28.3914C31.8163 0.0552062 33.5287 0.0552062 34.9233 0.47432C38.1213 1.43539 40.6233 3.94362 41.5819 7.14965C42 8.54777 42 10.2645 42 13.6979C42 20.3006 42 23.6019 41.196 26.2906C39.3524 32.456 34.541 37.2796 28.391 39.1278C25.709 39.9338 22.4159 39.9337 15.8297 39.9337H14.3684C10.2329 39.9337 8.16507 39.9337 6.51053 39.3257C3.77035 38.3187 1.61099 36.1539 0.60651 33.4069C0 31.7482 0 29.6752 0 25.5293V19.9595Z" fill={`url(#${p2})`} />
        {/* Main body - color cycles */}
        <path ref={bodyRef} d="M0 20C0 11.1269 0 6.69034 2.34938 3.73771C2.70474 3.2911 3.09439 2.87669 3.5143 2.49874C6.29044 0 10.4618 0 18.8045 0H29.1337C31.866 0 33.2321 0 34.3603 0.284136C38.0144 1.20446 40.8675 4.23897 41.7328 8.12541C42 9.3253 42 10.7783 42 13.6842C42 19.2726 42 22.0667 41.4862 24.3742C40.6694 28.0428 36.2393 28.4531 33.8504 31.0451C31.3724 33.7338 30.8861 38.5525 27.3082 39.4536C25.1386 40 22.5115 40 17.2572 40H14.3684C10.2329 40 8.16507 40 6.51053 39.3549C3.77035 38.2866 1.61099 35.99 0.60651 33.0756C0 31.3159 0 29.1166 0 24.7181V20Z" fill="#FFF9C6" />
        <defs>
          <linearGradient id={p0} x1="39.7091" y1="37.1292" x2="28.034" y2="25.2924" gradientUnits="userSpaceOnUse">
            <stop ref={fold0aRef} stopColor="#A99F5B" />
            <stop offset="1" stopColor="#DED48F" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={p1} x1="34.1727" y1="30.9645" x2="36.9086" y2="33.5369" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FCF6C0" />
            <stop ref={fold1bRef} offset="1" stopColor="#DABE13" />
          </linearGradient>
          <linearGradient id={p2} x1="33.1227" y1="29.7462" x2="36.9794" y2="33.4678" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FCF6C0" />
            <stop ref={fold2bRef} offset="1" stopColor="#DED38E" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
