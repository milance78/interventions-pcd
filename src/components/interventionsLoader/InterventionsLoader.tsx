import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import {
  loadDailySummary,
  loadInterventions,
} from "../../firebase/interventionsService";
import { useAppDispatch } from "../../redux/store";
import { setInterventions } from "../../redux/features/interventionsListSlice";
import { setStatistics } from "../../redux/features/statisticsSlice";
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
        return;
      }
      try {
        const today = getLocalDate();
        const interventions = await loadInterventions(user.uid, today);
        dispatch(setInterventions(interventions));
        const summary = await loadDailySummary(user.uid, today);
        const now = new Date();
        dispatch(
          setStatistics({
            date: now.toLocaleDateString("fr-BE"),
            time: now.toLocaleTimeString("fr-BE"),
            total: summary?.total ?? 0,
            completed: summary?.completed ?? 0,
            onHold: summary?.onHold ?? 0,
            transferred: summary?.transferred ?? 0,
            closedByAnotherAgent: summary?.closedByAnotherAgent ?? 0,
          }),
        );
      } catch (error) {
        console.error("Unable to load interventions:", error);
        dispatch(setInterventions([]));
      }
    });
    return unsubscribe;
  }, [dispatch]);
  return null;
};
export default InterventionsLoader;
