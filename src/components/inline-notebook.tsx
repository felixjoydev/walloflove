export function InlineNotebook() {
  return (
    <span className="inline-block align-middle">
      <svg width="34" height="26" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Card background */}
        <rect x="0.5" y="0.5" width="39" height="29" rx="4" fill="white" stroke="#E5E5E5" />
        {/* Spiral binding dots */}
        <circle cx="5" cy="5" r="2.5" fill="#F0F0F0" />
        <circle cx="5" cy="11" r="2.5" fill="#F0F0F0" />
        <circle cx="5" cy="17" r="2.5" fill="#F0F0F0" />
        <circle cx="5" cy="23" r="2.5" fill="#F0F0F0" />
        {/* Dashed lines */}
        <line x1="11" y1="6" x2="35" y2="6" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="11" y1="12" x2="35" y2="12" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="11" y1="18" x2="35" y2="18" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="11" y1="24" x2="35" y2="24" stroke="#F1F1F1" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </span>
  );
}
