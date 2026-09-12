import { beforeEach, describe, expect, it } from 'vitest';
import { clearDraftFromStorage, clearCurrentSessionFromStorage, loadDraftFromStorage, loadCurrentSessionFromStorage, saveDraftToStorage, saveCurrentSessionToStorage, setCurrentRecoveryMarker, shouldRecoverCurrentOnLaunch } from './localStorage';

class MemoryStorage { data = new Map<string,string>(); setItem(k:string,v:string){this.data.set(k,v)} getItem(k:string){return this.data.get(k) ?? null} removeItem(k:string){this.data.delete(k)} }

describe('localStorage persistence', () => {
  beforeEach(() => { (globalThis as any).window = { localStorage: new MemoryStorage() }; });
  it('round-trips draft and current session', () => {
    saveDraftToStorage({ a: 1 }); saveCurrentSessionToStorage({ b: 2 });
    expect(loadDraftFromStorage()).toEqual({ a: 1 });
    expect(loadCurrentSessionFromStorage()).toEqual({ b: 2 });
  });
  it('clears persisted values', () => {
    saveDraftToStorage({ a: 1 }); saveCurrentSessionToStorage({ b: 2 });
    clearDraftFromStorage(); clearCurrentSessionFromStorage();
    expect(loadDraftFromStorage()).toBeNull(); expect(loadCurrentSessionFromStorage()).toBeNull();
  });
  it('manages recovery marker', () => {
    expect(shouldRecoverCurrentOnLaunch()).toBe(false);
    setCurrentRecoveryMarker(true); expect(shouldRecoverCurrentOnLaunch()).toBe(true);
    setCurrentRecoveryMarker(false); expect(shouldRecoverCurrentOnLaunch()).toBe(false);
  });
});
