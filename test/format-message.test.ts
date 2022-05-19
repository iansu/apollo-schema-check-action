import { getValidationPeriod } from '../src/format-message';

describe('getValidationPeriod', () => {
  test('negative number of seconds', () => {
    expect(getValidationPeriod('-86400')).toBe('1d');
  });

  test('ISO 8601 duration', () => {
    expect(getValidationPeriod('P2W')).toBe('14d');
  });

  test('Plain text duration', () => {
    expect(getValidationPeriod('2 weeks')).toBe('2 weeks');
  });
});
