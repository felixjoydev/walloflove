"use client";

import { useEffect, useRef, useCallback } from "react";

export function InfiniteScrollWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isTeleporting = useRef(false);

  const handleScroll = useCallback(() => {
    if (isTeleporting.current) return;

    const el = document.documentElement;
    const scrollTop = el.scrollTop;
    const singlePageHeight = el.scrollHeight / 2;

    if (scrollTop >= singlePageHeight) {
      isTeleporting.current = true;
      el.scrollTop = scrollTop - singlePageHeight;
      requestAnimationFrame(() => {
        isTeleporting.current = false;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return <div>{children}</div>;
}
