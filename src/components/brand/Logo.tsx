import { useId } from "react";

export function LogoMark({
  className,
  tone = "gradient",
}: {
  className?: string;
  tone?: "gradient" | "white";
}) {
  const gradientId = `rezervasyo-logo-${useId()}`;
  const stroke = tone === "white" ? "#FFFFFF" : `url(#${gradientId})`;

  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {tone === "gradient" && (
        <defs>
          <linearGradient id={gradientId} x1="4" y1="2" x2="37" y2="37" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1E2750" />
            <stop offset="0.55" stopColor="#3A2E78" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      )}
      <rect x="5" y="3.5" width="25" height="29" rx="7" stroke={stroke} strokeWidth="3" />
      <rect x="12.5" y="0.5" width="3" height="6.5" rx="1.5" fill={stroke} />
      <rect x="21.5" y="0.5" width="3" height="6.5" rx="1.5" fill={stroke} />
      <line x1="8.5" y1="11.5" x2="26.5" y2="11.5" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M10.5 20.5L15 25L23 14.5" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="27.5" cy="26.5" r="5" stroke={stroke} strokeWidth="2.6" />
      <line x1="31" y1="30" x2="37" y2="36" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
