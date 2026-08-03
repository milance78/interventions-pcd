import * as React from "react";
import "./LetterBadge.scss";

type Props = { text: "OAG" | "NA" | "CID"; className?: string };

const LetterBadge = ({ text, className = "" }: Props) => (
  <span className={`letter-badge letter-badge--${text.toLowerCase()} ${className}`.trim()} aria-hidden="true">
    {text}
  </span>
);

export default LetterBadge;
