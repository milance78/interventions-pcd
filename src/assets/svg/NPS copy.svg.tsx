import { forwardRef, useId } from "react";
import type { SVGProps } from "react";

export type NpsCopyIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const NpsCopyIcon = forwardRef<SVGSVGElement, NpsCopyIconProps>(
  ({ title, ...props }, ref) => {
    const id = useId().replace(/:/g, "");
    const paperGradientId = `npsPaper-${id}`;
    const badgeGradientId = `npsBadge-${id}`;
    const shadowId = `npsShadow-${id}`;

    return (
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
          <linearGradient id={paperGradientId} x1="9" y1="2" x2="24" y2="22">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id={badgeGradientId} x1="2" y1="19" x2="30" y2="31">
            <stop stopColor="#9B6BFF" />
            <stop offset="1" stopColor="#5B21B6" />
          </linearGradient>
          <filter id={shadowId} x="-35%" y="-35%" width="180%" height="190%">
            <feDropShadow
              dx="0"
              dy="1.1"
              stdDeviation="1.15"
              floodColor="#64748B"
              floodOpacity="0.25"
            />
          </filter>
        </defs>

        <rect
          x="7"
          y="2"
          width="13"
          height="15"
          rx="2.3"
          fill="#E2E8F0"
          stroke="#A8B4C6"
          strokeWidth="1.35"
        />
        <rect
          x="10"
          y="4.5"
          width="14"
          height="17"
          rx="2.6"
          fill={`url(#${paperGradientId})`}
          stroke="#B5C0D0"
          strokeWidth="1.45"
          filter={`url(#${shadowId})`}
        />
        <path d="M13 9H21" stroke="#B5C0D0" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M13 12.2H21" stroke="#B5C0D0" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M13 15.4H21" stroke="#B5C0D0" strokeWidth="1.4" strokeLinecap="round" />

        <rect
          x="1.5"
          y="18"
          width="29"
          height="13"
          rx="4.6"
          fill={`url(#${badgeGradientId})`}
          stroke="#FFFFFF"
          strokeWidth="1.45"
          filter={`url(#${shadowId})`}
        />
        <text
          x="16"
          y="27.65"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="11.8"
          fontWeight="900"
          letterSpacing="0"
        >
          NPS
        </text>
      </svg>
    );
  },
);

NpsCopyIcon.displayName = "NpsCopyIcon";

export { NpsCopyIcon as ReactComponent };
export default NpsCopyIcon;
