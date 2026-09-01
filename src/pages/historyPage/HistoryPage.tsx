import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import Numbers from "@mui/icons-material/Numbers";
import CheckRounded from "@mui/icons-material/CheckRounded";
import Tooltip from "@mui/material/Tooltip";
import {
  CalendarDays,
  FileSpreadsheet,
  Contact,
  House,
  KeyRound,
  NotebookTabs,
  Pencil,
  PhoneCall,
  TextInitial,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import "./HistoryPage.scss";

import AdditionalInformationDialog from "../../components/additionalInformationDialog/AdditionalInformationDialog";
import CommentCopyActions from "../../components/commentCopyActions/CommentCopyActions";
import ConfirmDeleteDialog from "../../components/confirmDeleteDialog/ConfirmDeleteDialog";

import { ReactComponent as AddressConfirmedIcon } from "../../assets/svg/Address confirmed.svg.tsx";
import { ReactComponent as AddressNotConfirmedIcon } from "../../assets/svg/Address not confirmed.svg.tsx";
import { ReactComponent as IDIcon } from "../../assets/svg/ID.svg.tsx";
import { ReactComponent as LightBulbOnIcon } from "../../assets/svg/Light bulb on.svg.tsx";
import { ReactComponent as SnowSentPendingIcon } from "../../assets/svg/Snow sent pending.svg.tsx";
import { ReactComponent as SnowReceivedPendingIcon } from "../../assets/svg/Snow received pending.svg.tsx";
import LetterBadge from "../../components/letterBadge/LetterBadge";
import SnowStatusIcon from "../../components/snowStatusIcon/SnowStatusIcon";
import VoiceMessageCall1 from "../../assets/icons/VoiceMessageCall1.png";
import VoiceMessageCall2 from "../../assets/icons/VoiceMessageCall2.png";
import QuestionActionOn from "../../assets/icons/QuestionActionOn.png";
import CableCutOn from "../../assets/icons/CableCutOn.png";

import { loadInterventionFromHistory } from "../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { deleteInterventionThunk } from "../../redux/thunks/deleteInterventionThunk";
import type { Intervention } from "../../redux/features/newInterventionSlice";
import { buildHistoryViewModel } from "../../utils/historyViewModel";
import { writeTextToClipboard } from "../../utils/clipboard";
import { exportInterventionsToExcel } from "../../utils/excelExport";

const hasValue = (value?: string | null): value is string =>
  Boolean(value?.trim());

const displayInfrastructure = (value: string) => {
  if (value === "copper") return "cuivre";
  if (value === "fiber") return "fibre";

  return value;
};

const displayNetwork = (value: string) => {
  if (value === "otherOlo") return "autre OLO";
  if (value === "mobileVikings") return "Mobile Vikings";

  return value;
};

const displayStatus = (value: string) => {
  const labels: Record<string, string> = {
    "on hold": "en attente",
    completed: "terminé",
    transferred: "transmis",
    postponed: "postposé",
    "consult M&P": "voir avec M&P",
    "closed by another agent": "fermé par un autre agent",
  };

  return labels[value] ?? value;
};

const getStatusClass = (status: string) =>
  status.replace(/\s+/g, "-").replace(/&/g, "").toLowerCase();

const BooleanIcon = ({ children }: { children: ReactNode }) => (
  <div className="history-boolean-icon">{children}</div>
);

type IconValueProps = {
  value: string;
  icon: ElementType;
  large?: boolean;
};

const IconValue = ({ value, icon: Icon, large = false }: IconValueProps) => {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
  }, []);

  const copyValue = async () => {
    await writeTextToClipboard(value);
    setCopied(true);

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, 1200);
  };

  return (
    <Tooltip title={copied ? "Copié" : "Copier"} placement="left" arrow>
      <div
      className={`history-icon-field history-icon-field--copyable ${copied ? "is-copied" : ""}`}
      role="button"
      tabIndex={0}
      onClick={copyValue}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          copyValue();
        }
      }}
    >
      <div
        className={`history-field-icon-box ${
          large ? "history-large-icon" : ""
        }`}
      >
        {copied ? <CheckRounded className="history-copy-check" /> : <Icon />}
      </div>

      <span className="history-field-value">{value}</span>
      </div>
    </Tooltip>
  );
};

const StackedField = ({
  label,
  value,
  compact = false,
}: {
  label: string;
  value?: string;
  compact?: boolean;
}) => (
  <div
    className={`history-stacked-field ${
      compact ? "history-stacked-field-compact" : ""
    }`}
  >
    <div className="history-stacked-label">{label}</div>

    <div className="history-stacked-value">
      {compact ? <strong>{value || "-"}</strong> : value || "-"}
      {!compact && label === "Commentaire" && (
        <CommentCopyActions value={value ?? ""} compact />
      )}
    </div>
  </div>
);

const convertToDate = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const parsedLocalDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );

      return Number.isNaN(parsedLocalDate.getTime())
        ? null
        : parsedLocalDate;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value === "number") {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value === "object") {
    const possibleTimestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof possibleTimestamp.toDate === "function") {
      const timestampDate = possibleTimestamp.toDate();

      return Number.isNaN(timestampDate.getTime())
        ? null
        : timestampDate;
    }

    const seconds =
      possibleTimestamp.seconds ?? possibleTimestamp._seconds;

    if (typeof seconds === "number") {
      return new Date(seconds * 1000);
    }
  }

  return null;
};

const getInterventionDate = (intervention: unknown): Date | null => {
  const interventionRecord = intervention as Record<string, unknown>;

  const possibleDates = [
    interventionRecord.dateKey,
    interventionRecord.createdAt,
    interventionRecord.interventionDate,
    interventionRecord.date,
    interventionRecord.updatedAt,
    interventionRecord.timestamp,
  ];

  for (const possibleDate of possibleDates) {
    const convertedDate = convertToDate(possibleDate);

    if (convertedDate) {
      return convertedDate;
    }
  }

  return null;
};

const getActivityDate = (intervention: unknown): Date | null => {
  const interventionRecord = intervention as Record<string, unknown>;

  const possibleDates = [
    interventionRecord.updatedAt,
    interventionRecord.createdAt,
    interventionRecord.timestamp,
    interventionRecord.interventionDate,
    interventionRecord.date,
    interventionRecord.dateKey,
  ];

  for (const possibleDate of possibleDates) {
    const convertedDate = convertToDate(possibleDate);

    if (convertedDate) return convertedDate;
  }

  return null;
};

const getDateKey = (date: Date | null) => {
  if (!date) return "unknown-date";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDateTitle = (date: Date | null) => {
  if (!date) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatSidebarDate = (date: Date | null) => {
  if (!date) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const formatMonthTitle = (date: Date | null) => {
  if (!date) return "Sans date";

  return new Intl.DateTimeFormat("fr-BE", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const capitalizeFirstLetter = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1);



type SidebarMonth = {
  key: string;
  title: string;
  dates: ReturnType<typeof buildHistoryViewModel>["navigationGroups"];
};

type HistoryNavigationProps = {
  months: SidebarMonth[];
  onSelectDate: (dateKey: string) => void;
};

const HistoryNavigation = memo(({
  months,
  onSelectDate,
}: HistoryNavigationProps) => {
  const [openMonthKey, setOpenMonthKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"dates" | "calendar">("dates");
  const [calendarValue, setCalendarValue] = useState("");
  const navigationRef = useRef<HTMLElement | null>(null);

  // The sidebar is intentionally newest-first: newest month at the top and
  // newest date first inside each month.
  const newestFirstMonths = useMemo(
    () =>
      [...months]
        .map((month) => ({
          ...month,
          dates: [...month.dates].sort((a, b) => {
            const aTime = a.date?.getTime() ?? -Infinity;
            const bTime = b.date?.getTime() ?? -Infinity;
            return bTime - aTime;
          }),
        }))
        .sort((a, b) => {
          const aTime = a.dates[0]?.date?.getTime() ?? -Infinity;
          const bTime = b.dates[0]?.date?.getTime() ?? -Infinity;
          return bTime - aTime;
        }),
    [months],
  );

  useEffect(() => {
    if (newestFirstMonths.length === 0) {
      setOpenMonthKey(null);
      return;
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
    const preferredMonth = newestFirstMonths.some(
      (month) => month.key === currentMonthKey,
    )
      ? currentMonthKey
      : newestFirstMonths[0].key;

    setOpenMonthKey((current) =>
      current && newestFirstMonths.some((month) => month.key === current)
        ? current
        : preferredMonth,
    );
  }, [newestFirstMonths]);

  const availableDateKeys = useMemo(
    () => new Set(
      newestFirstMonths.flatMap((month) => month.dates.map((group) => group.key)),
    ),
    [newestFirstMonths],
  );

  useEffect(() => {
    if (!calendarValue && newestFirstMonths[0]?.dates[0]?.key) {
      setCalendarValue(newestFirstMonths[0].dates[0].key);
    }
  }, [calendarValue, newestFirstMonths]);

  const handleCalendarChange = (value: string) => {
    if (!value) {
      setCalendarValue("");
      return;
    }

    if (availableDateKeys.has(value)) {
      setCalendarValue(value);
      onSelectDate(value);
      return;
    }

    // Never leave the calendar showing a date that is not actually open
    // in the history content. Revert immediately to the last valid date.
    setCalendarValue((current) => current);
  };

  return (
    <aside className="history-sidebar">
      <div className="history-sidebar-inner">
        <div className="history-sidebar-heading">
          <div className="history-sidebar-heading__text">
            <span>Navigation</span>
            <h2>Dates</h2>
          </div>

          <button
            type="button"
            className="history-sidebar-view-toggle"
            onClick={() => setViewMode((current) => current === "dates" ? "calendar" : "dates")}
            aria-label={viewMode === "dates" ? "Choisir une date au calendrier" : "Afficher la liste des dates"}
            title={viewMode === "dates" ? "Choisir une date au calendrier" : "Afficher la liste des dates"}
          >
            {viewMode === "dates" ? <CalendarDays size={18} /> : <NotebookTabs size={18} />}
          </button>
        </div>

        {viewMode === "calendar" ? (
          <div className="history-sidebar-calendar">
            <label htmlFor="history-sidebar-calendar-display">Choisir une date</label>

            <div className="history-sidebar-calendar-picker">
              <input
                id="history-sidebar-calendar-display"
                type="text"
                inputMode="numeric"
                placeholder="dd/mm/yyyy"
                value={calendarValue ? calendarValue.split("-").reverse().join("/") : ""}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                  let formatted = digits;
                  if (digits.length > 4) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                  } else if (digits.length > 2) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  }
                  if (formatted.length === 10) {
                    const [day, month, year] = formatted.split("/");
                    const iso = `${year}-${month}-${day}`;
                    setCalendarValue(iso);
                    if (availableDateKeys.has(iso)) onSelectDate(iso);
                  } else {
                    setCalendarValue("");
                  }
                }}
              />

              <button
                type="button"
                className="history-sidebar-calendar-button"
                aria-label="Ouvrir le calendrier"
                title="Ouvrir le calendrier"
              >
                <CalendarDays size={18} />
                <input
                  type="date"
                  aria-label="Calendrier"
                  value={calendarValue}
                  onChange={(event) => handleCalendarChange(event.target.value)}
                />
              </button>
            </div>

            <p>
              Format : dd/mm/yyyy. La sélection ouvre directement la date correspondante
              dans l&apos;historique.
            </p>
          </div>
        ) : (
          <nav ref={navigationRef} className="history-date-navigation" aria-label="Navigation par date">
            {newestFirstMonths.map((month) => {
              const isOpen = openMonthKey === month.key;

              return (
                <div
                  key={month.key}
                  className={`history-sidebar-month ${isOpen ? "is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="history-sidebar-month-toggle"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenMonthKey((current) =>
                        current === month.key ? null : month.key,
                      )
                    }
                  >
                    <span>{month.title}</span>
                    <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>

                  <div
                    className="history-sidebar-dates-shell"
                    aria-hidden={!isOpen}
                  >
                    <div className="history-sidebar-dates">
                      {month.dates.map((group) => (
                        <button
                          key={group.key}
                          type="button"
                          tabIndex={isOpen ? 0 : -1}
                          onClick={() => {
                            setCalendarValue(group.key);
                            onSelectDate(group.key);
                          }}
                        >
                          <span>
                            {capitalizeFirstLetter(formatSidebarDate(group.date))}
                          </span>
                          <strong>{group.interventions.length}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        )}
      </div>
    </aside>
  );
}, (previous, next) => previous.months === next.months);

HistoryNavigation.displayName = "HistoryNavigation";

const getInitialRenderedHistoryGroupCount = () => 1;

const HistoryPage = () => {
  const [deleteTarget, setDeleteTarget] = useState<{
    documentId: string;
    dateKey: string;
  } | null>(null);
  const [freeDayNotice, setFreeDayNotice] = useState(false);
  const [renderedGroupCount, setRenderedGroupCount] = useState(
    getInitialRenderedHistoryGroupCount,
  );
  const [isDateNavigationActive, setIsDateNavigationActive] = useState(false);
  const isDateNavigationActiveRef = useRef(false);
  isDateNavigationActiveRef.current = isDateNavigationActive;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    interventions,
    dateKeys,
    isInitialized,
    isRefreshing,
    error: loadError,
  } = useAppSelector((state) => state.history);

  const isLoading = !isInitialized;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dateSectionRefs = useRef<
    Record<string, HTMLElement | null>
  >({});
  const pendingScrollDateRef = useRef<string | null>(null);
  const pendingScrollAnchorRef = useRef<string | null>(null);

  const { groupedInterventions, navigationGroups } = buildHistoryViewModel(
    interventions,
    dateKeys,
  );

  useLayoutEffect(() => {
    if (!isInitialized || groupedInterventions.length === 0) return;

    const pendingDate = window.sessionStorage.getItem("history:pending-date");
    if (pendingDate) return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    // Every normal entry into Historique starts at the beginning so the newest
    // date header/bar is fully visible. Explicit date navigation is handled
    // separately below.
    scrollContainer.scrollTop = 0;
  }, [isInitialized, groupedInterventions]);

  const sidebarMonths = useMemo(() => {
    const months = new Map<
      string,
      {
        title: string;
        dates: typeof navigationGroups;
      }
    >();

    [...navigationGroups].reverse().forEach((group) => {
      const monthKey = group.date
        ? `${group.date.getFullYear()}-${group.date.getMonth()}`
        : "unknown-month";

      const existingMonth = months.get(monthKey);

      if (existingMonth) {
        existingMonth.dates.push(group);
      } else {
        months.set(monthKey, {
          title: capitalizeFirstLetter(
            formatMonthTitle(group.date),
          ),
          dates: [group],
        });
      }
    });

    return Array.from(months.entries()).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [navigationGroups]);

  // Progressive mount is retained to keep entry into Historique fast.
  // The mounted window stays well ahead of the scroll position so normal
  // scrolling never reaches an unmounted gap.
  useEffect(() => {
    if (groupedInterventions.length === 0) {
      setRenderedGroupCount(0);
      return;
    }

    setRenderedGroupCount((current) =>
      Math.max(
        Math.min(8, groupedInterventions.length),
        Math.min(current, groupedInterventions.length),
      ),
    );

    let cancelled = false;
    let timerId: number | null = null;

    const appendBatch = () => {
      if (cancelled || isDateNavigationActiveRef.current) return;

      setRenderedGroupCount((current) => {
        if (current >= groupedInterventions.length) return current;

        const next = Math.min(current + 5, groupedInterventions.length);

        if (next < groupedInterventions.length) {
          timerId = window.setTimeout(appendBatch, 25);
        }

        return next;
      });
    };

    timerId = window.setTimeout(appendBatch, 0);

  return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [groupedInterventions]);

  // While the user scrolls, pre-mount another chunk before the end of the
  // currently mounted content is reached.
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || groupedInterventions.length === 0) return;

    let framePending = false;

    const handleScroll = () => {
      if (framePending || isDateNavigationActiveRef.current) return;
      framePending = true;

      window.requestAnimationFrame(() => {
        framePending = false;

        const remaining =
          scrollContainer.scrollHeight -
          (scrollContainer.scrollTop + scrollContainer.clientHeight);

        if (remaining < 3500) {
          setRenderedGroupCount((current) =>
            Math.min(current + 10, groupedInterventions.length),
          );
        }
      });
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [groupedInterventions.length]);


  const performScrollToAnchor = (anchor: string) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return false;

    const target = Array.from(
      scrollContainer.querySelectorAll<HTMLElement>("[data-history-anchor]"),
    ).find(
      (element) => element.getAttribute("data-history-anchor") === anchor,
    );

    if (!target) return false;

    scrollContainer.scrollTo({
      top: Math.max(0, target.offsetTop - 8),
      behavior: "smooth",
    });
    return true;
  };

  const performScrollToDate = (dateKey: string) => {
    const scrollContainer = scrollContainerRef.current;
    const targetSection = dateSectionRefs.current[dateKey];

    if (!scrollContainer || !targetSection) return false;

    const targetTop = Math.max(0, targetSection.offsetTop - 4);

    scrollContainer.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    return true;
  };

  const scrollToDate = (dateKey: string) => {
    const navigationGroup = navigationGroups.find(
      (group) => group.key === dateKey,
    );

    if (!navigationGroup) return;

    if (navigationGroup.interventions.length === 0) {
      setFreeDayNotice(true);
      window.setTimeout(() => setFreeDayNotice(false), 1800);
      return;
    }

    const groupIndex = groupedInterventions.findIndex(
      (group) => group.key === dateKey,
    );

    if (groupIndex < 0) return;

    pendingScrollDateRef.current = dateKey;
    setIsDateNavigationActive(true);
    setRenderedGroupCount((current) =>
      Math.max(current, groupIndex + 1),
    );
  };

  useLayoutEffect(() => {
    const pendingDate = pendingScrollDateRef.current;
    const pendingAnchor = pendingScrollAnchorRef.current;

    if (!pendingDate || !isDateNavigationActive) return;

    const groupIndex = groupedInterventions.findIndex(
      (group) => group.key === pendingDate,
    );

    if (groupIndex < 0 || groupIndex >= renderedGroupCount) return;

    const frame = window.requestAnimationFrame(() => {
      if (
        pendingAnchor &&
        performScrollToAnchor(pendingAnchor)
      ) {
        pendingScrollDateRef.current = null;
        pendingScrollAnchorRef.current = null;
        setIsDateNavigationActive(false);
        return;
      }

      if (performScrollToDate(pendingDate)) {
        pendingScrollDateRef.current = null;
        setIsDateNavigationActive(false);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [renderedGroupCount, groupedInterventions, isDateNavigationActive]);

  useEffect(() => {
    if (!isInitialized || groupedInterventions.length === 0) return;

    const pendingDate = window.sessionStorage.getItem("history:pending-date");
    const pendingAnchor = window.sessionStorage.getItem("history:pending-anchor");

    if (!pendingDate) return;

    const groupIndex = groupedInterventions.findIndex(
      (group) => group.key === pendingDate,
    );

    if (groupIndex < 0) {
      window.sessionStorage.removeItem("history:pending-date");
      window.sessionStorage.removeItem("history:pending-anchor");
      return;
    }

    window.sessionStorage.removeItem("history:pending-date");
    window.sessionStorage.removeItem("history:pending-anchor");

    pendingScrollDateRef.current = pendingDate;
    pendingScrollAnchorRef.current = pendingAnchor;
    setIsDateNavigationActive(true);
    setRenderedGroupCount((current) =>
      Math.max(current, groupIndex + 1),
    );
  }, [groupedInterventions, isInitialized]);

  const exportHistoryDate = (dateKey: string, items: Intervention[]) => {
    const [year, month, day] = dateKey.split("-");
    exportInterventionsToExcel(
      items,
      `${day}/${month}/${year}`,
      `Historique_${dateKey}.xls`,
    );
  };

  return (
    <main className="history-page">
      <div className="history-page-layout">
        <div
          ref={scrollContainerRef}
          className="history-content"
        >
          <header className="history-page-header">
            <div>
              <span className="history-page-eyebrow">
                Archives
              </span>

              <h1>Historique des interventions</h1>
            </div>

            <span
              className={`history-total ${isRefreshing ? "is-refreshing" : ""}`}
              title={isRefreshing ? "Actualisation en cours" : undefined}
            >
              {interventions.length} intervention
              {interventions.length === 1 ? "" : "s"}
            </span>
          </header>

          {freeDayNotice && (
            <div className="history-free-day-notice" role="status">
              jour libre
            </div>
          )}

          {isLoading && (
            <div className="history-empty">Chargement de l'historique…</div>
          )}

          {!isLoading && loadError && (
            <div className="history-empty">{loadError}</div>
          )}

          {!isLoading && !loadError && groupedInterventions
            .slice(0, renderedGroupCount)
            .map((group) => (
            <section
              key={group.key}
              id={`history-${group.key}`}
              ref={(element) => {
                dateSectionRefs.current[group.key] = element;
              }}
              className="history-date-section"
            >
              <header className="history-date-header">
                <div>
                  <span className="history-date-marker" />

                  <h2>
                    {capitalizeFirstLetter(
                      formatDateTitle(group.date),
                    )}
                  </h2>
                </div>

                <div className="history-date-header__tools">
                  <button type="button" className="history-date-export-button" onClick={() => exportHistoryDate(group.key, group.interventions)} title="Exporter cette journée vers Excel">
                    <FileSpreadsheet size={16} /> Excel
                  </button>
                </div>

                <div
                  className="history-date-stats"
                  aria-label="Statistiques du jour"
                >
                  <span className="history-date-stat history-date-stat--completed">
                    <small>
                      Terminé: <strong>{
                        group.interventions.filter(
                          (intervention) =>
                            intervention.status === "completed",
                        ).length
                      }</strong>
                    </small>
                  </span>

                  <span className="history-date-stat history-date-stat--on-hold">
                    <small>
                      En attente: <strong>{
                        group.interventions.filter(
                          (intervention) =>
                            intervention.status === "on hold",
                        ).length
                      }</strong>
                    </small>
                  </span>

                  <span className="history-date-stat history-date-stat--transferred">
                    <small>
                      Transmis: <strong>{
                        group.interventions.filter(
                          (intervention) =>
                            intervention.status === "transferred",
                        ).length
                      }</strong>
                    </small>
                  </span>

                  <span className="history-date-stat history-date-stat--total">
                    <small>
                      Total: <strong>{group.interventions.length}</strong>
                    </small>
                  </span>
                </div>
              </header>

              <div className="history-interventions-list">
                {group.interventions.map((intervention) => {
                  const statusClass = getStatusClass(
                    intervention.status,
                  );

                  return (
                    <article
                      key={
                        intervention.documentId ||
                        intervention.interventionId
                      }
                      className={`history-intervention-row status-${statusClass}`}
                      data-history-anchor={`${intervention.dateKey ?? ""}::${intervention.documentId}`}
                    >
                      {intervention.lastRevuAt && (
                        <small className="history-intervention-last-review">
                          Dernier revu le {new Date(intervention.lastRevuAt).toLocaleDateString("fr-BE")} à{" "}
                          {new Date(intervention.lastRevuAt).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit", hour12: false })}
                        </small>
                      )}

                      <div className="history-intervention-actions">
                        <button
                          type="button"
                          className="history-action-button history-edit-button"
                          aria-label="Modifier l'intervention"
                          title="Modifier"
                          onClick={() => {
                            dispatch(
                              loadInterventionFromHistory(intervention),
                            );

                            navigate("/intervention-en-cours");
                          }}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          className="history-action-button history-delete-button"
                          aria-label="Supprimer l'intervention"
                          title="Supprimer"
                          onClick={() => {
                            if (!intervention.documentId || !intervention.dateKey) return;
                            setDeleteTarget({
                              documentId: intervention.documentId,
                              dateKey: intervention.dateKey,
                            });
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="history-column history-category-column">
                        <div className="history-category-section">
                          <span
                            className={`history-badge infrastructure ${
                              !hasValue(intervention.infrastructure)
                                ? "history-badge-empty"
                                : ""
                            }`}
                          >
                            {hasValue(intervention.infrastructure)
                              ? displayInfrastructure(
                                  intervention.infrastructure,
                                )
                              : "\u00A0"}
                          </span>

                          <span
                            className={`history-badge network ${
                              !hasValue(intervention.network)
                                ? "history-badge-empty"
                                : ""
                            }`}
                          >
                            {hasValue(intervention.network)
                              ? displayNetwork(intervention.network)
                              : "\u00A0"}
                          </span>

                          <span
                            className={`history-badge history-status status-${statusClass} ${
                              !hasValue(intervention.status)
                                ? "history-badge-empty"
                                : ""
                            }`}
                          >
                            {hasValue(intervention.status)
                              ? displayStatus(intervention.status)
                              : "\u00A0"}
                          </span>
                        </div>

                        <div className="history-flags-section">
                          {intervention.isUnclear && (
                            <BooleanIcon>
                              <img
                                src={QuestionActionOn}
                                alt="Question pour M&P"
                                title="Question pour M&P"
                                className="history-question-action-icon"
                              />
                            </BooleanIcon>
                          )}

                          {intervention.addressConfirmation === "confirmed" && (
                            <BooleanIcon>
                              <AddressConfirmedIcon />
                            </BooleanIcon>
                          )}

                          {intervention.addressConfirmation === "notConfirmed" && (
                            <BooleanIcon>
                              <AddressNotConfirmedIcon />
                            </BooleanIcon>
                          )}

                          {intervention.isGoodExample && (
                            <BooleanIcon>
                              <LightBulbOnIcon />
                            </BooleanIcon>
                          )}

                          {intervention.isSnowSentPending && (
                            <BooleanIcon>
                              <SnowSentPendingIcon />
                            </BooleanIcon>
                          )}

                          {intervention.isSnowReceivedPending && (
                            <BooleanIcon>
                              <SnowReceivedPendingIcon />
                            </BooleanIcon>
                          )}

                          {Boolean(
                          intervention.isResPending ||
                            (intervention as typeof intervention & {
                              resPending?: boolean;
                            }).resPending,
                        ) && (
                            <BooleanIcon>
                              <img
                                src={CableCutOn}
                                alt="Résiliation en attente"
                                title="Résiliation en attente"
                                className="history-cable-cut-icon"
                              />
                            </BooleanIcon>
                          )}

                          {(intervention.cure === "firstCure" ||
                            intervention.cure === "secondCure") && (
                            <BooleanIcon>
                              <img
                                src={
                                  intervention.cure === "firstCure"
                                    ? VoiceMessageCall1
                                    : VoiceMessageCall2
                                }
                                alt={
                                  intervention.cure === "firstCure"
                                    ? "CURE 1"
                                    : "CURE 2"
                                }
                                title={
                                  intervention.cure === "firstCure"
                                    ? "CURE 1"
                                    : "CURE 2"
                                }
                              />
                            </BooleanIcon>
                          )}
                        </div>
                      </div>

                      <div className="history-column history-identifiers-column">
                        {hasValue(intervention.interventionId) && (
                          <IconValue
                            value={intervention.interventionId}
                            icon={IDIcon}
                          />
                        )}

                        {hasValue(intervention.na) && (
                          <IconValue
                            value={intervention.na}
                            icon={() => <LetterBadge text="NA" />}
                          />
                        )}

                        {hasValue(intervention.oagID) && (
                          <IconValue
                            value={intervention.oagID}
                            icon={() => <LetterBadge text="OAG" />}
                          />
                        )}

                        {hasValue(
                          intervention.interventionDescription,
                        ) && (
                          <IconValue
                            value={
                              intervention.interventionDescription
                            }
                            icon={TextInitial}
                          />
                        )}

                        {hasValue(intervention.LOMKey) && (
                          <IconValue
                            value={intervention.LOMKey}
                            icon={KeyRound}
                          />
                        )}

                        {hasValue(intervention.mainAddress) && (
                          <IconValue
                            value={intervention.mainAddress}
                            icon={House}
                          />
                        )}

                        {hasValue(intervention.clientID) && (
                          <IconValue
                            value={intervention.clientID}
                            icon={Contact}
                          />
                        )}

                        {hasValue(intervention.cid) && (
                          <IconValue
                            value={intervention.cid}
                            icon={() => <LetterBadge text="CID" />}
                          />
                        )}

                        {hasValue(intervention.phone) && (
                          <IconValue
                            value={intervention.phone}
                            icon={PhoneCall}
                          />
                        )}

                        {hasValue(intervention.addressDetails) && (
                          <IconValue
                            value={intervention.addressDetails}
                            icon={NotebookTabs}
                          />
                        )}

                        {hasValue(intervention.snowReceived) && <IconValue value={intervention.snowReceived} icon={() => <SnowStatusIcon direction="left" />} />}
                        {hasValue(intervention.snowSent) && <IconValue value={intervention.snowSent} icon={() => <SnowStatusIcon direction="right" />} />}
                        {hasValue(intervention.snowMentioned) && <IconValue value={intervention.snowMentioned} icon={() => <SnowStatusIcon direction="none" />} />}
                      </div>

                      <div className="history-column history-text-column history-client-address-column">
                        <StackedField
                          label="Nom du client"
                          value={intervention.clientName}
                          compact
                        />

                        <StackedField
                          label="Clients à l'adresse"
                          value={intervention.clientsOnAddress}
                        />
                      </div>

                      <div className="history-column history-text-column">
                        <StackedField
                          label="Commentaire"
                          value={intervention.comment}
                        />

                        {hasValue(intervention.additionalInformation) && (
                          <AdditionalInformationDialog
                            value={intervention.additionalInformation}
                          />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {!isLoading && !loadError && interventions.length === 0 && (
            <div className="history-empty">
              <div className="history-empty-icon">H</div>

              <h2>Aucune intervention disponible</h2>

              <p>
                Les interventions enregistrées apparaîtront ici,
                regroupées par date.
              </p>
            </div>
          )}
        </div>

        <HistoryNavigation
          months={sidebarMonths}
          onSelectDate={scrollToDate}
        />
      </div>
          <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await dispatch(deleteInterventionThunk(deleteTarget));
          setDeleteTarget(null);
        }}
      />
</main>
  );
};

export default HistoryPage;
