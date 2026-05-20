import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');
const CHART_W = width - 64;
const CHART_H = 160;
const PADDING = { top: 12, right: 16, bottom: 30, left: 40 };
const PLOT_W = CHART_W - PADDING.left - PADDING.right;
const PLOT_H = CHART_H - PADDING.top - PADDING.bottom;

interface NutrientPoint {
  date: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutrientTrendChartProps {
  data: NutrientPoint[];
  proteinTarget: number;
  carbsTarget?: number;
  fatTarget?: number;
  days?: number;
}

export function NutrientTrendChart({ data, proteinTarget, carbsTarget, fatTarget, days = 7 }: NutrientTrendChartProps) {
  if (data.length === 0) return null;

  const chartData = data.slice(-days);
  const maxVal = Math.max(
    proteinTarget * 1.2,
    (carbsTarget || proteinTarget * 2) * 1.2,
    (fatTarget || proteinTarget) * 1.2,
    ...chartData.map(d => Math.max(d.protein, d.carbs, d.fat))
  );
  const barCount = chartData.length;
  const groupWidth = PLOT_W / barCount;
  const barWidth = Math.max(4, (groupWidth - 6) / 3);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🥩 营养素趋势</Text>
      
      {/* 图例 */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.protein }]} />
          <Text style={styles.legendText}>蛋白质</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.carbs }]} />
          <Text style={styles.legendText}>碳水</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.fat }]} />
          <Text style={styles.legendText}>脂肪</Text>
        </View>
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {chartData.map((d, i) => {
          const groupX = PADDING.left + groupWidth * i;
          const bars = [
            { val: d.protein, color: COLORS.protein },
            { val: d.carbs, color: COLORS.carbs },
            { val: d.fat, color: COLORS.fat },
          ];

          return (
            <G key={i}>
              {bars.map((bar, j) => {
                const h = (bar.val / maxVal) * PLOT_H;
                const x = groupX + j * (barWidth + 2) + 2;
                const y = PADDING.top + PLOT_H - Math.max(1, h);
                return (
                  <Rect
                    key={j}
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(1, h)}
                    rx={2}
                    fill={bar.color}
                    opacity={0.85}
                  />
                );
              })}
              <SvgText
                x={groupX + groupWidth / 2}
                y={CHART_H - 8}
                fill={COLORS.textSecondary}
                fontSize={8}
                textAnchor="middle"
              >
                {d.date.slice(5)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.text, paddingHorizontal: 16, marginBottom: 8 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
});
