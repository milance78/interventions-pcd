import * as React from "react";
import AcUnitRounded from "@mui/icons-material/AcUnitRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import "./SnowStatusIcon.scss";

type Props = { direction?: "left" | "right" | "none"; className?: string };
const SnowStatusIcon = ({ direction = "none", className = "" }: Props) => (
  <span className={`snow-status-icon snow-status-icon--${direction} ${className}`.trim()} aria-hidden="true">
    <AcUnitRounded className="snow-status-icon__flake" />
    {direction === "left" && <ArrowBackRounded className="snow-status-icon__arrow" />}
    {direction === "right" && <ArrowForwardRounded className="snow-status-icon__arrow" />}
  </span>
);
export default SnowStatusIcon;
