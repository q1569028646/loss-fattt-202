import { calcStreak } from '../../utils/streakCalc';
import type { FoodEntry } from '../../types';

function makeEntry(daysAgo: number, overrides?: Partial<FoodEntry>): FoodEntry {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id: `test_${daysAgo}`,
    name: 'test',
    mealType: 'lunch',
    servingSize: 100,
    servingUnit: 'g',
    calories: 200,
    protein: 10,
    carbs: 20,
    fat: 5,
    fiber: 2,
    sugar: 3,
    sodium: 100,
    aiProviderId: 'test',
    rawAiResponse: '',
    isFavorite: false,
    createdAt: d.getTime(),
    deletedAt: undefined,
    ...overrides,
  };
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
    const entries = [
      makeEntry(0, { deletedAt: Date.now() }),
      makeEntry(1),
      makeEntry(2),
    ];
    expect(calcStreak(entries)).toBe(2);
  });
});
