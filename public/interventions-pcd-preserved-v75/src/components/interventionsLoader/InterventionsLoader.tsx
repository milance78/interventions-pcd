import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../firebase/firebaseConfig";
import {
  hydrateOccurrencesWithLatestState,
  loadCompleteHistory,
  loadDailySummary,
  loadInterventions,
  loadLatestInterventions,
} from "../../firebase/interventionsService";
import {
  clearHistory,
  setHistory,
  setHistoryError,
  startHistoryRefresh,
} from "../../redux/features/historySlice";
import { setInterventions } from "../../redux/features/interventionsListSlice";
import { setStatistics } from "../../redux/features/statisticsSlice";
import { useAppDispatch } from "../../redux/store";

const getLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const InterventionsLoader = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        dispatch(setInterventions([]));
        dispatch(clearHistory());
        return;
      }

      const today = getLocalDate();
      dispatch(startHistoryRefresh());

      try {
        const [
          todayOccurrences,
          historyDays,
          latestInterventions,
          summary,
        ] = await Promise.all([
          loadInterventions(user.uid, today),
          loadCompleteHistory(user.uid),
          loadLatestInterventions(user.uid),
          loadDailySummary(user.uid, today).catch(() => null),
        ]);

        dispatch(
          setInterventions(
            hydrateOccurrencesWithLatestState(
              todayOccurrences,
              latestInterventions,
            ),
          ),
        );

        dispatch(
          setHistory(
            hydrateOccurrencesWithLatestState(
              historyDays.flatMap((day) => day.interventions),
              latestInterventions,
            ),
          ),
        );

        const now = new Date();

        dispatch(
          setStatistics({
            date: now.toLocaleDateString("fr-BE"),
            time: now.toLocaleTimeString("fr-BE"),
            total: summary?.total ?? todayOccurrences.length,
            completed:
              summary?.completed ??
              todayOccurrences.filter(
                (item) => item.status === "completed",
              ).length,
            onHold:
              summary?.onHold ??
              todayOccurrences.filter(
                (item) => item.status === "on hold",
              ).length,
            transferred:
              summary?.transferred ??
              todayOccurrences.filter(
                (item) => item.status === "transferred",
              ).length,
            closedByAnotherAgent:
              summary?.closedByAnotherAgent ??
              todayOccurrences.filter(
                (item) =>
                  item.status === "closed by another agent",
              ).length,
          }),
        );
      } catch (error) {
        console.error("Unable to load interventions:", error);
        dispatch(setInterventions([]));
        dispatch(setHistoryError("Impossible de charger l'historique."));
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return null;
};

export default InterventionsLoader;
