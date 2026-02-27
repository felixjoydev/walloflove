export default function WelcomeLoading() {
  return (
    <div className="w-full max-w-[620px]">
      <div
        className="w-full animate-pulse rounded-[16px]"
        style={{
          aspectRatio: "620 / 340",
          background: "linear-gradient(to top, #e6e6e6, #ffffff)",
          boxShadow:
            "0px 1px 3px 0px rgba(0,0,0,0.13), 0px 7px 20px 0px rgba(0,0,0,0.1), 0px 6px 14px 0px rgba(0,0,0,0.14)",
        }}
      />
    </div>
  );
}
