import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');
const CHART_W = width - 64;
const CHART_H = 180;
const PADDING = { top: 20, right: 16, bottom: 30, left: 40 };
const PLOT_W = CHART_W - PADDING.left - PADDING.right;
const PLOT_H = CHART_H - PADDING.top - PADDING.bottom;

interface DataPoint {
  date: string;
  calories: number;
}

interface CalorieTrendChartProps {
  data: DataPoint[];
  target: number;
  days?: number;
}

export function CalorieTrendChart({ data, target, days = 7 }: CalorieTrendChartProps) {
  if (data.length === 0) return null;

  const chartData = data.slice(-days);
  const maxVal = Math.max(target, ...chartData.map(d => d.calories)) * 1.15;
  const barCount = chartData.length;
  const barWidth = Math.max(8, Math.min(28, (PLOT_W - barCount * 4) / barCount));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 热量趋势</Text>
        <Text style={styles.subtitle}>近{days}天</Text>
      </View>
      <Svg width={CHART_W} height={CHART_H}>
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = PADDING.top + PLOT_H * (1 - ratio);
          const val = Math.round(maxVal * ratio);
          return (
            <G key={ratio}>
              <Line x1={PADDING.left} y1={y} x2={CHART_W - PADDING.right} y2={y} stroke="#F0F0F0" strokeWidth={1} />
              <SvgText x={PADDING.left - 6} y={y + 4} fill={COLORS.textSecondary} fontSize={10} textAnchor="end">
                {val}
              </SvgText>
            </G>
          );
        })}

        {/* 目标线 */}
        {target > 0 && (() => {
          const targetY = PADDING.top + PLOT_H * (1 - target / maxVal);
          return (
            <G>
              <Line x1={PADDING.left} y1={targetY} x2={CHART_W - PADDING.right} y2={targetY} stroke={COLORS.accent} strokeWidth={1.5} strokeDasharray="4,4" />
              <SvgText x={CHART_W - PADDING.right - 4} y={targetY - 6} fill={COLORS.accent} fontSize={10} textAnchor="end">
                目标
              </SvgText>
            </G>
          );
        })()}

        {/* 柱状图 */}
        {chartData.map((d, i) => {
          const x = PADDING.left + (PLOT_W / barCount) * i + (PLOT_W / barCount - barWidth) / 2;
          const barH = (d.calories / maxVal) * PLOT_H;
          const y = PADDING.top + PLOT_H - barH;
          const isOver = d.calories > target;
          return (
            <G key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(2, barH)}
                rx={3}
                fill={isOver ? COLORS.error : COLORS.primary}
                opacity={0.8}
              />
              <SvgText
                x={x + barWidth / 2}
                y={CHART_H - 6}
                fill={COLORS.textSecondary}
                fontSize={9}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
});
