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
        <linearGradient id="npsPaper" x1="7" y1="4" x2="23" y2="25">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="npsBadge" x1="10" y1="18" x2="27" y2="30">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
        <filter id="npsShadow" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow
            dx="0"
            dy="1.5"
            stdDeviation="1.4"
            floodColor="#334155"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <rect
        x="5"
        y="4"
        width="15"
        height="18"
        rx="2.5"
        fill="#CBD5E1"
        stroke="#64748B"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="7"
        width="16"
        height="19"
        rx="2.8"
        fill="url(#npsPaper)"
        stroke="#475569"
        strokeWidth="1.5"
        filter="url(#npsShadow)"
      />
      <path d="M13 12H21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 15.5H21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

      <rect
        x="8.5"
        y="18.5"
        width="20"
        height="10"
        rx="4"
        fill="url(#npsBadge)"
        stroke="#FFFFFF"
        strokeWidth="1.3"
        filter="url(#npsShadow)"
      />
      <text
        x="18.5"
        y="25.45"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7"
        fontWeight="800"
        letterSpacing="0.25"
      >
        NPS
      </text>
    </svg>
  ),
);

NpsCopyIcon.displayName = "NpsCopyIcon";

export { NpsCopyIcon as ReactComponent };
export default NpsCopyIcon;
