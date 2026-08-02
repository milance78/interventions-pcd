import * as React from "react";

import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";

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

  const clockButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [notificationOpen, setNotificationOpen] = React.useState(false);

  React.useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  const showNotification = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    setNotificationOpen(true);

    hideTimerRef.current = setTimeout(() => {
      setNotificationOpen(false);
    }, 1500);
  };

  const togglePending = () => {
    dispatch(
      updateField({
        field: pendingField,
        value: !isPending,
      }),
    );

    if (!isPending) {
      showNotification();
    } else {
      setNotificationOpen(false);
    }
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
        ref={clockButtonRef}
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

      <Popper
        open={notificationOpen}
        anchorEl={clockButtonRef.current}
        placement="top"
        transition
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 10],
            },
          },
        ]}
        className="snow-pending-input__popper"
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={140}>
            <Paper
              elevation={5}
              className="snow-pending-input__notification"
              role="status"
            >
              {pendingLabel}
            </Paper>
          </Fade>
        )}
      </Popper>
    </div>
  );
};

export default SnowPendingInput;
