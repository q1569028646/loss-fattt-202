import { kjToKcal, kcalToKj } from '../../utils/formatters';

describe('kJ/kcal conversion utilities', () => {
  it('converts kJ to kcal correctly', () => {
    expect(kjToKcal(4184)).toBe(1000);
    expect(kjToKcal(1520)).toBe(363.3);
    expect(kjToKcal(0)).toBe(0);
  });

  it('converts kcal to kJ correctly', () => {
    expect(kcalToKj(1000)).toBe(4184);
    expect(kcalToKj(363)).toBe(1518.8);
    expect(kcalToKj(0)).toBe(0);
  });

  it('rounds to 1 decimal place', () => {
    const kcal = kjToKcal(1000);
    expect(kcal).toBe(239);
    const kj = kcalToKj(kcal);
    expect(kj).toBe(1000);
  });
});
