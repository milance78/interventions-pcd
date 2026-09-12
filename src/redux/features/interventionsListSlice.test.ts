import { describe, expect, it } from 'vitest';
import reducer, { addIntervention, deleteLocalIntervention, setInterventions, updateLocalIntervention } from './interventionsListSlice';

type I = any;
const item = (patch: I = {}): I => ({ documentId: 'doc-1', dateKey: '2026-09-13', interventionId: 'INT-1', createdAt: 'old', status: 'NEW', ...patch });

describe('interventionsListSlice', () => {
  it('sets, adds and removes interventions', () => {
    let state = reducer([], setInterventions([item()]));
    state = reducer(state, addIntervention(item({ documentId: 'doc-2' })));
    expect(state.map(x => x.documentId)).toEqual(['doc-2', 'doc-1']);
    state = reducer(state, deleteLocalIntervention('doc-2'));
    expect(state).toHaveLength(1);
  });
  it('replaces duplicate document IDs instead of duplicating', () => {
    const state = reducer([item()], addIntervention(item({ status: 'DONE' })));
    expect(state).toHaveLength(1);
    expect(state[0].status).toBe('DONE');
  });
  it('updates logical intervention while preserving identity fields', () => {
    const state = reducer([item()], updateLocalIntervention(item({ status: 'DONE', createdAt: 'new', documentId: 'other' })));
    expect(state[0]).toMatchObject({ status: 'DONE', documentId: 'doc-1', dateKey: '2026-09-13', createdAt: 'old' });
  });
});
