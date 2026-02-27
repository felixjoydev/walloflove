import type { GuestbookSettings } from "@shared/types";

export function WallNavbar({
  settings,
  viewMode,
  onViewModeChange,
}: {
  settings: Required<GuestbookSettings>;
  viewMode: "grid" | "canvas";
  onViewModeChange: (mode: "grid" | "canvas") => void;
}) {
  const logoUrl = settings.logo_url ?? undefined;

  return (
    <div className="flex items-center justify-between px-[48px] py-[16px]">
      {/* Logo + website link */}
      <div className="flex items-center gap-[12px]">
        {/* Standalone logo */}
        <div className="shrink-0">
          <img
            src={logoUrl || "/logo.svg"}
            alt="Logo"
            className="object-contain"
            style={{ height: "40px", maxWidth: "120px", width: "auto" }}
          />
        </div>

        {/* Website link pill */}
        {settings.website_link ? (
          <a
            href={settings.website_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[6px] rounded-icon border border-border bg-bg-card shadow-card-sm px-[10px] py-[6px] hover:opacity-80 transition-opacity"
          >
            <span className="text-[14px] font-medium text-text-primary whitespace-nowrap">
              {settings.website_text || "Visit our website"}
            </span>
            <ExternalLink2Icon />
          </a>
        ) : (
          <div className="flex items-center gap-[6px] rounded-icon border border-border bg-bg-card shadow-card-sm px-[10px] py-[6px]">
            <span className="text-[14px] font-medium text-text-primary whitespace-nowrap">
              {settings.website_text || "Visit our website"}
            </span>
          </div>
        )}
      </div>

      {/* Grid / Canvas switcher */}
      <div className="flex gap-[2px] rounded-icon border border-border bg-bg-card shadow-card-sm p-[2px] shrink-0">
        <button
          onClick={() => onViewModeChange("grid")}
          className={`flex items-center justify-center rounded-[6px] p-[6px] cursor-pointer transition-colors ${
            viewMode === "grid"
              ? "bg-bg-subtle text-icon-active"
              : "text-icon-inactive hover:text-icon-active"
          }`}
        >
          <GridPreviewIcon />
        </button>
        <button
          onClick={() => onViewModeChange("canvas")}
          className={`flex items-center justify-center rounded-[6px] p-[6px] cursor-pointer transition-colors ${
            viewMode === "canvas"
              ? "bg-bg-subtle text-icon-active"
              : "text-icon-inactive hover:text-icon-active"
          }`}
        >
          <CanvasPreviewIcon />
        </button>
      </div>
    </div>
  );
}

function ExternalLink2Icon() {
  return (
    <svg
      className="h-[14px] w-[14px] shrink-0 text-icon-active"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.66667 5.33333C4.29848 5.33333 4 5.03486 4 4.66667C4 4.29848 4.29848 4 4.66667 4H11.3333C11.7015 4 12 4.29848 12 4.66667V11.3333C12 11.7015 11.7015 12 11.3333 12C10.9651 12 10.6667 11.7015 10.6667 11.3333V6.27614L5.13807 11.8047C4.87772 12.0651 4.45561 12.0651 4.19526 11.8047C3.93491 11.5444 3.93491 11.1223 4.19526 10.8619L9.72386 5.33333H4.66667Z"
      />
    </svg>
  );
}

function GridPreviewIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.66732 1.3335C1.93094 1.3335 1.33398 1.93045 1.33398 2.66683V6.00016C1.33398 6.73654 1.93094 7.3335 2.66732 7.3335H6.00065C6.73703 7.3335 7.33398 6.73654 7.33398 6.00016V2.66683C7.33398 1.93045 6.73703 1.3335 6.00065 1.3335H2.66732Z" />
      <path d="M10.0007 1.3335C9.26427 1.3335 8.66732 1.93045 8.66732 2.66683V6.00016C8.66732 6.73654 9.26427 7.3335 10.0007 7.3335H13.334C14.0704 7.3335 14.6673 6.73654 14.6673 6.00016V2.66683C14.6673 1.93045 14.0704 1.3335 13.334 1.3335H10.0007Z" />
      <path d="M2.66732 8.66683C1.93094 8.66683 1.33398 9.26378 1.33398 10.0002V13.3335C1.33398 14.0699 1.93094 14.6668 2.66732 14.6668H6.00065C6.73703 14.6668 7.33398 14.0699 7.33398 13.3335V10.0002C7.33398 9.26378 6.73703 8.66683 6.00065 8.66683H2.66732Z" />
      <path d="M10.0007 8.66683C9.26427 8.66683 8.66732 9.26378 8.66732 10.0002V13.3335C8.66732 14.0699 9.26427 14.6668 10.0007 14.6668H13.334C14.0704 14.6668 14.6673 14.0699 14.6673 13.3335V10.0002C14.6673 9.26378 14.0704 8.66683 13.334 8.66683H10.0007Z" />
    </svg>
  );
}

function CanvasPreviewIcon() {
  return (
    <svg className="h-[16px] w-[16px]" viewBox="0 0 16 16" fill="currentColor">
      <path d="M5.00065 1.3335H3.33398C2.22941 1.3335 1.33398 2.22893 1.33398 3.3335V5.00016H5.00065V1.3335Z" />
      <path d="M1.33398 6.3335V9.66683L5.00065 9.66683V6.3335H1.33398Z" />
      <path d="M1.33398 11.0002V12.6668C1.33398 13.7714 2.22941 14.6668 3.33398 14.6668H5.00065V11.0002L1.33398 11.0002Z" />
      <path d="M6.33398 14.6668H9.66732V11.0002L6.33398 11.0002V14.6668Z" />
      <path d="M11.0007 14.6668H12.6673C13.7719 14.6668 14.6673 13.7714 14.6673 12.6668V11.0002H11.0007V14.6668Z" />
      <path d="M14.6673 9.66683V6.3335H11.0007V9.66683H14.6673Z" />
      <path d="M14.6673 5.00016V3.3335C14.6673 2.22893 13.7719 1.3335 12.6673 1.3335H11.0007V5.00016H14.6673Z" />
      <path d="M9.66732 1.3335H6.33398V5.00016L9.66732 5.00016V1.3335Z" />
      <path d="M6.33398 9.66683V6.3335L9.66732 6.3335V9.66683L6.33398 9.66683Z" />
    </svg>
  );
}
