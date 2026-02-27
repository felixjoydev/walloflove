"use client";

import { useState } from "react";
import { SignatureSvg } from "@/components/wall/signature-svg";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { Checkbox } from "@/components/ui/checkbox";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  status: string;
  created_at: string;
}

function statusBadgeVariant(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "error" as const;
  return "warning" as const;
}

const MAX_MESSAGE_LENGTH = 140;

export function InboxGrid({
  entries,
  selected,
  onToggle,
  onStatus,
  onDelete,
  acting,
}: {
  entries: Entry[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onStatus: (id: string, status: "approved" | "rejected") => void;
  onDelete: (id: string) => void;
  acting: boolean;
}) {
  const [modalEntry, setModalEntry] = useState<Entry | null>(null);

  return (
    <>
      <div className="mt-[16px] pb-[40px] grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
        {entries.map((entry) => {
          const isTruncated = !!entry.message && entry.message.length > MAX_MESSAGE_LENGTH;

          return (
            <div
              key={entry.id}
              className="rounded-input border border-border bg-bg-page shadow-card flex flex-col"
            >
              {/* Inner white card — content (flipped double card: content on top, actions on bottom) */}
              <div className="rounded-t-input rounded-b-input border-b border-border bg-bg-card flex-1">
                <div className="p-[16px] flex flex-col">
                  {/* Signature area */}
                  <SignatureSvg
                    strokeData={entry.stroke_data}
                    className="w-full h-[120px] [&>svg]:w-full [&>svg]:h-full"
                    style={{
                      backgroundColor: "#F6F6F6",
                      backgroundImage:
                        "radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)",
                      backgroundSize: "14px 14px",
                      borderRadius: "8px",
                    }}
                  />

                  {/* Message — truncated to 140 chars with "More" link */}
                  {entry.message && (
                    <p className="text-body-sm mt-[12px] text-text-primary opacity-70">
                      {isTruncated
                        ? entry.message.slice(0, MAX_MESSAGE_LENGTH) + "... "
                        : entry.message}
                      {isTruncated && (
                        <button
                          type="button"
                          onClick={() => setModalEntry(entry)}
                          className="text-accent font-medium cursor-pointer hover:text-accent-hover transition-colors"
                        >
                          More
                        </button>
                      )}
                    </p>
                  )}

                  {/* Name + date */}
                  <div className="flex flex-col gap-[2px] mt-[12px]">
                    <span className="text-body-sm font-medium text-text-primary">
                      {entry.name}
                    </span>
                    <span className="text-[12px] text-text-secondary">
                      {new Date(entry.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Link */}
                  {entry.link && (
                    <a
                      href={entry.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-[6px] mt-[8px] text-[12px] text-text-secondary hover:text-text-primary transition-colors truncate"
                      title={entry.link}
                    >
                      <span className="truncate">{entry.link}</span>
                      <ExternalLinkIcon />
                    </a>
                  )}
                </div>
              </div>

              {/* Bottom bar — checkbox + status badge + action buttons */}
              <div className="flex items-center justify-between px-[12px] pt-[8px] pb-[10px]">
                <div className="flex items-center gap-[8px]">
                  <Checkbox
                    variant="white"
                    checked={selected.has(entry.id)}
                    onChange={() => onToggle(entry.id)}
                  />
                  <StatusBadge variant={statusBadgeVariant(entry.status)}>
                    {entry.status.toUpperCase()}
                  </StatusBadge>
                </div>
                <div className="flex items-center gap-[8px]">
                  {entry.status !== "rejected" && (
                    <ActionButton
                      variant="reject"
                      onClick={() => onStatus(entry.id, "rejected")}
                      disabled={acting}
                    />
                  )}
                  {entry.status !== "approved" && (
                    <ActionButton
                      variant="approve"
                      onClick={() => onStatus(entry.id, "approved")}
                      disabled={acting}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Entry detail modal */}
      {modalEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-bg-page/70 backdrop-blur-sm"
          onClick={() => setModalEntry(null)}
        >
          <div
            className="relative w-full max-w-[480px] mx-[16px] rounded-card shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-card border border-border bg-bg-card shadow-card"
              style={getModalPunchHoleMask()}
            >
              <div className="h-[48px]" />
              <div className="px-[24px] pb-[24px] pt-[8px] flex flex-col">
              {/* Signature */}
              <SignatureSvg
                strokeData={modalEntry.stroke_data}
                className="w-full h-[180px] [&>svg]:w-full [&>svg]:h-full"
                style={{
                  backgroundColor: "#F6F6F6",
                  backgroundImage:
                    "radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px)",
                  backgroundSize: "14px 14px",
                  borderRadius: "8px",
                }}
              />

              {/* Full message */}
              {modalEntry.message && (
                <p className="text-body mt-[16px] text-text-primary opacity-70">
                  {modalEntry.message}
                </p>
              )}

              {/* Name + date */}
              <div className="flex flex-col gap-[2px] mt-[16px]">
                <span className="text-body font-medium text-text-primary">
                  {modalEntry.name}
                </span>
                <span className="text-body-sm text-text-secondary">
                  {new Date(modalEntry.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Link */}
              {modalEntry.link && (
                <a
                  href={modalEntry.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[6px] mt-[8px] text-body-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <span className="truncate">{modalEntry.link}</span>
                  <ExternalLinkIcon />
                </a>
              )}

              {/* Status + actions */}
              <div className="flex items-center justify-between mt-[20px] pt-[16px] border-t border-border">
                <StatusBadge variant={statusBadgeVariant(modalEntry.status)}>
                  {modalEntry.status.toUpperCase()}
                </StatusBadge>
                <div className="flex items-center gap-[8px]">
                  {modalEntry.status !== "rejected" && (
                    <ActionButton
                      variant="reject"
                      onClick={() => {
                        onStatus(modalEntry.id, "rejected");
                        setModalEntry(null);
                      }}
                      disabled={acting}
                    />
                  )}
                  {modalEntry.status !== "approved" && (
                    <ActionButton
                      variant="approve"
                      onClick={() => {
                        onStatus(modalEntry.id, "approved");
                        setModalEntry(null);
                      }}
                      disabled={acting}
                    />
                  )}
                </div>
              </div>
            </div>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setModalEntry(null)}
                className="absolute top-[60px] right-[12px] w-[32px] h-[32px] flex items-center justify-center rounded-icon text-text-placeholder hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg className="w-[16px] h-[16px]" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.52925 3.52876C3.7896 3.26841 4.21171 3.26841 4.47206 3.52876L8.00065 7.05735L11.5292 3.52876C11.7896 3.26841 12.2117 3.26841 12.4721 3.52876C12.7324 3.78911 12.7324 4.21122 12.4721 4.47157L8.94346 8.00016L12.4721 11.5288C12.7324 11.7891 12.7324 12.2112 12.4721 12.4716C12.2117 12.7319 11.7896 12.7319 11.5292 12.4716L8.00065 8.94297L4.47206 12.4716C4.21171 12.7319 3.7896 12.7319 3.52925 12.4716C3.2689 12.2112 3.2689 11.7891 3.52925 11.5288L7.05784 8.00016L3.52925 4.47157C3.2689 4.21122 3.2689 3.78911 3.52925 3.52876Z" />
                </svg>
              </button>
            </div>
            <ModalPunchHoles />
          </div>
        </div>
      )}
    </>
  );
}

function ExternalLinkIcon() {
  return (
    <svg className="h-[12px] w-[12px] shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M4.66667 5.33333C4.29848 5.33333 4 5.03486 4 4.66667C4 4.29848 4.29848 4 4.66667 4H11.3333C11.7015 4 12 4.29848 12 4.66667V11.3333C12 11.7015 11.7015 12 11.3333 12C10.9651 12 10.6667 11.7015 10.6667 11.3333V6.27614L5.13807 11.8047C4.87772 12.0651 4.45561 12.0651 4.19526 11.8047C3.93491 11.5444 3.93491 11.1223 4.19526 10.8619L9.72386 5.33333H4.66667Z" />
    </svg>
  );
}
