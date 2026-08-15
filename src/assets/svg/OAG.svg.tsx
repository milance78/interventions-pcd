import type { SVGProps } from "react";

export const ReactComponent = (
  props: SVGProps<SVGSVGElement>,
) => (
  <svg
    viewBox="0 0 64 64"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <defs>
      <linearGradient id="oagIconFace" x1="15" y1="10" x2="49" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffb65b" />
        <stop offset="0.35" stopColor="#f58a24" />
        <stop offset="0.72" stopColor="#e56712" />
        <stop offset="1" stopColor="#c94f08" />
      </linearGradient>
      <linearGradient id="oagIconEdge" x1="14" y1="9" x2="50" y2="55" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ff9b2f" />
        <stop offset="1" stopColor="#b94206" />
      </linearGradient>
      <linearGradient id="oagIconGloss" x1="32" y1="10" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.56" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <filter id="oagIconShadow" x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#8a3605" floodOpacity="0.34" />
      </filter>
    </defs>
    <g filter="url(#oagIconShadow)">
      <circle cx="32" cy="32" r="24" fill="url(#oagIconEdge)" />
      <circle cx="32" cy="30.5" r="22.5" fill="url(#oagIconFace)" />
      <path d="M14 27C17 16 24 10 32 10C41 10 48 16 51 26C42 21 23 21 14 27Z" fill="url(#oagIconGloss)" />
      <circle cx="32" cy="30.5" r="21" fill="none" stroke="#ffd29b" strokeOpacity="0.48" />
      <text
        x="32"
        y="31.7"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="16.5"
        fontWeight="800"
        letterSpacing="-0.7"
      >
        OAG
      </text>
    </g>
  </svg>
);
