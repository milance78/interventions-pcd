import * as React from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
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
import CableCutMono from "../../assets/icons/CableCutMono.png";

const CableCutIcon = () => (
  <img
    src={CableCutMono}
    alt=""
    aria-hidden="true"
    className="on-hold-cable-cut-icon"
  />
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
    icon: <CableCutIcon />,
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
const tabOrder = tabs.map((tab) => tab.value);

const RES_EDIT_CONTEXT_KEY = "on-hold:res-edit-context";
const PENDING_TAB_KEY = "on-hold:pending-tab";
const PENDING_ANCHOR_KEY = "on-hold:pending-anchor";

const localDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const interventionAnchor = (intervention: {
  documentId: string;
  dateKey?: string;
}) => `${intervention.dateKey ?? ""}::${intervention.documentId}`;

const infrastructureKind = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === "fiber" || normalized === "fibre"
    ? "fiber"
    : "copper";
};

const interventionOldestValue = (intervention: {
  curePendingSince?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  dateKey?: string;
}) =>
  intervention.curePendingSince ??
  intervention.createdAt ??
  intervention.updatedAt ??
  (intervention.dateKey ? `${intervention.dateKey}T00:00:00` : "");

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

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
  const [activeTab, setActiveTab] = React.useState<OnHoldTab>(() => {
    try {
      const pending = window.sessionStorage.getItem(PENDING_TAB_KEY);
      return tabOrder.includes(pending as OnHoldTab)
        ? (pending as OnHoldTab)
        : "cure";
    } catch {
      return "cure";
    }
  });
  const scrollContainerRef = React.useRef<HTMLElement | null>(null);

  const changeTab = React.useCallback(
    (nextTab: OnHoldTab) => {
      if (nextTab === activeTab) return;

      const currentIndex = tabOrder.indexOf(activeTab);
      const nextIndex = tabOrder.indexOf(nextTab);
      const direction = nextIndex > currentIndex ? "next" : "previous";
      const transitionDocument = document as ViewTransitionDocument;

      if (!transitionDocument.startViewTransition) {
        setActiveTab(nextTab);
        return;
      }

      document.documentElement.dataset.onHoldSlideDirection = direction;

      const transition = transitionDocument.startViewTransition(() => {
        flushSync(() => setActiveTab(nextTab));
      });

      void transition.finished.finally(() => {
        delete document.documentElement.dataset.onHoldSlideDirection;
      });
    },
    [activeTab],
  );

  usePersistentElementScroll("on-hold", scrollContainerRef, !isRefreshing);

  React.useEffect(() => {
    window.sessionStorage.removeItem(PENDING_TAB_KEY);
  }, []);

  const interventions = React.useMemo(
    () => getOnHoldInterventions(history, activeTab),
    [history, activeTab],
  );

  const sortedInterventions = React.useMemo(() => {
    const sorted = [...interventions];

    if (activeTab === "cure") {
      return sorted.sort((first, second) => {
        const infrastructureDifference =
          (infrastructureKind(first.infrastructure) === "copper" ? 0 : 1) -
          (infrastructureKind(second.infrastructure) === "copper" ? 0 : 1);

        if (infrastructureDifference !== 0) {
          return infrastructureDifference;
        }

        return interventionOldestValue(first).localeCompare(
          interventionOldestValue(second),
        );
      });
    }

    if (activeTab === "res") {
      const today = localDateKey();

      return sorted.sort((first, second) => {
        const infrastructureDifference =
          (infrastructureKind(first.infrastructure) === "copper" ? 0 : 1) -
          (infrastructureKind(second.infrastructure) === "copper" ? 0 : 1);

        if (infrastructureDifference !== 0) {
          return infrastructureDifference;
        }

        const firstConsultedToday = first.resConsultedDate === today;
        const secondConsultedToday = second.resConsultedDate === today;

        if (firstConsultedToday !== secondConsultedToday) {
          return firstConsultedToday ? 1 : -1;
        }

        return interventionOldestValue(first).localeCompare(
          interventionOldestValue(second),
        );
      });
    }

    return sorted;
  }, [activeTab, interventions]);

  const overdue =
    activeTab === "cure"
      ? sortedInterventions.filter((item) => isCureOverdue(item))
      : [];
  const current =
    activeTab === "cure"
      ? sortedInterventions.filter((item) => !isCureOverdue(item))
      : sortedInterventions;

  const resCopper =
    activeTab === "res"
      ? current.filter(
          (item) => infrastructureKind(item.infrastructure) === "copper",
        )
      : [];
  const resFiber =
    activeTab === "res"
      ? current.filter(
          (item) => infrastructureKind(item.infrastructure) === "fiber",
        )
      : [];

  const openIntervention = (
    intervention: (typeof sortedInterventions)[number],
  ) => {
    if (activeTab === "res") {
      window.sessionStorage.setItem(
        RES_EDIT_CONTEXT_KEY,
        JSON.stringify({
          anchor: interventionAnchor(intervention),
          documentId: intervention.documentId,
          dateKey: intervention.dateKey ?? "",
        }),
      );
    } else {
      window.sessionStorage.removeItem(RES_EDIT_CONTEXT_KEY);
    }

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
    if (activeTab === "res") return <CableCutIcon />;
    if (activeTab === "snowReceived" || activeTab === "snowSent") {
      return <AcUnitRounded />;
    }
    if (activeTab === "questions") return <HelpOutlineRounded />;

    return <MoreHorizRounded />;
  };

  React.useEffect(() => {
    if (isRefreshing || activeTab !== "res") return;

    const pendingAnchor = window.sessionStorage.getItem(PENDING_ANCHOR_KEY);
    if (!pendingAnchor) return;

    const frame = window.requestAnimationFrame(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-on-hold-anchor]"),
      ).find((element) => element.dataset.onHoldAnchor === pendingAnchor);

      target?.scrollIntoView({
        behavior: "auto",
        block: "center",
      });

      window.sessionStorage.removeItem(PENDING_TAB_KEY);
      window.sessionStorage.removeItem(PENDING_ANCHOR_KEY);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, isRefreshing, current.length]);

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
        data-on-hold-anchor={interventionAnchor(intervention)}
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

            {activeTab === "res" &&
              intervention.resConsultedDate === localDateKey() && (
                <span className="on-hold-card__consulted-today">
                  Consulté aujourd&apos;hui
                </span>
              )}

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
                onClick={() => changeTab(tab.value)}
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
        ) : activeTab === "res" ? (
          <div className="on-hold-res-groups">
            {resCopper.length > 0 && (
              <section className="on-hold-infrastructure-group">
                <h2>Cuivre</h2>
                <div className="on-hold-grid">
                  {resCopper.map((item) => renderCard(item))}
                </div>
              </section>
            )}

            {resFiber.length > 0 && (
              <section className="on-hold-infrastructure-group">
                <h2>Fibre</h2>
                <div className="on-hold-grid">
                  {resFiber.map((item) => renderCard(item))}
                </div>
              </section>
            )}
          </div>
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
