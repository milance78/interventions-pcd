import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../../firebase/firebaseConfig";
import {
  hydrateOccurrencesWithLatestState,
  loadCompleteHistory,
  loadDailySummary,
  loadHistoryDateKeys,
  loadInterventions,
  loadLatestInterventions,
} from "../../firebase/interventionsService";
import {
  clearHistory,
  setHistory,
  setHistoryDateKeys,
  setHistoryError,
  startHistoryRefresh,
} from "../../redux/features/historySlice";
import { setInterventions } from "../../redux/features/interventionsListSlice";
import { setStatistics } from "../../redux/features/statisticsSlice";
import { useAppDispatch } from "../../redux/store";
import { loadHistoryCache, saveHistoryCache } from "../../localStorage/historyCache";
import { buildHistoryViewModel } from "../../utils/historyViewModel";

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
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        dispatch(setInterventions([]));
        dispatch(clearHistory());
        return;
      }

      const today = getLocalDate();
      let firebaseHistoryApplied = false;

      dispatch(startHistoryRefresh());

      // Read the large local snapshot asynchronously from IndexedDB. This no
      // longer blocks the main thread like JSON.parse from localStorage did.
      void loadHistoryCache(user.uid).then((cachedHistory) => {
        if (cancelled || firebaseHistoryApplied || !cachedHistory) return;

        buildHistoryViewModel(cachedHistory.interventions, cachedHistory.dateKeys);
        dispatch(setHistoryDateKeys(cachedHistory.dateKeys));
        dispatch(setHistory(cachedHistory.interventions));
        // setHistory ends the refresh flag; keep the subtle refresh indication
        // active while Firebase checks for newer data.
        dispatch(startHistoryRefresh());
      });

      // Start History immediately and independently. It must never wait for
      // today's list, active interventions, or statistics.
      const latestPromise = loadLatestInterventions(user.uid);

      void (async () => {
        try {
          const dateKeys = await loadHistoryDateKeys(user.uid);
          if (cancelled) return;

          // Navigation becomes available before all daily intervention
          // subcollections have finished downloading.
          dispatch(setHistoryDateKeys(dateKeys));

          const [historyDays, latestInterventions] = await Promise.all([
            loadCompleteHistory(user.uid, dateKeys),
            latestPromise,
          ]);

          if (cancelled) return;

          const hydratedHistory = hydrateOccurrencesWithLatestState(
            historyDays.flatMap((day) => day.interventions),
            latestInterventions,
          );

          firebaseHistoryApplied = true;
          buildHistoryViewModel(hydratedHistory, dateKeys);
          dispatch(setHistory(hydratedHistory));
          void saveHistoryCache(user.uid, hydratedHistory, dateKeys);
        } catch (error) {
          console.error("Unable to load history:", error);
          if (!cancelled) {
            dispatch(setHistoryError("Impossible de charger l'historique."));
          }
        }
      })();

      // Today's screen and statistics load in their own flow.
      void (async () => {
        try {
          const [todayOccurrences, latestInterventions, summary] = await Promise.all([
            loadInterventions(user.uid, today),
            latestPromise,
            loadDailySummary(user.uid, today).catch(() => null),
          ]);

          if (cancelled) return;

          dispatch(
            setInterventions(
              hydrateOccurrencesWithLatestState(
                todayOccurrences,
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
                todayOccurrences.filter((item) => item.status === "completed").length,
              onHold:
                summary?.onHold ??
                todayOccurrences.filter((item) => item.status === "on hold").length,
              transferred:
                summary?.transferred ??
                todayOccurrences.filter((item) => item.status === "transferred").length,
              closedByAnotherAgent:
                summary?.closedByAnotherAgent ??
                todayOccurrences.filter(
                  (item) => item.status === "closed by another agent",
                ).length,
            }),
          );
        } catch (error) {
          console.error("Unable to load today's interventions:", error);
          if (!cancelled) dispatch(setInterventions([]));
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export default InterventionsLoader;
