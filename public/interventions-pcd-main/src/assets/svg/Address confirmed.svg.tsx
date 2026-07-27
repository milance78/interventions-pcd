import { forwardRef } from "react";
import type { SVGProps } from "react";
import artworkUrl from "./Address confirmed.png";

export type AddressConfirmedIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const AddressConfirmedIcon = forwardRef<SVGSVGElement, AddressConfirmedIconProps>(
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

AddressConfirmedIcon.displayName = "AddressConfirmedIcon";

export { AddressConfirmedIcon as ReactComponent };
export default AddressConfirmedIcon;
