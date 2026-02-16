"use client";

import { useState } from "react";

export function BillingActions({
  action,
  priceId,
  className,
  children,
}: {
  action: "checkout" | "portal";
  priceId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);

    try {
      const endpoint =
        action === "checkout" ? "/api/billing/checkout" : "/api/billing/portal";

      const body =
        action === "checkout" && priceId
          ? JSON.stringify({ priceId })
          : "{}";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading ? "Redirecting..." : children}
    </button>
  );
}
