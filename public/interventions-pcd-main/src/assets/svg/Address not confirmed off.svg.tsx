import { forwardRef } from "react";
import type { SVGProps } from "react";
import artworkUrl from "./Address not confirmed off.png";

export type AddressNotConfirmedOffIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const AddressNotConfirmedOffIcon = forwardRef<SVGSVGElement, AddressNotConfirmedOffIconProps>(
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
      <image
        href={artworkUrl}
        x="0"
        y="0"
        width="256"
        height="256"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  ),
);

AddressNotConfirmedOffIcon.displayName = "AddressNotConfirmedOffIcon";

export { AddressNotConfirmedOffIcon as ReactComponent };
export default AddressNotConfirmedOffIcon;
