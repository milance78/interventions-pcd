import * as React from "react";

import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";

import "./SnowPendingInput.scss";

import SimpleInput from "../simpleInput/SimpleInput";
import {
  updateField,
  type InterventionField,
} from "../../../redux/features/newInterventionSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../redux/store";

type PendingField =
  | "isSnowSentPending"
  | "isSnowReceivedPending";

interface SnowPendingInputProps {
  field: InterventionField;
  pendingField: PendingField;
  label: string;
  pendingLabel: string;
  className?: string;
}

const SnowPendingInput = ({
  field,
  pendingField,
  label,
  pendingLabel,
  className = "",
}: SnowPendingInputProps) => {
  const dispatch = useAppDispatch();
  const isPending = useAppSelector((state) =>
    Boolean(state.newIntervention[pendingField]),
  );

  const togglePending = () => {
    dispatch(
      updateField({
        field: pendingField,
        value: !isPending,
      }),
    );

  };

  return (
    <div className={`snow-pending-input ${className}`.trim()}>
      <div className="snow-pending-input__field">
        <SimpleInput
          field={field}
          label={label}
          inputType="type2"
        />
      </div>

      <button
        type="button"
        className={`snow-pending-input__clock ${
          isPending ? "snow-pending-input__clock--active" : ""
        }`}
        onClick={togglePending}
        aria-label={pendingLabel}
        title={pendingLabel}
        aria-pressed={isPending}
      >
        <AccessTimeRounded aria-hidden="true" />
      </button>

    </div>
  );
};

export default SnowPendingInput;
