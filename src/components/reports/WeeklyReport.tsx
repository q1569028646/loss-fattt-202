import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';
import { WeeklyBarChart } from '../charts/WeeklyBarChart';

interface WeeklyReportProps {
  allEntries: any[];
  targetCalories: number;
  onExpand: () => void;
}

function dateToKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getStartOfDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function getEndOfDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

export function WeeklyReport({ allEntries, targetCalories, onExpand }: WeeklyReportProps) {
  const { chartData, avgCal, avgProtein, daysWithData } = useMemo(() => {
    const now = new Date();
    const today = now.getDay();
    const mondayOffset = today === 0 ? -6 : 1 - today;

    const data = [];
    let totalCal = 0;
    let totalPro = 0;
    let days = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + mondayOffset + i);
      const dk = dateToKey(d.getTime());
      const start = getStartOfDay(dk);
      const end = getEndOfDay(dk);
      const dayEntries = allEntries.filter((e: any) => e.createdAt >= start && e.createdAt <= end && !e.deletedAt);
      const cal = dayEntries.reduce((s: number, e: any) => s + (e.calories || 0), 0);
      const pro = dayEntries.reduce((s: number, e: any) => s + (e.protein || 0), 0);
      data.push({ dateKey: dk, label: WEEKDAY_LABELS[d.getDay()], calories: cal, protein: pro });
      if (cal > 0) {
        totalCal += cal;
        totalPro += pro;
        days++;
      }
    }

    return {
      chartData: data,
      avgCal: days > 0 ? Math.round(totalCal / days) : 0,
      avgProtein: days > 0 ? Math.round(totalPro / days) : 0,
      daysWithData: days,
    };
  }, [allEntries]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 本周营养报告</Text>
      <WeeklyBarChart data={chartData} targetCalories={targetCalories} />
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgCal}</Text>
          <Text style={styles.statUnit}>日均热量 kcal</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.protein }]}>{avgProtein}g</Text>
          <Text style={styles.statUnit}>日均蛋白质</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{daysWithData}</Text>
          <Text style={styles.statUnit}>记录天数</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.expandBtn} onPress={onExpand}>
        <Text style={styles.expandBtnText}>📈 查看近30天趋势 &gt;</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  statUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  expandBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  expandBtnText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
