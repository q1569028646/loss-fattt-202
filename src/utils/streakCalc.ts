import { dateToKey } from './dateUtils';
import type { FoodEntry } from '../types';

export function calcStreak(entries: FoodEntry[]): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d.getTime());
    const has = entries.some(e => {
      const ek = dateToKey(e.createdAt);
      return ek === dk && !e.deletedAt;
    });
    if (has) streak++;
    else if (i === 0) continue;
    else break;
  }
  return streak;
}

export function countDaysInPeriod(entries: FoodEntry[], days: number): number {
  const now = new Date();
  let count = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d.getTime());
    const has = entries.some(e => dateToKey(e.createdAt) === dk && !e.deletedAt);
    if (has) count++;
  }
  return count;
}

export function calcProteinStreak(entries: FoodEntry[], target: number): number {
  if (target <= 0) return 0;
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d.getTime());
    const dayEntries = entries.filter(e => dateToKey(e.createdAt) === dk && !e.deletedAt);
    if (dayEntries.length === 0) break;
    const totalProtein = dayEntries.reduce((s, e) => s + (e.protein || 0), 0);
    if (totalProtein >= target) streak++;
    else break;
  }
  return streak;
}

export function calcDeficitStreak(entries: FoodEntry[], dailyTarget: number): number {
  if (dailyTarget <= 0) return 0;
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dk = dateToKey(d.getTime());
    const dayEntries = entries.filter(e => dateToKey(e.createdAt) === dk && !e.deletedAt);
    if (dayEntries.length === 0) break;
    const totalCal = dayEntries.reduce((s, e) => s + (e.calories || 0), 0);
    if (totalCal < dailyTarget) streak++;
    else break;
  }
  return streak;
}
