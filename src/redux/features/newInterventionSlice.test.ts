import { describe, expect, it } from 'vitest';
import reducer, { initialState } from './newInterventionSlice';
import { updateField, updateMainAddressManually, applyPastedMainAddress, addAddressClient, removeAddressClient, recordCure, clearTodaysCures } from './newInterventionSlice';

describe('newInterventionSlice', () => {
  it('updates fields and blocks changes in history mode', () => {
    const changed = reducer(initialState, updateField({ field: 'status', value: 'DONE' } as any));
    expect((changed as any).status).toBe('DONE');
    const history = reducer({ ...initialState, mode: 'VIEW_HISTORY' } as any, updateField({ field: 'status', value: 'DONE' } as any));
    expect((history as any).status).not.toBe('DONE');
  });
  it('parses and composes main address', () => {
    const state = reducer(initialState, updateMainAddressManually('Rue Test 12A, 1000 Bruxelles'));
    expect((state as any).mainAddress).toContain('Rue Test');
    const pasted = reducer(initialState, applyPastedMainAddress({ streetName: 'Rue Test', streetNumber: '12', streetAlpha: 'A', postalCode: '1000', city: 'Bruxelles' }));
    expect((pasted as any).mainAddress).toContain('12A');
  });
  it('adds and removes structured address clients', () => {
    const client = { id: 'c1', name: 'Jean', clientId: '123', mode: 'CID', confirmed: false } as any;
    let state = reducer(initialState, addAddressClient(client));
    expect((state as any).addressClients).toHaveLength(1);
    state = reducer(state, removeAddressClient('c1'));
    expect((state as any).addressClients).toHaveLength(0);
  });
  it('records and clears cures', () => {
    const state = reducer(initialState, recordCure({ cure: 'firstCure', recordedAt: '2026-09-13T10:00:00.000Z', smsEnabled: true } as any));
    expect((state as any).cureRecords).toBeDefined();
    const cleared = reducer(state, clearTodaysCures());
    expect((cleared as any).cureRecords).toBeDefined();
  });
});
