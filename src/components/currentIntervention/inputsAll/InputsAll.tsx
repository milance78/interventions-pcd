import "./InputsAll.scss";

import AcUnitRounded from "@mui/icons-material/AcUnitRounded";

import {
  Contact,
  House,
  KeyRound,
  PhoneCall,
  TextInitial,
} from "lucide-react";

import SimpleInput from "../simpleInput/SimpleInput";
import SnowPendingInput from "../snowPendingInput/SnowPendingInput";
import AddressMiniInput from "../addressMiniInput/AddressMiniInput";

import { ReactComponent as CIDIcon } from "../../../assets/svg/CID.svg.tsx";
import { ReactComponent as NAIcon } from "../../../assets/svg/NA.svg.tsx";
import { useAppSelector } from "../../../redux/store";

const InputsAll = () => {
  const {
    infrastructure,
    mailbox,
    floor,
    apartment,
    blockNumber,
  } = useAppSelector((state) => state.newIntervention);

  const hasMailbox = mailbox.trim().length > 0;
  const hasFloor = floor.trim().length > 0;
  const hasApartment = apartment.trim().length > 0;
  const hasBlock = blockNumber.trim().length > 0;
  const hasAnyAddressDetail =
    hasMailbox || hasFloor || hasApartment || hasBlock;

  const normalizedInfrastructure = infrastructure.trim().toLowerCase();
  const isCopper =
    normalizedInfrastructure === "copper" ||
    normalizedInfrastructure === "cuivre";
  const isFiber =
    normalizedInfrastructure === "fiber" ||
    normalizedInfrastructure === "fibre";

  const emphasizeSnAndLom = isCopper && !hasAnyAddressDetail;
  const emphasizeMainAddress =
    isFiber || (isCopper && hasAnyAddressDetail);

  return (
    <div className="inputs-all">
      <section className="inputs-row inputs-row--snow">
        <div className="simple-input snow-inputs-group">
          <div className="icon-container" aria-hidden="true">
            <AcUnitRounded />
          </div>

          <div className="snow-inputs-group__fields">
            <SnowPendingInput
              field="snowReceived"
              pendingField="isSnowReceivedPending"
              label="Snow reçu"
              pendingLabel="Snow reçu en attente"
            />

            <SnowPendingInput
              field="snowSent"
              pendingField="isSnowSentPending"
              label="Snow envoyé"
              pendingLabel="Snow envoyé en attente"
            />

            <SimpleInput
              field="snowMentioned"
              label="Snow mentionné"
              inputType="type2"
            />
          </div>
        </div>
      </section>

      <section className="inputs-row inputs-row--full">
        <SimpleInput
          field="clientID"
          label="ID client"
          inputType="type2"
          icon={Contact}
        />
      </section>

      <section className="inputs-row inputs-row--full">
        <SimpleInput
          field="interventionDescription"
          label="Description d'intervention"
          inputType="type2"
          icon={TextInitial}
        />
      </section>

      <section className="inputs-row inputs-row--half">
        <SimpleInput
          field="na"
          label="NA"
          inputType="type2"
          icon={NAIcon}
          className={
            isCopper
              ? "simple-input--emphasized"
              : ""
          }
        />

        <SimpleInput
          field="cid"
          label="CID"
          inputType="type2"
          icon={CIDIcon}
        />
      </section>

      <section className="inputs-row inputs-row--structured-address">
        <SimpleInput field="streetName" label="Rue" inputType="type2" icon={House} className="simple-input--street-name" />
        <AddressMiniInput field="streetNumber" label="Nº" />
        <AddressMiniInput field="streetAlpha" label="Alpha" />
        <AddressMiniInput field="postalCode" label="Code postal" />
        <AddressMiniInput field="city" label="Ville" />
      </section>

      <section className="inputs-row inputs-row--address-line">
        <SimpleInput
          field="mainAddress"
          label="Adresse principale"
          inputType="type2"
          icon={House}
          readOnly
          className={`simple-input--main-address ${
            emphasizeMainAddress
              ? "simple-input--emphasized"
              : ""
          }`}
        />

        <AddressMiniInput field="mailbox" label="Boîte" className={isFiber && hasMailbox ? "address-mini-input--emphasized" : ""} />
        <AddressMiniInput field="floor" label="Étage" className={isFiber && hasFloor ? "address-mini-input--emphasized" : ""} />
        <AddressMiniInput field="apartment" label="Appt." className={isFiber && hasApartment ? "address-mini-input--emphasized" : ""} />
        <AddressMiniInput field="blockNumber" label="Bloc" className={isFiber && hasBlock ? "address-mini-input--emphasized" : ""} />
      </section>

      <section className="inputs-row inputs-row--lom-phone">
        <SimpleInput
          field="LOMKey"
          label="LOM key"
          inputType="type2"
          icon={KeyRound}
          className={`simple-input--lom-key ${
            emphasizeSnAndLom
              ? "simple-input--emphasized"
              : ""
          }`}
        />

        <SimpleInput
          field="phone"
          label="Nº de téléphone (GSM)"
          inputType="type2"
          icon={PhoneCall}
          className="simple-input--phone"
        />
      </section>
    </div>
  );
};

export default InputsAll;
