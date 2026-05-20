import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';
import { MonthlyTrendChart } from '../charts/MonthlyTrendChart';

interface MonthlyReportProps {
  allEntries: any[];
  targetCalories: number;
  onCollapse: () => void;
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

export function MonthlyReport({ allEntries, targetCalories, onCollapse }: MonthlyReportProps) {
  const { chartData, maxDay, minDay, avgCal, avgProtein, totalCal } = useMemo(() => {
    const now = new Date();
    const data = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let daysWithData = 0;
    let maxCal = 0;
    let maxDayLabel = '';
    let minCal = Infinity;
    let minDayLabel = '';

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dk = dateToKey(d.getTime());
      const start = getStartOfDay(dk);
      const end = getEndOfDay(dk);
      const dayEntries = allEntries.filter((e: any) => e.createdAt >= start && e.createdAt <= end && !e.deletedAt);
      const cal = dayEntries.reduce((s: number, e: any) => s + (e.calories || 0), 0);
      const pro = dayEntries.reduce((s: number, e: any) => s + (e.protein || 0), 0);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      data.push({ dateKey: dk, label, calories: cal, protein: pro });

      if (cal > 0) {
        totalCalories += cal;
        totalProtein += pro;
        daysWithData++;
        if (cal > maxCal) { maxCal = cal; maxDayLabel = label; }
        if (cal < minCal) { minCal = cal; minDayLabel = label; }
      }
    }

    return {
      chartData: data,
      maxDay: { cal: maxCal, label: maxDayLabel },
      minDay: { cal: minCal === Infinity ? 0 : minCal, label: minDayLabel },
      avgCal: daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0,
      avgProtein: daysWithData > 0 ? Math.round(totalProtein / daysWithData) : 0,
      totalCal: totalCalories,
    };
  }, [allEntries]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 近30天趋势</Text>
        <TouchableOpacity onPress={onCollapse} style={styles.collapseBtn}>
          <Text style={styles.collapseBtnText}>收起 ▲</Text>
        </TouchableOpacity>
      </View>

      <MonthlyTrendChart data={chartData} targetCalories={targetCalories} />

      <View style={styles.statsGrid}>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>最高日</Text>
          <Text style={[styles.statValue, { color: COLORS.fat }]}>{maxDay.cal} kcal</Text>
          <Text style={styles.statSub}>({maxDay.label})</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>最低日</Text>
          <Text style={[styles.statValue, { color: COLORS.protein }]}>{minDay.cal} kcal</Text>
          <Text style={styles.statSub}>({minDay.label})</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>月平均</Text>
          <Text style={styles.statValue}>{avgCal} kcal/天</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>总摄入</Text>
          <Text style={styles.statValue}>{totalCal.toLocaleString()} kcal</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>蛋白质平均</Text>
          <Text style={[styles.statValue, { color: COLORS.protein }]}>{avgProtein}g/天</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  collapseBtn: {
    padding: 6,
  },
  collapseBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 80,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  statSub: {
    fontSize: 12,
    color: '#BDBDBD',
  },
});
