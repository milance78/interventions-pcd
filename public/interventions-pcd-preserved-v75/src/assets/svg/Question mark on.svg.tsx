import { forwardRef } from "react";
import type { SVGProps } from "react";

export type QuestionMarkOnIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const QuestionMarkOnIcon = forwardRef<SVGSVGElement, QuestionMarkOnIconProps>(
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
        <linearGradient id="redGradient" x1="80" y1="20" x2="180" y2="230">
          <stop offset="0" stopColor="#FF5252" />
          <stop offset="0.45" stopColor="#FF1744" />
          <stop offset="1" stopColor="#B00020" />
        </linearGradient>
        <filter id="redShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="4"
            dy="6"
            stdDeviation="4"
            floodColor="#550000"
            floodOpacity="0.45"
          />
        </filter>
      </defs>
      <path
        d="   M82 84   C82 48 112 24 150 24   C188 24 216 50 216 86   C216 116 198 134 172 150   L150 164   V198"
        stroke="#7A0010"
        strokeWidth="38"
        strokeLinecap="butt"
        strokeLinejoin="round"
        opacity="0.55"
        transform="translate(0 5)"
      />
      <path
        d="   M82 84   C82 48 112 24 150 24   C188 24 216 50 216 86   C216 116 198 134 172 150   L150 164   V198"
        stroke="url(#redGradient)"
        strokeWidth="32"
        strokeLinecap="butt"
        strokeLinejoin="round"
        filter="url(#redShadow)"
      />
      <rect
        x="134"
        y="226"
        width="32"
        height="32"
        fill="#7A0010"
        opacity="0.55"
        transform="translate(0 5)"
      />
      <rect
        x="134"
        y="220"
        width="32"
        height="32"
        fill="url(#redGradient)"
        filter="url(#redShadow)"
      />
    </svg>
  ),
);

QuestionMarkOnIcon.displayName = "QuestionMarkOnIcon";

export { QuestionMarkOnIcon as ReactComponent };
export default QuestionMarkOnIcon;
