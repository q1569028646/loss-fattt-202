import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

interface Props {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export function MacroPieChart({ protein, carbs, fat, size = 140 }: Props) {
  const total = protein + carbs + fat;
  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  }

  const proteinPct = Math.round((protein / total) * 100);
  const carbsPct = Math.round((carbs / total) * 100);
  const fatPct = 100 - proteinPct - carbsPct;

  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const proteinStroke = (protein / total) * circumference;
  const carbsStroke = (carbs / total) * circumference;
  const fatStroke = (fat / total) * circumference;

  const proteinOffset = 0;
  const carbsOffset = proteinStroke;
  const fatOffset = proteinStroke + carbsStroke;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle cx={center} cy={center} r={radius} stroke="#F0F0F0" strokeWidth={strokeWidth} fill="none" />
            <Circle cx={center} cy={center} r={radius} stroke={COLORS.protein} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${proteinStroke} ${circumference - proteinStroke}`} strokeDashoffset={-proteinOffset} strokeLinecap="butt" />
            <Circle cx={center} cy={center} r={radius} stroke={COLORS.carbs} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${carbsStroke} ${circumference - carbsStroke}`} strokeDashoffset={-carbsOffset} strokeLinecap="butt" />
            <Circle cx={center} cy={center} r={radius} stroke={COLORS.fat} strokeWidth={strokeWidth} fill="none" strokeDasharray={`${fatStroke} ${circumference - fatStroke}`} strokeDashoffset={-fatOffset} strokeLinecap="butt" />
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={styles.centerValue}>{Math.round(total)}</Text>
          <Text style={styles.centerUnit}>g</Text>
        </View>
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.protein }]} />
          <Text style={styles.legendText}>蛋白质 {proteinPct}%</Text>
          <Text style={styles.legendVal}>{protein.toFixed(1)}g</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.carbs }]} />
          <Text style={styles.legendText}>碳水 {carbsPct}%</Text>
          <Text style={styles.legendVal}>{carbs.toFixed(1)}g</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.fat }]} />
          <Text style={styles.legendText}>脂肪 {fatPct}%</Text>
          <Text style={styles.legendVal}>{fat.toFixed(1)}g</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  container: { justifyContent: 'center', alignItems: 'center', position: 'relative' },
  centerLabel: { position: 'absolute', alignItems: 'center' },
  centerValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  centerUnit: { fontSize: 10, color: COLORS.textSecondary },
  emptyText: { fontSize: 14, color: '#BDBDBD' },
  legend: { marginTop: 8, width: '100%' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
  legendVal: { fontSize: 12, fontWeight: '600', color: COLORS.text },
});
