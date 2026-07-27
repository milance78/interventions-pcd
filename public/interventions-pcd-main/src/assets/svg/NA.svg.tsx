import { forwardRef } from "react";
import type { SVGProps } from "react";

export type NAIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const NAIcon = forwardRef<SVGSVGElement, NAIconProps>(
  ({ title, ...props }, ref) => (
    <svg
      viewBox="0 0 128 128"
      width="128"
      height="128"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <text
        x="64"
        y="64"
        dy="0.45em"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill="#000"
      >
        NA
      </text>
    </svg>
  ),
);

NAIcon.displayName = "NAIcon";

export { NAIcon as ReactComponent };
export default NAIcon;
