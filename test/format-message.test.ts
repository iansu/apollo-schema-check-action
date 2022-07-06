import { getValidationPeriod } from '../src/format-message';

describe('getValidationPeriod', () => {
  test('negative number of seconds', () => {
    expect(getValidationPeriod('-86400')).toBe('86400 sec');
  });

  test('positive number of seconds', () => {
    expect(getValidationPeriod('300')).toBe('300 sec');
  });

  test('ISO 8601 duration', () => {
    expect(getValidationPeriod('P2W')).toBe('1209600 sec');
  });

  test('Plain text duration', () => {
    expect(getValidationPeriod('2 weeks')).toBe('2 weeks');
  });
});
