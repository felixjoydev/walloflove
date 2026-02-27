"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { GuestbookSettings } from "@shared/types";
import { Button } from "@/components/ui/button";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";
import { getDotColor } from "@/lib/utils/color";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

/* ─── Punch-hole CSS mask (used when widget background is transparent) ─── */
const embedPunchHoleMask: React.CSSProperties = (() => {
  const g = (y: string) =>
    `radial-gradient(circle 5px at 11px ${y}, transparent 5px, black 5px)`;
  const img = [
    g("13px"),
    g("calc(13px + (100% - 26px) * 0.2)"),
    g("calc(13px + (100% - 26px) * 0.4)"),
    g("calc(13px + (100% - 26px) * 0.6)"),
    g("calc(13px + (100% - 26px) * 0.8)"),
    g("calc(100% - 13px)"),
  ].join(", ");
  const comp = Array(5).fill("intersect").join(", ");
  const wComp = Array(5).fill("destination-in").join(", ");
  return {
    maskImage: img,
    WebkitMaskImage: img,
    maskComposite: comp,
    WebkitMaskComposite: wComp,
  } as React.CSSProperties;
})();

export function EmbedModal({
  guestbookId,
  onClose,
  settings,
  entries,
  fontFamily,
}: {
  guestbookId: string;
  onClose: () => void;
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
}) {
  const [activeTab, setActiveTab] = useState<"grid" | "carousel">("grid");
  const [copied, setCopied] = useState(false);

  const widgetUrl =
    process.env.NEXT_PUBLIC_WIDGET_URL ?? "https://widget.signboard.app";
  const apiUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.signboard.app";

  const snippet = `<div data-sb-id="${guestbookId}" data-format="${activeTab}"></div>
<link rel="preconnect" href="${apiUrl}" />
<script async src="${widgetUrl}/widget.js"></script>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const placeholders: Entry[] = [
    { id: "s1", name: "Ronald", message: "You guys are awesome", link: null, stroke_data: null, created_at: "2026-02-16T00:00:00Z" },
    { id: "s2", name: "Sarah", message: "Love this product!", link: null, stroke_data: null, created_at: "2026-02-15T00:00:00Z" },
    { id: "s3", name: "Alex", message: "Super cool", link: null, stroke_data: null, created_at: "2026-02-14T00:00:00Z" },
    { id: "s4", name: "Jordan", message: "Really impressive", link: null, stroke_data: null, created_at: "2026-02-13T00:00:00Z" },
    { id: "s5", name: "Taylor", message: "Amazing work", link: null, stroke_data: null, created_at: "2026-02-12T00:00:00Z" },
    { id: "s6", name: "Chris", message: "Beautifully done", link: null, stroke_data: null, created_at: "2026-02-11T00:00:00Z" },
  ];
  const real = entries.slice(0, 6);
  const sampleEntries = real.length >= 6 ? real : [...real, ...placeholders.slice(real.length)];

  const transparent = settings.widget_transparent_bg;

  function renderCard(entry: Entry) {
    return (
      <div
        key={entry.id}
        className="relative overflow-hidden"
        style={{ borderRadius: `${settings.card_border_radius}px` }}
      >
        <div
          className="flex flex-col relative"
          style={{
            paddingTop: "10px", paddingRight: "10px", paddingBottom: "10px", paddingLeft: "28px",
            ...(transparent ? embedPunchHoleMask : {}),
          }}
        >
          {/* Background layer */}
          <div
            className="absolute inset-0 shadow-card"
            style={{ backgroundColor: settings.card_background_color, borderRadius: `${settings.card_border_radius}px` }}
          />
          {/* Border layer */}
          <div
            className="absolute inset-0 border"
            style={{ borderColor: settings.card_border_color, borderRadius: `${settings.card_border_radius}px` }}
          />
          {/* Punch holes (solid color — only when not transparent) */}
          {!transparent && (
            <div className="absolute left-[6px] top-[8px] bottom-[8px] flex flex-col items-center justify-between pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[10px] h-[10px] rounded-full"
                  style={{
                    backgroundColor: settings.background_color,
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.15) inset",
                  }}
                />
              ))}
            </div>
          )}
          {/* Content */}
          <div className="relative flex flex-col flex-1">
            {/* Doodle area with dots */}
            <div
              className="w-full h-[80px] flex items-center justify-center"
              style={{
                backgroundColor: settings.canvas_background_color,
                backgroundImage: `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
                backgroundSize: "14px 14px",
                borderRadius: "6px",
              }}
            >
              <SignatureSample />
            </div>
            {/* Text */}
            <div className="flex flex-col flex-1">
              {entry.message && (
                <p
                  className="text-[10px] mt-[8px]"
                  style={{ color: settings.card_text_color, opacity: 0.7, fontFamily }}
                >
                  {entry.message}
                </p>
              )}
              <div className="flex items-end justify-between mt-auto pt-[8px]">
                <div className="flex flex-col gap-[2px]">
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: settings.card_text_color, fontFamily }}
                  >
                    {entry.name}
                  </span>
                  <span
                    className="text-[8px]"
                    style={{ color: settings.card_text_color, opacity: 0.5 }}
                  >
                    {new Date(entry.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Shadow overlay for punch holes (only when transparent — outside mask) */}
        {transparent && (
          <div className="absolute left-[6px] top-[8px] bottom-[8px] flex flex-col items-center justify-between pointer-events-none">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[10px] h-[10px] rounded-full"
                style={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.15) inset" }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bg-page/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[640px] rounded-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-card bg-bg-card shadow-card border border-border max-h-[90vh] overflow-y-auto"
          style={getModalPunchHoleMask(12)}
        >
          <div className="h-[48px]" />
          {/* Tab bar */}
        <div className="flex gap-[4px] mx-[24px] border-b border-border">
          {(["grid", "carousel"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-[6px] border-b-2 px-[16px] py-[12px] text-body-sm font-medium transition-colors cursor-pointer ${
                activeTab === t
                  ? "border-text-primary text-text-primary"
                  : "border-transparent text-text-placeholder hover:text-text-secondary"
              }`}
            >
              <span className={activeTab === t ? "text-icon-active" : "text-icon-inactive"}>
                {t === "grid" ? <GridTabIcon /> : <CarouselTabIcon />}
              </span>
              {t === "grid" ? "Grid" : "Carousel"}
            </button>
          ))}
        </div>

        <div className="px-[24px] py-[20px]">
          {/* Heading */}
          <h2 className="text-body font-bold text-text-primary">
            {activeTab === "grid" ? "Grid embed code" : "Carousel embed code"}
          </h2>

          {/* Preview + Code container */}
          <div className="mt-[16px]">
            {/* Preview area — white card with rounded corners, sits above code block */}
            <div
              className="relative z-10 rounded-input border border-border shadow-card p-[16px]"
              style={{
                backgroundColor: settings.widget_transparent_bg ? "#ffffff" : settings.background_color,
                backgroundImage: settings.widget_transparent_bg
                  ? "linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)"
                  : undefined,
                backgroundSize: settings.widget_transparent_bg ? "16px 16px" : undefined,
                backgroundPosition: settings.widget_transparent_bg ? "0 0, 0 8px, 8px -8px, -8px 0px" : undefined,
                fontFamily,
              }}
            >
              {activeTab === "grid" ? (
                <div className="grid grid-cols-3 gap-[12px]">
                  {sampleEntries.map((entry) => renderCard(entry))}
                </div>
              ) : (
                <div className="flex gap-[12px] overflow-x-auto pb-[4px]" style={{ scrollbarWidth: "none" }}>
                  {sampleEntries.map((entry) => (
                    <div key={entry.id} className="shrink-0 w-[200px]">
                      {renderCard(entry)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Code block — sits below the preview card, rounded bottom corners */}
            <div className="bg-bg-nav p-[16px] rounded-b-input overflow-x-auto -mt-[12px] pt-[28px]">
              <pre className="text-[13px] leading-relaxed whitespace-pre-wrap">
                <code className="font-[family-name:var(--font-geist-mono)]">
                  <CodeSnippet guestbookId={guestbookId} format={activeTab} apiUrl={apiUrl} widgetUrl={widgetUrl} />
                </code>
              </pre>
            </div>
          </div>

          {/* Copy button */}
          <Button className="mt-[16px] w-full" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy code"}
          </Button>

          {/* Instructions */}
          <p className="mt-[12px] text-center text-body-sm text-text-secondary">
            Paste this snippet into your website&apos;s HTML where you want the widget to appear.
          </p>
          </div>
        </div>
        <ModalPunchHoles count={12} />
      </div>
    </div>
  );
}

/* ─── Syntax-colored code snippet ─── */

function CodeSnippet({
  guestbookId,
  format,
  apiUrl,
  widgetUrl,
}: {
  guestbookId: string;
  format: "grid" | "carousel";
  apiUrl: string;
  widgetUrl: string;
}) {
  return (
    <>
      {/* Line 1: div */}
      <span className="text-[#7dd3fc]">&lt;div</span>
      <span className="text-[#c4b5fd]"> data-sb-id</span>
      <span className="text-white">=</span>
      <span className="text-[#86efac]">&quot;{guestbookId}&quot;</span>
      <span className="text-[#c4b5fd]"> data-format</span>
      <span className="text-white">=</span>
      <span className="text-[#86efac]">&quot;{format}&quot;</span>
      <span className="text-[#7dd3fc]">&gt;&lt;/div&gt;</span>
      {"\n"}
      {/* Line 2: link */}
      <span className="text-[#7dd3fc]">&lt;link</span>
      <span className="text-[#c4b5fd]"> rel</span>
      <span className="text-white">=</span>
      <span className="text-[#86efac]">&quot;preconnect&quot;</span>
      <span className="text-[#c4b5fd]"> href</span>
      <span className="text-white">=</span>
      <span className="text-[#86efac]">&quot;{apiUrl}&quot;</span>
      <span className="text-[#7dd3fc]"> /&gt;</span>
      {"\n"}
      {/* Line 3: script */}
      <span className="text-[#7dd3fc]">&lt;script</span>
      <span className="text-[#c4b5fd]"> async</span>
      <span className="text-[#c4b5fd]"> src</span>
      <span className="text-white">=</span>
      <span className="text-[#86efac]">&quot;{widgetUrl}/widget.js&quot;</span>
      <span className="text-[#7dd3fc]">&gt;&lt;/script&gt;</span>
    </>
  );
}

/* ─── Icons ─── */

function GridTabIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.66732 1.3335C1.93094 1.3335 1.33398 1.93045 1.33398 2.66683V6.00016C1.33398 6.73654 1.93094 7.3335 2.66732 7.3335H6.00065C6.73703 7.3335 7.33398 6.73654 7.33398 6.00016V2.66683C7.33398 1.93045 6.73703 1.3335 6.00065 1.3335H2.66732Z" />
      <path d="M10.0007 1.3335C9.26427 1.3335 8.66732 1.93045 8.66732 2.66683V6.00016C8.66732 6.73654 9.26427 7.3335 10.0007 7.3335H13.334C14.0704 7.3335 14.6673 6.73654 14.6673 6.00016V2.66683C14.6673 1.93045 14.0704 1.3335 13.334 1.3335H10.0007Z" />
      <path d="M2.66732 8.66683C1.93094 8.66683 1.33398 9.26378 1.33398 10.0002V13.3335C1.33398 14.0699 1.93094 14.6668 2.66732 14.6668H6.00065C6.73703 14.6668 7.33398 14.0699 7.33398 13.3335V10.0002C7.33398 9.26378 6.73703 8.66683 6.00065 8.66683H2.66732Z" />
      <path d="M10.0007 8.66683C9.26427 8.66683 8.66732 9.26378 8.66732 10.0002V13.3335C8.66732 14.0699 9.26427 14.6668 10.0007 14.6668H13.334C14.0704 14.6668 14.6673 14.0699 14.6673 13.3335V10.0002C14.6673 9.26378 14.0704 8.66683 13.334 8.66683H10.0007Z" />
    </svg>
  );
}

function CarouselTabIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      {/* Right vertical bar */}
      <path d="M14.666 1.99992C14.666 1.63173 14.3675 1.33325 13.9993 1.33325C13.6312 1.33325 13.3327 1.63173 13.3327 1.99992L13.3327 13.9999C13.3327 14.3681 13.6312 14.6666 13.9993 14.6666C14.3675 14.6666 14.666 14.3681 14.666 13.9999L14.666 1.99992Z" />
      {/* Left vertical bar */}
      <path d="M2.66602 1.99992C2.66602 1.63173 2.36754 1.33325 1.99935 1.33325C1.63116 1.33325 1.33268 1.63173 1.33268 1.99992L1.33268 13.9999C1.33268 14.3681 1.63116 14.6666 1.99935 14.6666C2.36754 14.6666 2.66602 14.3681 2.66602 13.9999L2.66602 1.99992Z" />
      {/* Center card */}
      <path d="M11.9993 3.33325C11.9993 2.22868 11.1039 1.33325 9.99935 1.33325L5.99935 1.33325C4.89478 1.33325 3.99935 2.22868 3.99935 3.33325L3.99935 12.6666C3.99935 13.7712 4.89478 14.6666 5.99935 14.6666L9.99935 14.6666C11.1039 14.6666 11.9993 13.7712 11.9993 12.6666L11.9993 3.33325Z" />
    </svg>
  );
}

function SignatureSample() {
  return (
    <svg className="h-[48px] w-[32px]" viewBox="0 0 42 63" fill="none">
      <path d="M1 31.3618C2.76123 28.6672 5.38716 20.4247 4.94959 8.6698C4.80134 4.68741 3.90876 2.17915 3.4144 1.65592C-1.72304 -3.78153 6.0098 25.5164 7.15353 55.1465C7.35921 60.4748 6.83547 61.6437 6.20364 61.9306C5.57181 62.2174 4.60156 61.5907 3.80265 60.5009C2.04412 58.1019 1.9624 54.5844 2.6827 50.9848C4.28251 42.9898 9.48864 39.4278 13.4417 36.9359C17.3352 34.4814 23.0119 35.1459 28.0535 34.1892C32.5082 33.3438 34.7166 27.955 38.3961 24.5107C39.2415 23.4891 39.8855 22.1986 40.2917 22.2232C40.6978 22.2478 40.8467 23.6266 41 25.0471" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
