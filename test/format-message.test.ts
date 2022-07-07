import { getValidationPeriod } from '../src/format-message';

describe('getValidationPeriod', () => {
  test('negative number of seconds', () => {
    expect(getValidationPeriod('-86400')).toBe('1 day');
  });

  test('positive number of seconds', () => {
    expect(getValidationPeriod('300')).toBe('5 minutes');
  });

  test('another positive number of seconds', () => {
    expect(getValidationPeriod('325')).toBe('5 minutes 25 seconds');
  });

  test('ISO 8601 duration', () => {
    expect(getValidationPeriod('P2W')).toBe('14 days');
  });

  test('Plain text duration', () => {
    expect(getValidationPeriod('2 weeks')).toBe('2 weeks');
  });
});
