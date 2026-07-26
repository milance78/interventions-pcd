import { forwardRef } from "react";
import type { SVGProps } from "react";

export type NpsCopyIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const NpsCopyIcon = forwardRef<SVGSVGElement, NpsCopyIconProps>(
  ({ title, ...props }, ref) => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id="npsPaper" x1="9" y1="2" x2="24" y2="22">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="npsBadge" x1="4" y1="18" x2="28" y2="31">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
        <filter id="npsShadow" x="-35%" y="-35%" width="180%" height="190%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.25"
            floodColor="#334155"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      {/* Compact document artwork: same overall icon footprint as the normal copy icon. */}
      <rect
        x="7"
        y="2"
        width="13"
        height="15"
        rx="2.3"
        fill="#CBD5E1"
        stroke="#64748B"
        strokeWidth="1.35"
      />
      <rect
        x="10"
        y="4.5"
        width="14"
        height="17"
        rx="2.6"
        fill="url(#npsPaper)"
        stroke="#475569"
        strokeWidth="1.45"
        filter="url(#npsShadow)"
      />
      <path d="M13 9H21" stroke="#94A3B8" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M13 12.2H21" stroke="#94A3B8" strokeWidth="1.45" strokeLinecap="round" />
      <path d="M13 15.4H21" stroke="#94A3B8" strokeWidth="1.45" strokeLinecap="round" />

      {/* The NPS badge and lettering keep their previous dimensions. */}
      <rect
        x="2.5"
        y="17.5"
        width="27"
        height="14"
        rx="5"
        fill="url(#npsBadge)"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        filter="url(#npsShadow)"
      />
      <text
        x="16"
        y="27.85"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10.4"
        fontWeight="900"
        letterSpacing="0.15"
      >
        NPS
      </text>
    </svg>
  ),
);

NpsCopyIcon.displayName = "NpsCopyIcon";

export { NpsCopyIcon as ReactComponent };
export default NpsCopyIcon;
