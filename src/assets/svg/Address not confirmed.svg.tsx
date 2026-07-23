import { forwardRef } from "react";
import type { SVGProps } from "react";

export type AddressNotConfirmedIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const AddressNotConfirmedIcon = forwardRef<
  SVGSVGElement,
  AddressNotConfirmedIconProps
>(({ title, ...props }, ref) => (
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
      <linearGradient id="mapBg" x1="14" y1="14" x2="210" y2="210">
        <stop stopColor="#FCFCFD" />
        <stop offset="1" stopColor="#F1F5F9" />
      </linearGradient>
      <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="10"
          floodColor="#0F172A"
          floodOpacity="0.18"
        />
      </filter>
      <clipPath id="mapClip">
        <rect x="14" y="14" width="196" height="196" rx="32" />
      </clipPath>
    </defs>
    <rect
      x="14"
      y="14"
      width="196"
      height="196"
      rx="32"
      fill="url(#mapBg)"
      stroke="#334155"
      strokeWidth="4"
      filter="url(#shadow)"
    />
    <g clipPath="url(#mapClip)" strokeLinecap="round">
      <g stroke="#CBD5E1" strokeWidth="13">
        <path d="M0 75H220" />
        <path d="M0 120H220" />
        <path d="M0 165H220" />
        <path d="M75 0V220" />
        <path d="M125 0V220" />
        <path d="M175 0V220" />
      </g>
      <g stroke="#94A3B8" strokeWidth="6">
        <path d="M38 8L137 92L220 176" />
        <path d="M220 32L137 92L10 202" />
      </g>
    </g>
    <circle cx="137" cy="92" r="40" fill="#2563EB" fillOpacity="0.18" />
    <circle cx="137" cy="92" r="27" fill="#2563EB" />
    <circle cx="137" cy="92" r="11" fill="white" />
  </svg>
));

AddressNotConfirmedIcon.displayName = "AddressNotConfirmedIcon";

export { AddressNotConfirmedIcon as ReactComponent };
export default AddressNotConfirmedIcon;
