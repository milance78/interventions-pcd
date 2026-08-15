const DRAFT_STORAGE_KEY = "taches-pcd-draft";
const CURRENT_SESSION_KEY = "interventions-pcd:current-session-v2";
const CURRENT_RECOVERY_KEY = "interventions-pcd:recover-current-on-launch-v1";

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const saveDraftToStorage = (intervention: unknown) => {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(intervention));
  } catch {
    // Ignore storage quota/privacy errors.
  }
};

const loadDraftFromStorage = <T = unknown,>(): T | null => {
  try {
    return safeParse<T>(window.localStorage.getItem(DRAFT_STORAGE_KEY));
  } catch {
    return null;
  }
};

const clearDraftFromStorage = () => {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
};

const saveCurrentSessionToStorage = (session: unknown) => {
  try {
    // This is intentionally the complete Current Intervention Redux state,
    // including mode, edit baseline, nested address clients and status flags.
    window.localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage quota/privacy errors.
  }
};

const loadCurrentSessionFromStorage = <T = unknown,>(): T | null => {
  try {
    return safeParse<T>(window.localStorage.getItem(CURRENT_SESSION_KEY));
  } catch {
    return null;
  }
};

const setCurrentRecoveryMarker = (active: boolean) => {
  try {
    if (active) {
      window.localStorage.setItem(CURRENT_RECOVERY_KEY, "true");
    } else {
      window.localStorage.removeItem(CURRENT_RECOVERY_KEY);
    }
  } catch {
    // Ignore storage errors.
  }
};

const shouldRecoverCurrentOnLaunch = (): boolean => {
  try {
    return window.localStorage.getItem(CURRENT_RECOVERY_KEY) === "true";
  } catch {
    return false;
  }
};

const clearCurrentSessionFromStorage = () => {
  try {
    window.localStorage.removeItem(CURRENT_SESSION_KEY);
  } catch {
    // Ignore storage errors.
  }
};

export {
  clearCurrentSessionFromStorage,
  clearDraftFromStorage,
  loadCurrentSessionFromStorage,
  loadDraftFromStorage,
  saveCurrentSessionToStorage,
  saveDraftToStorage,
  setCurrentRecoveryMarker,
  shouldRecoverCurrentOnLaunch,
};
