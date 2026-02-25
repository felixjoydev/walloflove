"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

/* ─── Base wrapper ─── */

function SettingsField({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="w-full rounded-input border border-border bg-bg-page shadow-card">
      <span className="text-body font-medium text-text-primary block px-[12px] pt-[10px] pb-[8px]">
        {label}
      </span>
      {description && (
        <span className="text-body-sm text-text-secondary block px-[12px] pb-[8px] -mt-[4px]">
          {description}
        </span>
      )}
      {children}
    </div>
  );
}

/* ─── Inner card wrapper ─── */

function InnerCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-t-input rounded-b-input border-t border-border bg-bg-card ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Text field ─── */

export function SettingsTextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <SettingsField label={label}>
      <InnerCard className="h-[44px] flex items-center px-[10px]">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-body font-medium text-text-primary placeholder:text-text-placeholder outline-none"
        />
      </InnerCard>
    </SettingsField>
  );
}

/* ─── Color field ─── */

export function SettingsColorField({
  label,
  value,
  onChange,
  pickerPosition = "top",
  showStrike = false,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  pickerPosition?: "top" | "bottom";
  showStrike?: boolean;
  trailing?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayValue = draft ?? value.replace("#", "").toUpperCase();

  function commit() {
    if (draft === null) return;
    const cleaned = draft.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    if (cleaned.length === 6) {
      onChange(`#${cleaned}`);
    }
    setDraft(null);
  }

  return (
    <SettingsField label={label}>
      <div ref={ref} className="relative">
        <InnerCard className="h-[44px] flex items-center px-[10px] gap-[8px]">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="relative w-[28px] h-[28px] rounded-icon shrink-0 cursor-pointer border border-border overflow-hidden"
            style={{ backgroundColor: value }}
            aria-label={`Pick ${label.toLowerCase()}`}
          >
            {showStrike && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 28 28">
                <line x1="4" y1="24" x2="24" y2="4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <input
            type="text"
            value={displayValue}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6).toUpperCase())}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
            maxLength={6}
            className="w-full bg-transparent text-body font-medium text-text-primary outline-none"
          />
          {trailing}
        </InnerCard>
        {open && (
          <div className={`absolute left-0 z-50 ${pickerPosition === "top" ? "bottom-full mb-[8px]" : "top-full mt-[8px]"}`}>
            <HexColorPicker color={value} onChange={onChange} />
          </div>
        )}
      </div>
    </SettingsField>
  );
}

/* ─── Select field ─── */

export function SettingsSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <SettingsField label={label}>
      <InnerCard className="h-[44px] flex items-center px-[10px]">
        <div className="relative w-full flex items-center">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent text-body font-medium text-text-primary outline-none cursor-pointer appearance-none pr-[24px]"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <img
            src="/chevron-down.svg"
            alt=""
            className="absolute right-0 w-[16px] h-[16px] pointer-events-none opacity-50"
          />
        </div>
      </InnerCard>
    </SettingsField>
  );
}

/* ─── Textarea field ─── */

export function SettingsTextareaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <SettingsField label={label}>
      <InnerCard className="px-[10px] py-[10px]">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full bg-transparent text-body font-medium text-text-primary placeholder:text-text-placeholder outline-none resize-none"
        />
      </InnerCard>
    </SettingsField>
  );
}

/* ─── Upload field ─── */

export function SettingsUploadField({
  label,
  value,
  onChange,
  onRemove,
}: {
  label: string;
  value?: string | null;
  onChange: (file: File) => void;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onChange(file);
  }

  return (
    <SettingsField label={label}>
      <InnerCard className="min-h-[120px] flex items-center justify-center">
        {value ? (
          <div className="w-full min-h-[120px] flex flex-col items-center justify-center gap-[12px] py-[16px]">
            <img
              src={value}
              alt="Logo"
              className="h-[48px] w-auto max-w-full object-contain"
            />
            <div className="flex items-center gap-[8px]">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-body-sm font-medium text-accent hover:text-accent-hover cursor-pointer transition-colors"
              >
                Change
              </button>
              {onRemove && (
                <>
                  <span className="text-text-placeholder">|</span>
                  <button
                    type="button"
                    onClick={onRemove}
                    className="text-body-sm font-medium text-text-placeholder hover:text-text-primary cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full h-full min-h-[120px] flex items-center justify-center cursor-pointer"
          >
            <span className="text-body-sm text-text-placeholder">
              Click to upload
            </span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </InnerCard>
    </SettingsField>
  );
}

/* ─── Slider field ─── */

export function SettingsSliderField({
  label,
  value,
  onChange,
  steps,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  steps: number[];
}) {
  const currentIndex = Math.max(0, steps.indexOf(value));
  const pct = steps.length <= 1 ? 0 : (currentIndex / (steps.length - 1)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const snapToNearest = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || steps.length <= 1) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const nearestIndex = Math.round(ratio * (steps.length - 1));
      onChange(steps[nearestIndex]);
    },
    [steps, onChange],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      snapToNearest(e.clientX);
    },
    [snapToNearest],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      snapToNearest(e.clientX);
    },
    [snapToNearest],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <SettingsField label={label}>
      <InnerCard className="p-[10px] !rounded-icon">
        <div
          ref={trackRef}
          tabIndex={0}
          className="relative h-[28px] bg-bg-input rounded-icon cursor-pointer touch-none outline-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Inner track area — padded so thumb doesn't overflow edges */}
          <div className="absolute inset-y-0 left-[14px] right-[14px] flex items-center pointer-events-none">
            {steps.map((step, i) => {
              const dotPct = steps.length <= 1 ? 0 : (i / (steps.length - 1)) * 100;
              return (
                <div
                  key={step}
                  className="absolute w-[6px] h-[6px] rounded-full bg-text-placeholder"
                  style={{ left: `${dotPct}%`, transform: "translateX(-50%)" }}
                />
              );
            })}
            {/* Thumb */}
            <div
              className="absolute h-[28px] w-[28px] rounded-icon bg-bg-card shadow-card-sm border border-border transition-all duration-150"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            />
          </div>
        </div>
      </InnerCard>
    </SettingsField>
  );
}

/* ─── Radio field ─── */

export function SettingsRadioField({
  label,
  description,
  value,
  onChange,
  options,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <SettingsField label={label} description={description}>
      <InnerCard className="flex items-center gap-[8px] px-[10px] py-[10px]">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-[8px] cursor-pointer text-body font-medium text-text-primary px-[4px]"
          >
            <span
              className={`w-[20px] h-[20px] rounded-full flex items-center justify-center shrink-0 transition-colors ${
                value === opt.value ? "bg-accent" : "bg-bg-input border-2 border-border"
              }`}
            >
              {value === opt.value && (
                <span className="w-[8px] h-[8px] rounded-full bg-white" />
              )}
            </span>
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </InnerCard>
    </SettingsField>
  );
}
