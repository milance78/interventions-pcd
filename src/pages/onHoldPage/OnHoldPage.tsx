import * as React from "react";
import { useNavigate } from "react-router-dom";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";

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

const tabs: Array<{
  value: OnHoldTab;
  label: string;
}> = [
  { value: "cure", label: "CURE en attente" },
  { value: "snowSent", label: "Snow envoyé en attente" },
  { value: "snowReceived", label: "Snow reçu en attente" },
  { value: "res", label: "Résiliation en attente" },
];

const infrastructureLabel = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "fiber" || normalized === "fibre") return "FIBRE";
  if (normalized === "copper" || normalized === "cuivre") return "CUIVRE";

  return value.trim().toUpperCase() || "TECHNOLOGIE";
};

const formatDeadline = (date: Date | null) =>
  date
    ? date.toLocaleString("fr-BE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

const OnHoldPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const history = useAppSelector((state) => state.history.interventions);
  const isRefreshing = useAppSelector((state) => state.history.isRefreshing);
  const [activeTab, setActiveTab] = React.useState<OnHoldTab>("cure");
  const scrollContainerRef = React.useRef<HTMLElement | null>(null);

  usePersistentElementScroll(
    "on-hold",
    scrollContainerRef,
    !isRefreshing,
  );

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

      return (
        (first.curePendingSince ?? first.updatedAt ?? "").localeCompare(
          second.curePendingSince ?? second.updatedAt ?? "",
        )
      );
    });
  }, [activeTab, interventions]);

  const overdue = activeTab === "cure"
    ? sortedInterventions.filter((item) => isCureOverdue(item))
    : [];
  const current = activeTab === "cure"
    ? sortedInterventions.filter((item) => !isCureOverdue(item))
    : sortedInterventions;

  const openIntervention = (intervention: (typeof sortedInterventions)[number]) => {
    dispatch(loadInterventionFromSearch(intervention));
    navigate("/intervention-en-cours");
  };

  const renderCard = (
    intervention: (typeof sortedInterventions)[number],
    overdueCard = false,
  ) => {
    const label =
      activeTab === "cure"
        ? intervention.cure === "firstCure"
          ? "CURE 1"
          : "CURE 2"
        : activeTab === "snowSent"
          ? "SNOW ENVOYÉ"
          : activeTab === "snowReceived"
            ? "SNOW REÇU"
            : "RÉSILIATION";

    return (
      <button
        key={`${activeTab}-${intervention.documentId}-${intervention.dateKey ?? ""}`}
        type="button"
        className={`on-hold-card ${
          overdueCard ? "on-hold-card--overdue" : ""
        }`}
        onClick={() => openIntervention(intervention)}
      >
        <span className="on-hold-card__technology">
          {infrastructureLabel(intervention.infrastructure)}
        </span>

        <span className="on-hold-card__identity">
          <span>
            <strong>Intervention ID</strong>
            <span>{intervention.interventionId || "—"}</span>
          </span>
          <span>
            <strong>OAG ID</strong>
            <span>{intervention.oagID || "—"}</span>
          </span>
        </span>

        <span className="on-hold-card__status">
          {label}
          {overdueCard && (
            <small>
              <AccessTimeRounded />
              Échéance dépassée
              {getCureDeadline(intervention)
                ? ` · ${formatDeadline(getCureDeadline(intervention))}`
                : ""}
            </small>
          )}
        </span>

        <span className="on-hold-card__details">
          <span>
            <strong>Commentaire</strong>
            <span>{intervention.comment?.trim() || "—"}</span>
          </span>
          <span>
            <strong>Informations supplémentaires</strong>
            <span>
              {intervention.additionalInformation?.trim() || "—"}
            </span>
          </span>
        </span>

        <ArrowForwardRounded className="on-hold-card__arrow" />
      </button>
    );
  };

  return (
    <main ref={scrollContainerRef} className="on-hold-page">
      <section className="on-hold-page__header">
        <div>
          <span className="on-hold-page__eyebrow">SUIVI</span>
          <h1>En attente</h1>
          <p>
            Interventions nécessitant un suivi CURE, SNOW ou résiliation.
          </p>
        </div>
      </section>

      <div className="on-hold-tabs" role="tablist" aria-label="Listes en attente">
        {tabs.map((tab) => {
          const count = getOnHoldInterventions(history, tab.value).length;

          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              className={`on-hold-tab ${
                activeTab === tab.value ? "on-hold-tab--active" : ""
              }`}
              onClick={() => setActiveTab(tab.value)}
            >
              <span>{tab.label}</span>
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>

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
