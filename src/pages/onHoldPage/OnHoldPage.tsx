import * as React from "react";
import { useNavigate } from "react-router-dom";
import { flushSync } from "react-dom";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import HelpOutlineRounded from "@mui/icons-material/HelpOutlineRounded";
import EventRepeatRounded from "@mui/icons-material/EventRepeatRounded";
import PhoneInTalkRounded from "@mui/icons-material/PhoneInTalkRounded";

import { useAppDispatch, useAppSelector } from "../../redux/store";
import { loadInterventionFromSearch } from "../../redux/features/newInterventionSlice";
import {
  getCureDeadline,
  getOnHoldInterventions,
  getOverdueKind,
  isCureOverdue,
  type OnHoldTab,
} from "../../utils/onHoldUtils";

import "./OnHoldPage.scss";
import { usePersistentElementScroll } from "../../hooks/usePersistentScroll";
import CableCutMono from "../../assets/icons/CableCutMono.png";
import SnowStatusIcon from "../../components/snowStatusIcon/SnowStatusIcon";

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
  { value: "overdue", label: "Échéance dépassée", icon: <WarningAmberRounded /> },
  { value: "cure", label: "CURE", icon: <PhoneInTalkRounded /> },
  {
    value: "res",
    label: "Résiliation",
    icon: <CableCutIcon />,
  },
  {
    value: "snowReceived",
    label: "Snow à mon nom",
    icon: <SnowStatusIcon direction="left" className="on-hold-tab-snow-icon" />,
  },
  {
    value: "snowSent",
    label: "Snow créé",
    icon: <SnowStatusIcon direction="right" className="on-hold-tab-snow-icon" />,
  },
  {
    value: "questions",
    label: "Questions M&P",
    icon: <HelpOutlineRounded />,
  },
  { value: "other", label: "Postposé", icon: <EventRepeatRounded /> },
];
const tabOrder = tabs.map((tab) => tab.value);

const ON_HOLD_EDIT_CONTEXT_KEY = "on-hold:edit-context";
const PENDING_TAB_KEY = "on-hold:pending-tab";

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

    if (activeTab === "overdue") {
      const priority: Record<string, number> = {
        postponed: 0,
        cure: 1,
        snow: 2,
      };
      return sorted.sort(
        (first, second) =>
          priority[getOverdueKind(first)] - priority[getOverdueKind(second)] ||
          interventionOldestValue(first).localeCompare(interventionOldestValue(second)),
      );
    }

    if (activeTab === "cure") {
      const today = localDateKey();
      return sorted.sort((first, second) => {
        const infrastructureDifference =
          (infrastructureKind(first.infrastructure) === "copper" ? 0 : 1) -
          (infrastructureKind(second.infrastructure) === "copper" ? 0 : 1);

        if (infrastructureDifference !== 0) {
          return infrastructureDifference;
        }

        const firstReviewedToday = first.cureReviewedDate === today;
        const secondReviewedToday = second.cureReviewedDate === today;
        if (firstReviewedToday !== secondReviewedToday) return firstReviewedToday ? 1 : -1;

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

        const firstConsultedToday = first.resReviewedDate === today;
        const secondConsultedToday = second.resReviewedDate === today;

        if (firstConsultedToday !== secondConsultedToday) {
          return firstConsultedToday ? 1 : -1;
        }

        return interventionOldestValue(first).localeCompare(
          interventionOldestValue(second),
        );
      });
    }

    if (activeTab === "snowReceived" || activeTab === "snowSent") {
      const today = localDateKey();
      const consultedField =
        activeTab === "snowReceived"
          ? "snowReceivedReviewedDate"
          : "snowSentReviewedDate";

      return sorted.sort((first, second) => {
        const firstConsultedToday = first[consultedField] === today;
        const secondConsultedToday = second[consultedField] === today;

        if (firstConsultedToday !== secondConsultedToday) {
          return firstConsultedToday ? 1 : -1;
        }

        return interventionOldestValue(first).localeCompare(
          interventionOldestValue(second),
        );
      });
    }

    if (activeTab === "other") {
      return sorted.sort((first, second) =>
        (first.postponedDate ?? "9999-12-31").localeCompare(second.postponedDate ?? "9999-12-31"),
      );
    }

    return sorted;
  }, [activeTab, interventions]);

  const overdue =
    activeTab === "cure"
      ? sortedInterventions.filter((item) => isCureOverdue(item))
      : [];
  const current = sortedInterventions;

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

  const groupedByInfrastructure = (activeTab === "cure" || activeTab === "res" || activeTab === "snowReceived" || activeTab === "snowSent");
  const groupedCopper = groupedByInfrastructure
    ? current.filter((item) => infrastructureKind(item.infrastructure) === "copper")
    : [];
  const groupedFiber = groupedByInfrastructure
    ? current.filter((item) => infrastructureKind(item.infrastructure) === "fiber")
    : [];

  const openIntervention = (
    intervention: (typeof sortedInterventions)[number],
  ) => {
    window.sessionStorage.setItem(
      ON_HOLD_EDIT_CONTEXT_KEY,
      JSON.stringify({
        tab: activeTab,
        anchor: interventionAnchor(intervention),
        documentId: intervention.documentId,
        dateKey: intervention.dateKey ?? "",
        scrollTop: scrollContainerRef.current?.scrollTop ?? 0,
      }),
    );

    dispatch(loadInterventionFromSearch(intervention));
    navigate("/intervention-en-cours");
  };

  const getCardLabel = (
    intervention: (typeof sortedInterventions)[number],
  ) => {
    if (activeTab === "overdue") {
      const kind = getOverdueKind(intervention);
      if (kind === "postponed") return "POSTPOSÉ";
      if (kind === "cure") return "CURE";
      return "SNOW";
    }

    if (activeTab === "cure") {
      return intervention.cure === "firstCure" ? "CURE 1" : "CURE 2";
    }

    if (activeTab === "res") return "RÉSILIATION";
    if (activeTab === "snowReceived") return "SNOW À MON NOM";
    if (activeTab === "snowSent") return "SNOW CRÉÉ";
    if (activeTab === "questions") return "QUESTION M&P";

    return "POSTPOSÉ";
  };

  const getStatusIcon = () => {
    if (activeTab === "overdue") return <WarningAmberRounded />;
    if (activeTab === "cure") return <PhoneInTalkRounded />;
    if (activeTab === "res") return <CableCutIcon />;
    if (activeTab === "snowReceived") {
      return <SnowStatusIcon direction="left" className="on-hold-card-snow-icon" />;
    }
    if (activeTab === "snowSent") {
      return <SnowStatusIcon direction="right" className="on-hold-card-snow-icon" />;
    }
    if (activeTab === "questions") return <HelpOutlineRounded />;

    return <EventRepeatRounded />;
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

            {((activeTab === "res" &&
              intervention.resReviewedDate === localDateKey()) ||
              (activeTab === "snowReceived" &&
                intervention.snowReceivedReviewedDate === localDateKey()) ||
              (activeTab === "snowSent" &&
                intervention.snowSentReviewedDate === localDateKey()) ||
              (activeTab === "other" &&
                intervention.otherReviewedDate === localDateKey()) ||
              (activeTab === "cure" &&
                intervention.cureReviewedDate === localDateKey()) ||
              (activeTab === "questions" &&
                intervention.questionReviewedDate === localDateKey())) && (
              <span
                className="on-hold-card__review-stamp"
                aria-label="Revu aujourd'hui"
                title="Revu aujourd'hui"
              >
                <span>Revu</span>
                <span>aujourd&apos;hui</span>
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
          {(activeTab === "snowReceived" || activeTab === "snowSent") && (
            <span className="on-hold-card__snow-ticket">
              <strong>{activeTab === "snowReceived" ? "Snow à mon nom" : "Snow créé"}</strong>
              <span title={(activeTab === "snowReceived" ? intervention.snowReceived : intervention.snowSent) || "—"}>
                {(activeTab === "snowReceived" ? intervention.snowReceived : intervention.snowSent) || "—"}
              </span>
            </span>
          )}
          {activeTab === "other" && intervention.postponedDate && (
            <span className="on-hold-card__snow-ticket">
              <strong>Postposé au</strong>
              <span>{intervention.postponedDate.split("-").reverse().join("/")}</span>
            </span>
          )}
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

        {intervention.lastRevuAt && (
          <small className="on-hold-card__last-review">
            Dernier revu le {new Date(intervention.lastRevuAt).toLocaleDateString("fr-BE")} à{" "}
            {new Date(intervention.lastRevuAt).toLocaleTimeString("fr-BE", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </small>
        )}
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
                <span
                  className="on-hold-tab__icon"
                  aria-hidden={tab.value !== "overdue"}
                >
                  {tab.icon}
                </span>
                {tab.value !== "overdue" && <span>{tab.label}</span>}
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
        ) : groupedByInfrastructure ? (
          <div className="on-hold-res-groups">
            {groupedCopper.length > 0 && (
              <section className="on-hold-infrastructure-group">
                <h2>Cuivre</h2>
                <div className="on-hold-grid">
                  {groupedCopper.map((item) => renderCard(item, activeTab === "cure" && isCureOverdue(item)))}
                </div>
              </section>
            )}
            {groupedFiber.length > 0 && (
              <section className="on-hold-infrastructure-group">
                <h2>Fibre</h2>
                <div className="on-hold-grid">
                  {groupedFiber.map((item) => renderCard(item, activeTab === "cure" && isCureOverdue(item)))}
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
