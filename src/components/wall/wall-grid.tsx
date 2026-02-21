import type { GuestbookSettings } from "@shared/types";
import { SignatureSvg } from "./signature-svg";
import { getDotColor } from "@/lib/utils/color";

interface Entry {
  id: string;
  name: string;
  message: string | null;
  link: string | null;
  stroke_data: unknown;
  created_at: string;
}

export function WallGrid({
  settings,
  entries,
  fontFamily,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  settings: Required<GuestbookSettings>;
  entries: Entry[];
  fontFamily: string;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-[16px] pt-[72px] pb-[120px]">
        <div className="text-center py-[64px]">
          <p
            className="text-[14px]"
            style={{ color: settings.text_color, opacity: 0.5 }}
          >
            No entries yet. Be the first to sign!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-[16px] pb-[200px]">
      {/* Title — extra top padding for fixed navbar */}
      <div className="pt-[72px]">
        <h1
          className="text-[24px] font-bold"
          style={{ color: settings.text_color, fontFamily }}
        >
          {settings.wall_title}
        </h1>
      </div>
      {/* Description */}
      {settings.wall_description && (
        <p
          className="text-[14px] mt-[4px]"
          style={{ color: settings.text_color, opacity: 0.7, fontFamily }}
        >
          {settings.wall_description}
        </p>
      )}

      {/* Signature cards */}
      <div className="mt-[24px] grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex flex-col relative overflow-hidden"
            style={{
              borderRadius: `${settings.card_border_radius}px`,
              paddingTop: "16px",
              paddingRight: "16px",
              paddingBottom: "16px",
              paddingLeft: "40px",
            }}
          >
            {/* Card background */}
            <div
              className="absolute inset-0 border border-border"
              style={{
                backgroundColor: settings.card_background_color,
                borderRadius: `${settings.card_border_radius}px`,
                boxShadow:
                  "0px 3px 3px 0px rgba(0, 0, 0, 0.06), 0px 1px 1px 0px rgba(0, 0, 0, 0.06), 0px 0px 1px 0px rgba(0, 0, 0, 0.06)",
              }}
            />
            {/* Notebook punch holes */}
            <div className="absolute left-[12px] top-0 bottom-0 flex flex-col items-center justify-evenly pointer-events-none z-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[16px] h-[16px] rounded-full"
                  style={{
                    backgroundColor: settings.background_color,
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.15) inset",
                  }}
                />
              ))}
            </div>
            {/* Card content */}
            <div className="relative flex flex-col flex-1">
              {/* Signature */}
              <SignatureSvg
                strokeData={entry.stroke_data}
                className="w-full h-[120px] [&>svg]:w-full [&>svg]:h-full"
                style={{
                  backgroundColor: settings.canvas_background_color,
                  backgroundImage:
                    `radial-gradient(circle, ${getDotColor(settings.background_color)} 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                  borderRadius: "8px",
                }}
              />
              {/* Message */}
              {entry.message && (
                <p
                  className="text-[14px] mt-[12px]"
                  style={{
                    color: settings.card_text_color,
                    opacity: 0.7,
                    fontFamily,
                  }}
                >
                  {entry.message}
                </p>
              )}
              {/* Name + date + link icon */}
              <div className="flex items-end justify-between mt-auto pt-[12px]">
                <div className="flex flex-col gap-[2px]">
                  <span className="flex items-center gap-[6px]">
                    <span
                      className="text-[14px] font-medium"
                      style={{ color: settings.card_text_color, fontFamily }}
                    >
                      {entry.name}
                    </span>
                    {entry.link && (
                      <a
                        href={entry.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 hover:opacity-70 transition-opacity"
                        title={entry.link}
                      >
                        <img src="/exterlanal-link-2.svg" alt="Link" className="w-[14px] h-[14px]" style={{ opacity: 0.5 }} />
                      </a>
                    )}
                  </span>
                  <span
                    className="text-[11px]"
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
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-[24px] flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-[24px] py-[10px] text-[14px] font-medium rounded-input border border-border bg-bg-card shadow-card-sm cursor-pointer hover:bg-bg-subtle transition-colors disabled:opacity-50"
            style={{ color: settings.text_color }}
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
