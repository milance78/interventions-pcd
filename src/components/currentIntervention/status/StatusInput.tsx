import * as React from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import CalendarMonthRounded from "@mui/icons-material/CalendarMonthRounded";
import { updateField } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";


const StatusInput = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.newIntervention.status);
  const postponedDate = useAppSelector((state) => state.newIntervention.postponedDate);
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [pendingDate, setPendingDate] = React.useState(postponedDate ?? "");

  React.useEffect(() => {
    setPendingDate(postponedDate ?? "");
  }, [postponedDate]);

  const applyStatus = (nextStatus: string) => {
    dispatch(updateField({ field: "status", value: nextStatus }));
    if (nextStatus !== "postponed") {
      dispatch(updateField({ field: "postponedDate", value: null }));
    }
    if (nextStatus === "completed") {
      dispatch(updateField({ field: "cure", value: "noCure" }));
      dispatch(updateField({ field: "isSnowReceivedPending", value: false }));
      dispatch(updateField({ field: "isSnowSentPending", value: false }));
      dispatch(updateField({ field: "isSnow", value: false }));
      dispatch(updateField({ field: "isResPending", value: false }));
      dispatch(updateField({ field: "smsEnabled", value: false }));
    }
  };

  const handleChange = (event: any) => {
    const nextStatus = event.target.value;
    if (nextStatus === "postponed") {
      setPendingDate(postponedDate ?? "");
      setCalendarOpen(true);
      return;
    }
    applyStatus(nextStatus);
  };

  const validatePostponement = () => {
    if (!pendingDate) return;
    // Postponed is its own En attente list: clear the other pending markers so
    // the intervention cannot appear in two sections at the same time.
    dispatch(updateField({ field: "cure", value: "noCure" }));
    dispatch(updateField({ field: "isSnowReceivedPending", value: false }));
    dispatch(updateField({ field: "isSnowSentPending", value: false }));
    dispatch(updateField({ field: "isSnow", value: false }));
    dispatch(updateField({ field: "isResPending", value: false }));
    dispatch(updateField({ field: "isUnclear", value: false }));
    dispatch(updateField({ field: "postponedDate", value: pendingDate }));
    dispatch(updateField({ field: "status", value: "postponed" }));
    setCalendarOpen(false);
  };

  return (
    <>
      <div className="status-input-shell">
        <FormControl variant="outlined" className="status-input" size="small" fullWidth>
          <Select
            className="status-select"
            id="status-select"
            value={status}
            displayEmpty
            notched={false}
            onChange={handleChange}
            sx={{
              "& .MuiSelect-select": {
                backgroundColor:
                  status === "" ? "#f1f5f9" :
                  status === "completed" ? "#dcfce7" :
                  status === "on hold" ? "#fef3c7" :
                  status === "transferred" ? "#dbeafe" :
                  status === "postponed" ? "#f3e8ff" : "#f1f5f9",
                display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
              },
              color:
                status === "completed" ? "#166534" :
                status === "on hold" ? "#92400e" :
                status === "transferred" ? "#1d4ed8" :
                status === "postponed" ? "#6b21a8" : "#475569",
              fontWeight: 700,
              borderRadius: "12px",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor:
                  status === "completed" ? "#86d49c" :
                  status === "on hold" ? "#efc55d" :
                  status === "transferred" ? "#93baf4" :
                  status === "postponed" ? "#c4b5fd" : "#cbd5e1",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9e9e9e" },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777777", borderWidth: "2px" },
            }}
            renderValue={(selected) => {
              if (selected === "") return <span style={{ color: "#777" }}>Status</span>;
              if (selected === "completed") return "Terminé";
              if (selected === "on hold") return "En attente";
              if (selected === "transferred") return "Transmis";
              if (selected === "postponed") return "Postposer";
              return "";
            }}
          >
            <MenuItem value="completed">Terminé</MenuItem>
            <MenuItem value="on hold">En attente</MenuItem>
            <MenuItem value="transferred">Transmis</MenuItem>
            <MenuItem value="postponed">Postposer</MenuItem>
          </Select>
        </FormControl>
      </div>

      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} className="postpone-calendar-dialog">
        <DialogTitle><CalendarMonthRounded /> Choisir la date de report</DialogTitle>
        <DialogContent>
          <input
            className="postpone-calendar-input"
            type="date"
            value={pendingDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setPendingDate(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarOpen(false)}>Annuler</Button>
          <Button variant="contained" disabled={!pendingDate} onClick={validatePostponement}>Valider</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StatusInput;
