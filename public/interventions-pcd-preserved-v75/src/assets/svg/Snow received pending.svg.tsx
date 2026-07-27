import { forwardRef } from "react";
import type { SVGProps } from "react";

export type SnowReceivedPendingIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const SnowReceivedPendingIcon = forwardRef<SVGSVGElement, SnowReceivedPendingIconProps>(
  ({ title, ...props }, ref) => (
    <svg width="256" height="256" viewBox="0 0 256 256" fill="none"
      xmlns="http://www.w3.org/2000/svg" ref={ref}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <g transform="translate(22 8) scale(0.83)">
        <g transform="rotate(15 128 128)" stroke="#2196F3" strokeWidth="12"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M128 24V232" />
          <path d="M38 76L218 180" />
          <path d="M38 180L218 76" />
          <polygon points="128,55 190,91 190,165 128,201 66,165 66,91" fill="none" />
          <polygon points="128,88 163,108 163,148 128,168 93,148 93,108" fill="none" />
          <path d="M128 65L102 39" /><path d="M128 65L154 39" />
          <path d="M128 191L102 217" /><path d="M128 191L154 217" />
          <path d="M83 102L48 102" /><path d="M83 102L68 72" />
          <path d="M83 154L48 154" /><path d="M83 154L68 184" />
          <path d="M173 102L208 102" /><path d="M173 102L188 72" />
          <path d="M173 154L208 154" /><path d="M173 154L188 184" />
        </g>
      </g>
      <defs>
        <linearGradient id="snowArrowGold" x1="72" y1="176" x2="184" y2="242">
          <stop offset="0" stopColor="#fff3a3" />
          <stop offset="0.48" stopColor="#facc15" />
          <stop offset="1" stopColor="#d79b00" />
        </linearGradient>
        <filter id="snowArrowDepth" x="-30%" y="-35%" width="170%" height="190%">
          <feDropShadow dx="0" dy="4" stdDeviation="3"
            floodColor="#7a5200" floodOpacity="0.42" />
        </filter>
      </defs>

      <g stroke="#8a5a00" strokeWidth="25" strokeLinecap="round"
        strokeLinejoin="round" filter="url(#snowArrowDepth)">
        <path d="M194 211H62" /><path d="M92 181L62 211L92 241" />
      </g>
      <g stroke="url(#snowArrowGold)" strokeWidth="15"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M194 211H62" /><path d="M92 181L62 211L92 241" />
      </g>
      <g stroke="rgba(255,255,255,0.72)" strokeWidth="3"
        strokeLinecap="round" strokeLinejoin="round"
        transform="translate(0 -3)">
        <path d="M194 211H62" /><path d="M92 181L62 211L92 241" />
      </g>
    </svg>
  ),
);

SnowReceivedPendingIcon.displayName = "SnowReceivedPendingIcon";
export { SnowReceivedPendingIcon as ReactComponent };
export default SnowReceivedPendingIcon;
