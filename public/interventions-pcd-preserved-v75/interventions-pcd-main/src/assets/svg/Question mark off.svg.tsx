import { forwardRef } from "react";
import type { SVGProps } from "react";

export type QuestionMarkOffIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const QuestionMarkOffIcon = forwardRef<SVGSVGElement, QuestionMarkOffIconProps>(
  ({ title, ...props }, ref) => (
    <svg
      width="256"
      height="256"
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id="greyGradient" x1="80" y1="20" x2="180" y2="230">
          <stop offset="0" stopColor="#D1D5DB" />
          <stop offset="0.45" stopColor="#9CA3AF" />
          <stop offset="1" stopColor="#6B7280" />
        </linearGradient>
        <filter id="greyShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="4"
            dy="6"
            stdDeviation="4"
            floodColor="#000000"
            floodOpacity="0.3"
          />
        </filter>
      </defs>
      <path
        d="   M82 84   C82 48 112 24 150 24   C188 24 216 50 216 86   C216 116 198 134 172 150   L150 164   V198"
        stroke="#5B6470"
        strokeWidth="38"
        strokeLinecap="butt"
        strokeLinejoin="round"
        opacity="0.45"
        transform="translate(0 5)"
      />
      <path
        d="   M82 84   C82 48 112 24 150 24   C188 24 216 50 216 86   C216 116 198 134 172 150   L150 164   V198"
        stroke="url(#greyGradient)"
        strokeWidth="32"
        strokeLinecap="butt"
        strokeLinejoin="round"
        filter="url(#greyShadow)"
      />
      <rect
        x="134"
        y="226"
        width="32"
        height="32"
        fill="#5B6470"
        opacity="0.45"
        transform="translate(0 5)"
      />
      <rect
        x="134"
        y="220"
        width="32"
        height="32"
        fill="url(#greyGradient)"
        filter="url(#greyShadow)"
      />
    </svg>
  ),
);

QuestionMarkOffIcon.displayName = "QuestionMarkOffIcon";

export { QuestionMarkOffIcon as ReactComponent };
export default QuestionMarkOffIcon;
