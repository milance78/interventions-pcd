import { forwardRef } from "react";
import type { SVGProps } from "react";

export type CopyIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const CopyIcon = forwardRef<SVGSVGElement, CopyIconProps>(
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
        <linearGradient id="copyPaper" x1="8" y1="5" x2="25" y2="27">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id="copyShadow" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow
            dx="0"
            dy="1.2"
            stdDeviation="1.2"
            floodColor="#64748B"
            floodOpacity="0.24"
          />
        </filter>
      </defs>

      <rect
        x="5"
        y="4"
        width="15"
        height="18"
        rx="2.5"
        fill="#E2E8F0"
        stroke="#A8B4C6"
        strokeWidth="1.4"
      />
      <rect
        x="9"
        y="7"
        width="16"
        height="19"
        rx="2.8"
        fill="url(#copyPaper)"
        stroke="#B5C0D0"
        strokeWidth="1.5"
        filter="url(#copyShadow)"
      />
      <path d="M13 12H21" stroke="#B5C0D0" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 15.5H21" stroke="#B5C0D0" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 19H21" stroke="#B5C0D0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
);

CopyIcon.displayName = "CopyIcon";

export { CopyIcon as ReactComponent };
export default CopyIcon;
