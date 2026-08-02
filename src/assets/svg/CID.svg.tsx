import { forwardRef } from "react";
import type { SVGProps } from "react";

export type CIDIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const CIDIcon = forwardRef<SVGSVGElement, CIDIconProps>(
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
        y="66"
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="52"
        fontWeight="800"
        fill="#000"
        letterSpacing="-2"
      >
        CID
      </text>
    </svg>
  ),
);

CIDIcon.displayName = "CIDIcon";

export { CIDIcon as ReactComponent };
export default CIDIcon;
