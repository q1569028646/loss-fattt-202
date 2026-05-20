import { calcStreak } from '../../utils/streakCalc';

function makeEntry(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { createdAt: d.getTime(), deletedAt: undefined };
}

describe('calcStreak', () => {
  it('returns 0 for empty entries', () => {
    expect(calcStreak([])).toBe(0);
  });

  it('counts consecutive days from today', () => {
    const entries = [
      makeEntry(0),
      makeEntry(1),
      makeEntry(2),
    ];
    expect(calcStreak(entries)).toBe(3);
  });

  it('skips today if no entry today and counts from yesterday', () => {
    const entries = [
      makeEntry(1),
      makeEntry(2),
      makeEntry(3),
    ];
    expect(calcStreak(entries)).toBe(3);
  });

  it('breaks streak on gap', () => {
    const entries = [
      makeEntry(0),
      makeEntry(1),
      makeEntry(3),
    ];
    expect(calcStreak(entries)).toBe(2);
  });

  it('skips today with no entry and breaks on gap yesterday', () => {
    const entries = [
      makeEntry(2),
      makeEntry(3),
    ];
    expect(calcStreak(entries)).toBe(0);
  });

  it('ignores deleted entries', () => {
    const d0: any = makeEntry(0);
    d0.deletedAt = Date.now();
    const entries = [
      d0,
      makeEntry(1),
      makeEntry(2),
    ];
    expect(calcStreak(entries)).toBe(2);
  });
});
