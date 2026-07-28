import * as React from "react";
import { useNavigate } from "react-router-dom";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import AcUnitRounded from "@mui/icons-material/AcUnitRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import PhoneInTalkRounded from "@mui/icons-material/PhoneInTalkRounded";

import { useAppDispatch, useAppSelector } from "../../redux/store";
import { loadInterventionFromSearch } from "../../redux/features/newInterventionSlice";
import {
  getCureDeadline,
  getOnHoldInterventions,
  isCureOverdue,
  type OnHoldTab,
} from "../../utils/onHoldUtils";

import "./OnHoldPage.scss";
import { usePersistentElementScroll } from "../../hooks/usePersistentScroll";

const DisconnectedLineIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    className="on-hold-disconnected-icon"
  >
    <path d="M2.5 9.75h4.25" />
    <path d="M17.25 14.25h4.25" />
    <path d="M6.75 7.25v5.5" />
    <path d="M17.25 11.25v5.5" />
    <path d="M6.75 8.25h2.1a3.15 3.15 0 0 1 3.15 3.15v1.2" />
    <path d="M17.25 15.75h-2.1A3.15 3.15 0 0 1 12 12.6v-1.2" />
    <path d="M9.6 8.2 14.4 15.8" />
  </svg>
);

const tabs: Array<{
  value: OnHoldTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "cure", label: "CURE", icon: <PhoneInTalkRounded /> },
  {
    value: "res",
    label: "Résiliation",
    icon: <DisconnectedLineIcon />,
  },
  {
    value: "snowReceived",
    label: "Snow reçu",
    icon: <AcUnitRounded />,
  },
  {
    value: "snowSent",
    label: "Snow envoyé",
    icon: <AcUnitRounded />,
  },
  {
    value: "questions",
    label: "Questions M&P",
    icon: <HelpOutlineRounded />,
  },
  { value: "other", label: "Autre", icon: <MoreHorizRounded /> },
];

const infrastructureLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "fiber" || normalized === "fibre") return "FIBRE";
  if (normalized === "copper" || normalized === "cuivre") return "CUIVRE";

  return value.trim().toUpperCase() || "TECHNOLOGIE";
};

const formatDeadline = (date: Date | null) =>
  date
    ? date.toLocaleDateString("fr-BE", {
        dateStyle: "short",
      })
    : "";

const OnHoldPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const history = useAppSelector((state) => state.history.interventions);
  const isRefreshing = useAppSelector((state) => state.history.isRefreshing);
  const [activeTab, setActiveTab] = React.useState<OnHoldTab>("cure");
  const scrollContainerRef = React.useRef<HTMLElement | null>(null);

  usePersistentElementScroll("on-hold", scrollContainerRef, !isRefreshing);

  const interventions = React.useMemo(
    () => getOnHoldInterventions(history, activeTab),
    [history, activeTab],
  );

  const sortedInterventions = React.useMemo(() => {
    if (activeTab !== "cure") return interventions;

    return [...interventions].sort((first, second) => {
      const firstOverdue = isCureOverdue(first);
      const secondOverdue = isCureOverdue(second);

      if (firstOverdue !== secondOverdue) {
        return firstOverdue ? -1 : 1;
      }

      return (first.curePendingSince ?? first.updatedAt ?? "").localeCompare(
        second.curePendingSince ?? second.updatedAt ?? "",
      );
    });
  }, [activeTab, interventions]);

  const overdue =
    activeTab === "cure"
      ? sortedInterventions.filter((item) => isCureOverdue(item))
      : [];
  const current =
    activeTab === "cure"
      ? sortedInterventions.filter((item) => !isCureOverdue(item))
      : sortedInterventions;

  const openIntervention = (
    intervention: (typeof sortedInterventions)[number],
  ) => {
    dispatch(loadInterventionFromSearch(intervention));
    navigate("/intervention-en-cours");
  };

  const getCardLabel = (
    intervention: (typeof sortedInterventions)[number],
  ) => {
    if (activeTab === "cure") {
      return intervention.cure === "firstCure" ? "CURE 1" : "CURE 2";
    }

    if (activeTab === "res") return "RÉSILIATION";
    if (activeTab === "snowReceived") return "SNOW REÇU";
    if (activeTab === "snowSent") return "SNOW ENVOYÉ";
    if (activeTab === "questions") return "QUESTION M&P";

    return "AUTRE";
  };

  const getStatusIcon = () => {
    if (activeTab === "cure") return <PhoneInTalkRounded />;
    if (activeTab === "res") return <DisconnectedLineIcon />;
    if (activeTab === "snowReceived" || activeTab === "snowSent") {
      return <AcUnitRounded />;
    }
    if (activeTab === "questions") return <HelpOutlineRounded />;

    return <MoreHorizRounded />;
  };

  const renderCard = (
    intervention: (typeof sortedInterventions)[number],
    overdueCard = false,
  ) => {
    const deadline = overdueCard ? getCureDeadline(intervention) : null;

    return (
      <article
        key={`${activeTab}-${intervention.documentId}-${intervention.dateKey ?? ""}`}
        role="button"
        tabIndex={0}
        className={`on-hold-card on-hold-card--${activeTab} ${
          overdueCard ? "on-hold-card--overdue" : ""
        }`}
        onClick={() => openIntervention(intervention)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openIntervention(intervention);
          }
        }}
      >
        <span className="on-hold-card__status-column">
          <span
            className={`on-hold-card__technology ${
              infrastructureLabel(intervention.infrastructure) === "FIBRE"
                ? "on-hold-card__technology--fiber"
                : "on-hold-card__technology--copper"
            }`}
          >
            {infrastructureLabel(intervention.infrastructure)}
          </span>

          <span className="on-hold-card__status">
            <span className="on-hold-card__status-main">
              {getStatusIcon()}
              <span>{getCardLabel(intervention)}</span>
            </span>

            {overdueCard && (
              <small>
                <AccessTimeRounded />
                <span>
                  <strong>Échéance dépassée</strong>
                  {deadline && <span>{formatDeadline(deadline)}</span>}
                </span>
              </small>
            )}
          </span>
        </span>

        <span className="on-hold-card__identity">
          <span>
            <strong>Intervention ID</strong>
            <span title={intervention.interventionId || "—"}>
              {intervention.interventionId || "—"}
            </span>
          </span>
          <span>
            <strong>OAG ID</strong>
            <span title={intervention.oagID || "—"}>
              {intervention.oagID || "—"}
            </span>
          </span>
        </span>

        <span className="on-hold-card__details">
          <span>
            <strong>Commentaire</strong>
            <span>{intervention.comment?.trim() || "—"}</span>
          </span>
          <span>
            <strong>Informations supplémentaires</strong>
            <span>{intervention.additionalInformation?.trim() || "—"}</span>
          </span>
        </span>

        <ArrowForwardRounded className="on-hold-card__arrow" />
      </article>
    );
  };

  return (
    <main ref={scrollContainerRef} className="on-hold-page">
      <section className="on-hold-page__header">
        <div className="on-hold-page__heading">
          <span className="on-hold-page__eyebrow">SUIVI</span>
          <h1>En attente</h1>
          <p>Interventions nécessitant un suivi.</p>
        </div>

        <div
          className="on-hold-tabs"
          role="tablist"
          aria-label="Listes en attente"
        >
          {tabs.map((tab) => {
            const count = getOnHoldInterventions(history, tab.value).length;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                className={`on-hold-tab on-hold-tab--${tab.value} ${
                  activeTab === tab.value ? "on-hold-tab--active" : ""
                }`}
                onClick={() => setActiveTab(tab.value)}
              >
                <span className="on-hold-tab__icon">{tab.icon}</span>
                <span>{tab.label}</span>
                <strong>{count}</strong>
              </button>
            );
          })}
        </div>
      </section>

      <section className="on-hold-list">
        {isRefreshing && history.length === 0 ? (
          <div className="on-hold-empty">Chargement des interventions…</div>
        ) : sortedInterventions.length === 0 ? (
          <div className="on-hold-empty">
            Aucune intervention dans cette liste.
          </div>
        ) : activeTab === "cure" ? (
          <>
            {overdue.length > 0 && (
              <div className="on-hold-group">
                <div className="on-hold-group__title on-hold-group__title--overdue">
                  <span>Échéance dépassée</span>
                  <strong>{overdue.length}</strong>
                </div>
                <div className="on-hold-grid">
                  {overdue.map((item) => renderCard(item, true))}
                </div>
              </div>
            )}

            {overdue.length > 0 && current.length > 0 && (
              <div className="on-hold-separator" aria-hidden="true" />
            )}

            {current.length > 0 && (
              <div className="on-hold-group">
                <div className="on-hold-group__title">
                  <span>Dans le délai</span>
                  <strong>{current.length}</strong>
                </div>
                <div className="on-hold-grid">
                  {current.map((item) => renderCard(item))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="on-hold-grid">
            {current.map((item) => renderCard(item))}
          </div>
        )}
      </section>
    </main>
  );
};

export default OnHoldPage;
