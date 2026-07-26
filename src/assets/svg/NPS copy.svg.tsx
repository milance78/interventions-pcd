import { forwardRef } from "react";
import type { SVGProps } from "react";

export type NpsCopyIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const NpsCopyIcon = forwardRef<SVGSVGElement, NpsCopyIconProps>(
  ({ title, ...props }, ref) => (
    <svg
      width="32"
      height="40"
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      <defs>
        <linearGradient id="npsPaper" x1="8" y1="3" x2="25" y2="27">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id="npsBadge" x1="4" y1="25" x2="28" y2="38">
          <stop stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#5B21B6" />
        </linearGradient>
        <filter id="npsShadow" x="-35%" y="-35%" width="180%" height="190%">
          <feDropShadow
            dx="0"
            dy="1.4"
            stdDeviation="1.35"
            floodColor="#334155"
            floodOpacity="0.28"
          />
        </filter>
      </defs>

      <rect
        x="5"
        y="2"
        width="15"
        height="18"
        rx="2.5"
        fill="#CBD5E1"
        stroke="#64748B"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="5"
        width="16"
        height="21"
        rx="2.8"
        fill="url(#npsPaper)"
        stroke="#475569"
        strokeWidth="1.5"
        filter="url(#npsShadow)"
      />
      <path d="M13 10H21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 13.5H21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 17H21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

      <rect
        x="2.5"
        y="24"
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
        y="34.35"
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
