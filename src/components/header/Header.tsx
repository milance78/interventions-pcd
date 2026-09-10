import * as React from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import GridOnRounded from "@mui/icons-material/GridOnRounded";
import DashboardCustomizeRounded from "@mui/icons-material/DashboardCustomizeRounded";
import Button from "@mui/material/Button";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import { NavLink, useNavigate } from "react-router-dom";

import ProfileMenu from "../profileMenu/ProfileMenu";
import InterventionSearch from "./interventionSearch/InterventionSearch";
import {
  resumeDraft,
  startNewIntervention,
  isSameInterventionData,
} from "../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { getOnHoldInterventions } from "../../utils/onHoldUtils";

import "./Header.scss";

const SMART_IMPORT_AUTO_OPEN_KEY = "smart-import:auto-open";

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [now, setNow] = React.useState(new Date());
  const newIntervention = useAppSelector((state) => state.newIntervention);
  const { hasDraft } = newIntervention;
  const isDisplayedDraft = Boolean(
    hasDraft &&
      newIntervention.draftSnapshot &&
      isSameInterventionData(newIntervention, newIntervention.draftSnapshot),
  );
  const hasDisplacedDraft = hasDraft && !isDisplayedDraft;
  const historyInterventions = useAppSelector(
    (state) => state.history.interventions,
  );
  const overdueCount = React.useMemo(
    () => getOnHoldInterventions(historyInterventions, "overdue").length,
    [historyInterventions, now],
  );

  const [spreadsheetMode, setSpreadsheetMode] = React.useState(() =>
    window.localStorage.getItem("interventions-pcd-display-mode") === "spreadsheet",
  );

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    document.body.classList.toggle("spreadsheet-mode", spreadsheetMode);
    window.localStorage.setItem(
      "interventions-pcd-display-mode",
      spreadsheetMode ? "spreadsheet" : "normal",
    );

    return () => document.body.classList.remove("spreadsheet-mode");
  }, [spreadsheetMode]);

  const toggleSpreadsheetMode = () => {
    setSpreadsheetMode((current) => !current);
  };

  const openCurrentPage = (autoOpenSmartImport = false) => {
    window.sessionStorage.removeItem(SMART_IMPORT_AUTO_OPEN_KEY);
    navigate("/intervention-en-cours", {
      state: autoOpenSmartImport ? { autoOpenSmartImport: true } : undefined,
    });
  };

  const handleNewIntervention = () => {
    dispatch(startNewIntervention());
    openCurrentPage(true);
  };

  const handleResumeDraft = () => {
    dispatch(resumeDraft());
    openCurrentPage(false);
  };

  const handleCurrentInterventionClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!hasDisplacedDraft) return;

    event.preventDefault();
    dispatch(resumeDraft());
    navigate("/intervention-en-cours");
  };

  const date = now.toLocaleDateString("fr-BE");
  const time = now.toLocaleTimeString("fr-BE");

  return (
    <header className="header">
      <div className="header__datetime">
        <div className="header__date">{date}</div>
        <div className="header__time">{time}</div>
      </div>

      <nav className="header__navigation">
        <NavLink
          to="/intervention-en-cours"
          onClick={handleCurrentInterventionClick}
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Intervention en cours
        </NavLink>

        <NavLink
          to="/en-attente"
          className={({ isActive }) =>
            `header__link header__link--on-hold ${
              isActive ? "header__link--active" : ""
            }`
          }
        >
          <span>En attente</span>
          {overdueCount > 0 && (
            <span
              className="header__on-hold-notification"
              aria-label={`${overdueCount} ticket${overdueCount > 1 ? "s" : ""} avec échéance dépassée`}
              title={`${overdueCount} ticket${overdueCount > 1 ? "s" : ""} avec échéance dépassée`}
            >
              <strong>{overdueCount}</strong>
            </span>
          )}
        </NavLink>

        <NavLink
          to="/liste-du-jour"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Liste du jour
        </NavLink>

        <NavLink
          to="/historique"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Historique
        </NavLink>

        <NavLink
          to="/statistiques"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Statistiques
        </NavLink>

        <NavLink
          to="/modeles"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Modèles
        </NavLink>
      </nav>

      <div className="header__right">
        <button
          type="button"
          className="header__display-mode-toggle"
          onClick={toggleSpreadsheetMode}
          aria-pressed={spreadsheetMode}
          aria-label={
            spreadsheetMode
              ? "Revenir à l’affichage normal"
              : "Afficher le mode feuille de calcul"
          }
          title={
            spreadsheetMode
              ? "Affichage normal"
              : "Mode feuille de calcul"
          }
        >
          {spreadsheetMode ? (
            <DashboardCustomizeRounded aria-hidden="true" />
          ) : (
            <GridOnRounded aria-hidden="true" />
          )}
          <span>{spreadsheetMode ? "Normal" : "XLS"}</span>
        </button>

        {hasDisplacedDraft && (
          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<HistoryRounded />}
            className="header__draft-button"
            onClick={handleResumeDraft}
          >
            Brouillon
          </Button>
        )}

        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<AddRounded />}
          className="header__new-intervention"
          onClick={handleNewIntervention}
        >
          Nouvelle intervention
        </Button>

        <InterventionSearch />
        <ProfileMenu />
      </div>


    </header>
  );
};

export default Header;
