/**
 * 日期工具函数
 * 集中管理所有日期相关的操作
 */

/**
 * 将时间戳转换为日期键 (YYYY-MM-DD)
 */
export function dateToKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 获取今天的日期键
 */
export function todayKey(): string {
  return dateToKey(Date.now());
}

/**
 * 获取昨天的日期键
 */
export function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateToKey(d.getTime());
}

/**
 * 获取指定日期键的开始时间戳（当天00:00:00）
 */
export function getStartOfDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

/**
 * 获取指定日期键的结束时间戳（当天23:59:59.999）
 */
export function getEndOfDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

/**
 * 获取N天前的日期键
 */
export function daysAgoKey(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateToKey(d.getTime());
}

/**
 * 获取N天前的时间戳
 */
export function getTimestampDaysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

/**
 * 检查条目是否在指定日期范围内
 */
export function isEntryInDateRange(
  entryCreatedAt: number,
  dateKey: string
): boolean {
  const start = getStartOfDay(dateKey);
  const end = getEndOfDay(dateKey);
  return entryCreatedAt >= start && entryCreatedAt <= end;
}

/**
 * 筛选指定日期范围内的有效条目（未删除）
 */
export function filterEntriesByDate<T extends { createdAt: number; deletedAt?: number }>(
  entries: T[],
  dateKey: string
): T[] {
  const start = getStartOfDay(dateKey);
  const end = getEndOfDay(dateKey);
  return entries.filter(e => e.createdAt >= start && e.createdAt <= end && !e.deletedAt);
}

/**
 * 生成唯一ID
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 常量定义
 */
export const DATE_CONSTANTS = {
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  ONE_WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  MAX_STREAK_DAYS: 365,
  DAYS_IN_YEAR: 365,
} as const;
