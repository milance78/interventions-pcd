import "./InputsAll.scss";

import AcUnitRounded from "@mui/icons-material/AcUnitRounded";
import Tooltip from "@mui/material/Tooltip";

import {
  Contact,
  KeyRound,
  PhoneCall,
  TextInitial,
} from "lucide-react";

import SimpleInput from "../simpleInput/SimpleInput";
import SnowPendingInput from "../snowPendingInput/SnowPendingInput";
import AddressMiniInput from "../addressMiniInput/AddressMiniInput";
import MainAddressInput from "../mainAddressInput/MainAddressInput";

import { ReactComponent as CIDIcon } from "../../../assets/svg/CID.svg.tsx";
import { ReactComponent as NAIcon } from "../../../assets/svg/NA.svg.tsx";
import { updateField } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";

const InputsAll = () => {
  const dispatch = useAppDispatch();
  const {
    infrastructure,
    mailbox,
    floor,
    apartment,
    blockNumber,
    snowMentioned,
    isHistoryView,
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


      <section className="inputs-row inputs-row--address-line">
        <div className={`simple-input--main-address ${
          emphasizeMainAddress ? "simple-input--emphasized" : ""
        }`}>
          <MainAddressInput />
        </div>

        <AddressMiniInput field="mailbox" label="Boîte" className={isFiber && hasMailbox ? "address-mini-input--emphasized" : ""} />
        <AddressMiniInput field="floor" label="Étage" className={isFiber && hasFloor ? "address-mini-input--emphasized" : ""} />
        <AddressMiniInput field="apartment" label="Appt." className={isFiber && hasApartment ? "address-mini-input--emphasized" : ""} />
        <AddressMiniInput field="blockNumber" label="Bloc" className={isFiber && hasBlock ? "address-mini-input--emphasized" : ""} />
      </section>

      <section className="inputs-row inputs-row--snow">
        <div className="simple-input snow-inputs-group">
          <div className="icon-container" aria-hidden="true">
            <AcUnitRounded />
          </div>

          <div className="snow-inputs-group__fields">
            <SimpleInput
              field="snowMentioned"
              label="Snow mentionné"
              inputType="type2"
            />

            <Tooltip title="Assigner à mon nom" placement="top" arrow>
              <span className="snow-assign-button__wrapper">
                <button
                  type="button"
                  className="snow-assign-button"
                  disabled={isHistoryView || !snowMentioned.trim()}
                  onClick={() => {
                    dispatch(
                      updateField({
                        field: "snowReceived",
                        value: snowMentioned,
                      }),
                    );
                    dispatch(
                      updateField({
                        field: "snowMentioned",
                        value: "",
                      }),
                    );
                  }}
                  aria-label="Assigner Snow mentionné à mon nom"
                >
                  <span className="snow-assign-button__bars" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="snow-assign-button__arrow" aria-hidden="true" />
                </button>
              </span>
            </Tooltip>

            <SnowPendingInput
              field="snowReceived"
              pendingField="isSnowReceivedPending"
              label="Snow à mon nom"
              pendingLabel="Snow à mon nom en attente"
            />

            <SnowPendingInput
              field="snowSent"
              pendingField="isSnowSentPending"
              label="Snow créé"
              pendingLabel="Snow créé en attente"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default InputsAll;
