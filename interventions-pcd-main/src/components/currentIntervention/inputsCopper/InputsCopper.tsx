import * as React from "react";
import "./InputsCopper.scss";
import SimpleInput from "../simpleInput/SimpleInput";
import { ReactComponent as NAIcon } from "../../../assets/svg/NA.svg.tsx";
import { ReactComponent as IDIcon } from "../../../assets/svg/ID.svg.tsx";
import Numbers from "@mui/icons-material/Numbers";
import { TextInitial } from "lucide-react";
import { UserRound } from "lucide-react";
import { KeyRound } from "lucide-react";
const InputsCopper = () => {
  return (
    <div className="inputs-copper">
      <SimpleInput
        field="interventionId"
        label="ID de l'intervention"
        inputType="type2"
        icon={IDIcon}
      />
      <SimpleInput field="na" label="NA" inputType="type2" icon={NAIcon} />
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
        inputType="type2"
        icon={TextInitial}
      />
      <SimpleInput
        field="LOMKey"
        label="LOM key"
        inputType="type2"
        icon={KeyRound}
      />
    </div>
  );
};
export default InputsCopper;
