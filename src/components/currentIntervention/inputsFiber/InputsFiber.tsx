import "./InputsFiber.scss";
import { ReactComponent as OAGIcon } from "../../../assets/svg/OAG.svg.tsx";
import { ReactComponent as IDIcon } from "../../../assets/svg/ID.svg.tsx";
import Numbers from "@mui/icons-material/Numbers";
import { House } from "lucide-react";
import { TextInitial } from "lucide-react";
import { UserRound } from "lucide-react";
import SimpleInput from "../simpleInput/SimpleInput";
const InputsFiber = () => {
  return (
    <div className="inputs-fiber">
      <SimpleInput
        field="interventionId"
        label="ID de l'intervention"
        inputType="type2"
        icon={IDIcon}
      />
      <SimpleInput
        field="oagID"
        label="OAG ID"
        inputType="type2"
        icon={OAGIcon}
      />
      <SimpleInput
        field="snowReference"
        label="Référence SNOW"
        inputType="type2"
        icon={Numbers}
      />
      <SimpleInput
        field="clientName"
        label="Nom du client"
        inputType="type2"
        icon={UserRound}
      />
      <SimpleInput
        field="interventionDescription"
        label="Description d'intervention"
        icon={TextInitial}
        inputType="type2"
      />
      <SimpleInput
        field="mainAddress"
        label="Adresse principale"
        inputType="type2"
        icon={House}
      />
    </div>
  );
};
export default InputsFiber;
