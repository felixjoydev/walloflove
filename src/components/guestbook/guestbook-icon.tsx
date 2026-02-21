interface GuestbookIconProps {
  size?: "md" | "sm";
}

export function GuestbookIcon({ size = "md" }: GuestbookIconProps) {
  if (size === "sm") {
    return (
      <div className="relative inline-grid w-[40px] h-[30px]">
        <div className="col-start-1 row-start-1 w-[40px] h-[30px] rounded-icon border border-border bg-bg-card shadow-card-sm" />
        <div className="col-start-1 row-start-1 flex flex-col gap-[1.5px] mt-[2px] ml-[2px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-[5px] h-[5px] rounded-full bg-bg-subtle shadow-inset"
            />
          ))}
        </div>
        <div className="col-start-1 row-start-1 mt-[5px] ml-[11px]">
          <img src="/guestbook-lines.svg" alt="" className="w-[24px] h-[20px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative inline-grid w-[64px] h-[46px]">
      <div className="col-start-1 row-start-1 w-[64px] h-[46px] rounded-icon border border-border bg-bg-card shadow-card-sm" />
      <div className="col-start-1 row-start-1 flex flex-col gap-[2px] mt-[4px] ml-[4px]">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-[8px] h-[8px] rounded-full bg-bg-subtle shadow-inset"
          />
        ))}
      </div>
      <div className="col-start-1 row-start-1 mt-[8px] ml-[17px]">
        <img src="/guestbook-lines.svg" alt="" className="w-[39px] h-[32px]" />
      </div>
    </div>
  );
}
