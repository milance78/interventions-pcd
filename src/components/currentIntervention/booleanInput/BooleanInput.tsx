import React from "react";
import "./BooleanInput.scss";

import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { updateField } from "../../../redux/features/newInterventionSlice";

type BooleanField =
  | "isSnow"
  | "isUnclear"
  | "isGoodExample"
  | "isAddressConfirmed";

interface BooleanInputProps {
  field: BooleanField;
  label: string;
  trueIcon: React.ReactNode;
  falseIcon: React.ReactNode;
}

const BooleanInput = ({
  field,
  label,
  trueIcon,
  falseIcon,
}: BooleanInputProps) => {
  const dispatch = useAppDispatch();

  const value = useAppSelector(
    (state) => Boolean(state.newIntervention[field]),
  );

  const toggleValue = () => {
    dispatch(
      updateField({
        field,
        value: !value,
      }),
    );
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