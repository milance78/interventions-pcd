import React from "react";
import "./BooleanInput.scss";

import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { updateField } from "../../../redux/features/newInterventionSlice";

type BooleanField =
  | "isSnow"
  | "isResPending"
  | "isUnclear"
  | "isGoodExample";

interface BooleanInputProps {
  field: BooleanField;
  label: string;
  trueIcon: React.ReactNode;
  falseIcon: React.ReactNode;
  onActivated?: () => void;
}

const BooleanInput = ({
  field,
  label,
  trueIcon,
  falseIcon,
  onActivated,
}: BooleanInputProps) => {
  const dispatch = useAppDispatch();

  const value = useAppSelector(
    (state) => Boolean(state.newIntervention[field]),
  );

  const toggleValue = () => {
    const nextValue = !value;

    dispatch(
      updateField({
        field,
        value: nextValue,
      }),
    );

    if (nextValue) {
      onActivated?.();
    }
  };

  return (
    <button
      type="button"
      className={`boolean-input ${value ? "active" : ""}`}
      onClick={toggleValue}
      aria-label={label}
      title={label}
      aria-pressed={value}
    >
      <span className="boolean-input-icon">
        {value ? trueIcon : falseIcon}
      </span>
    </button>
  );
};

export default BooleanInput;