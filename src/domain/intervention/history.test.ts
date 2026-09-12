import { describe, expect, it, vi } from 'vitest';
import type { Intervention } from './types';
import { loadHistoryDaySafely, loadHistoryDaysSafely, normalizeHistoryDays, sortHistoryDateKeys } from './history';

describe('history helpers', () => {
  it('sorts date keys newest first without mutating input', () => {
    const input = ['2026-01-02', '2026-09-13', '2026-05-01'];
    expect(sortHistoryDateKeys(input)).toEqual(['2026-09-13', '2026-05-01', '2026-01-02']);
    expect(input).toEqual(['2026-01-02', '2026-09-13', '2026-05-01']);
  });

  it('removes empty days and keeps newest-first order', () => {
    expect(normalizeHistoryDays([
      { dateKey: '2026-01-01', interventions: [{} as never] },
      null,
      { dateKey: '2026-09-01', interventions: [] },
      { dateKey: '2026-08-01', interventions: [{} as never] },
    ])).toMatchObject([
      { dateKey: '2026-08-01' },
      { dateKey: '2026-01-01' },
    ]);
  });

  it('isolates a failed day and reports its date', async () => {
    const onError = vi.fn();
    const result = await loadHistoryDaySafely('2026-09-12', async () => { throw new Error('offline'); }, onError);
    expect(result).toBeNull();
    expect(onError).toHaveBeenCalledWith(expect.any(Error), '2026-09-12');
  });

  it('loads all days independently when one fails', async () => {
    const result = await loadHistoryDaysSafely(['a', 'b'], async (key) => {
      if (key === 'b') throw new Error('failed');
      return [{ id: 'ok' } as unknown as Intervention];
    });
    expect(result).toEqual([{ dateKey: 'a', interventions: [{ id: 'ok' }] }, null]);
  });
});
