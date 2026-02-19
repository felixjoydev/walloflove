"use client";

import { useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 rounded-md border border-neutral-300"
          style={{ backgroundColor: value }}
          aria-label={`Pick ${label.toLowerCase()}`}
        />
        <HexColorInput
          color={value}
          onChange={onChange}
          prefixed
          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      {open && (
        <div className="mt-1">
          <HexColorPicker color={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
