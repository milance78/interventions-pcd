import "./SnowPendingInput.scss";

import Numbers from "@mui/icons-material/Numbers";
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

  return (
    <div className={`snow-pending-input ${className}`.trim()}>
      <div className="snow-pending-input__field">
        <SimpleInput
          field={field}
          label={label}
          inputType="type2"
          icon={Numbers}
        />
      </div>

      <button
        type="button"
        className={`snow-pending-input__button ${
          isPending
            ? "snow-pending-input__button--active"
            : ""
        }`}
        onClick={() =>
          dispatch(
            updateField({
              field: pendingField,
              value: !isPending,
            }),
          )
        }
        aria-label={pendingLabel}
        title={pendingLabel}
        aria-pressed={isPending}
      >
        En attente
      </button>
    </div>
  );
};

export default SnowPendingInput;
