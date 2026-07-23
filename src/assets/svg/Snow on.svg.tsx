import { forwardRef } from "react";
import type { SVGProps } from "react";

export type SnowOnIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const SnowOnIcon = forwardRef<SVGSVGElement, SnowOnIconProps>(
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
      <g
        transform="rotate(15 128 128)"
        stroke="#2196F3"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M128 24V232" />
        <path d="M38 76L218 180" />
        <path d="M38 180L218 76" />
        <polygon
          points="     128,55     190,91     190,165     128,201     66,165     66,91"
          fill="none"
        />
        <polygon
          points="     128,88     163,108     163,148     128,168     93,148     93,108"
          fill="none"
        />
        <path d="M128 65L102 39" />
        <path d="M128 65L154 39" />
        <path d="M128 191L102 217" />
        <path d="M128 191L154 217" />
        <path d="M83 102L48 102" />
        <path d="M83 102L68 72" />
        <path d="M83 154L48 154" />
        <path d="M83 154L68 184" />
        <path d="M173 102L208 102" />
        <path d="M173 102L188 72" />
        <path d="M173 154L208 154" />
        <path d="M173 154L188 184" />
      </g>
    </svg>
  ),
);

SnowOnIcon.displayName = "SnowOnIcon";

export { SnowOnIcon as ReactComponent };
export default SnowOnIcon;
