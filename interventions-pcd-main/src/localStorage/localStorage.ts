// Recovered from the original webpack bundle.
"use strict";
/* harmony export */
const STORAGE_KEY = "taches-pcd-draft";
const saveDraftToStorage = (intervention) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(intervention));
};
const loadDraftFromStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};
const clearDraftFromStorage = () => {
  localStorage.removeItem(STORAGE_KEY);
};
export { clearDraftFromStorage, loadDraftFromStorage, saveDraftToStorage };
