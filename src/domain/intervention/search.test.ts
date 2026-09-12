import { describe, expect, it } from 'vitest';
import { numericPart, prepareSearchValue } from './search';

describe('search helpers', () => {
  it('keeps an 18-character identifier exact', () => {
    expect(prepareSearchValue(' 123456789012345678 ')).toEqual({ value: '123456789012345678', mode: 'exact' });
  });
  it('adds the legacy suffix to a 17-character identifier', () => {
    expect(prepareSearchValue('12345678901234567')).toEqual({ value: '123456789012345679', mode: 'exact' });
  });
  it('extracts digits from general search input', () => {
    expect(prepareSearchValue('OAG-12/34')).toEqual({ value: '1234', mode: 'digits' });
    expect(numericPart('abc 98-x')).toBe('98');
    expect(numericPart(null)).toBe('');
  });
});
