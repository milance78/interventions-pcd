import "./ArrowToggle.scss";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import IconButton from "@mui/material/IconButton";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { updateField } from "../../../redux/features/newInterventionSlice";
const ArrowToggle = () => {
  const dispatch = useAppDispatch();
  const { displayAllFields } = useAppSelector((state) => state.newIntervention);
  return (
    <IconButton
      onClick={() =>
        dispatch(
          updateField({
            field: "displayAllFields",
            value: !displayAllFields,
          }),
        )
      }
      sx={{
        border: "1px solid #ccc",
        borderRadius: 2,
      }}
    >
      {displayAllFields ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
    </IconButton>
  );
};
export default ArrowToggle;
