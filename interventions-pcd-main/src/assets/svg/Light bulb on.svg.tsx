import { forwardRef } from "react";
import type { SVGProps } from "react";

export type LightBulbOnIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

const LightBulbOnIcon = forwardRef<SVGSVGElement, LightBulbOnIconProps>(
  ({ title, ...props }, ref) => (
    <svg
      width="512"
      height="600"
      viewBox="0 0 512 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id="clip">
          <rect width="512" height="600" />
        </clipPath>
      </defs>
      <g clipPath="url(#clip)">
        <g stroke="#AFAFAF" strokeWidth="22" strokeLinecap="round">
          <path d="M256 15V55" />
          <path d="M125 35L155 80" />
          <path d="M35 125L80 155" />
          <path d="M15 256H55" />
          <path d="M35 387L80 357" />
          <path d="M477 387L432 357" />
          <path d="M497 256H457" />
          <path d="M477 125L432 155" />
          <path d="M387 35L357 80" />
        </g>
        <g stroke="#FFD42A" strokeWidth="16" strokeLinecap="round">
          <path d="M256 15V55" />
          <path d="M125 35L155 80" />
          <path d="M35 125L80 155" />
          <path d="M15 256H55" />
          <path d="M35 387L80 357" />
          <path d="M477 387L432 357" />
          <path d="M497 256H457" />
          <path d="M477 125L432 155" />
          <path d="M387 35L357 80" />
        </g>
        <path
          d=" M256 105 C145 105 82 180 108 280 C125 350 180 375 185 430 C187 455 210 468 256 468 C302 468 325 455 327 430 C332 375 387 350 404 280 C430 180 367 105 256 105Z"
          fill="#FFD42A"
          stroke="#111111"
          strokeWidth="18"
          strokeLinejoin="round"
        />
        <path
          d="M150 190C175 150 215 135 250 135"
          stroke="#FFF1A3"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d=" M220 290 C205 265 185 275 190 305 C195 330 225 325 240 290 C255 255 270 255 282 290 C295 325 320 330 322 300 C324 275 300 265 285 290"
          stroke="#111111"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M238 300V462M278 300V462"
          stroke="#111111"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d=" M195 455 H317 C325 455 330 465 330 480 L322 535 C318 555 295 570 256 570 C217 570 194 555 190 535 L182 480 C182 465 187 455 195 455Z"
          fill="#BDBDBD"
          stroke="#111111"
          strokeWidth="12"
        />
        <path
          d=" M205 470 C202 500 210 530 238 550 C220 545 210 530 207 510 L198 485 C196 475 200 470 205 470Z"
          fill="#EEEEEE"
        />
        <g stroke="#111111" strokeWidth="10" strokeLinecap="round">
          <path d="M188 480H324" />
          <path d="M190 505H322" />
          <path d="M194 530H318" />
          <path d="M215 552H297" />
        </g>
      </g>
    </svg>
  ),
);

LightBulbOnIcon.displayName = "LightBulbOnIcon";

export { LightBulbOnIcon as ReactComponent };
export default LightBulbOnIcon;
