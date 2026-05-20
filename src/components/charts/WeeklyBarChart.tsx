import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

interface BarData {
  dateKey: string;
  label: string;
  calories: number;
  protein: number;
}

interface WeeklyBarChartProps {
  data: BarData[];
  targetCalories?: number;
}

export function WeeklyBarChart({ data, targetCalories = 2000 }: WeeklyBarChartProps) {
  const chartWidth = 320;
  const chartHeight = 140;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 24;
  const barAreaWidth = chartWidth - paddingLeft - paddingRight;
  const barAreaHeight = chartHeight - paddingTop - paddingBottom;

  const maxCal = Math.max(targetCalories, ...data.map(d => d.calories), 500);
  const niceMax = Math.ceil(maxCal / 500) * 500;
  const barWidth = barAreaWidth / data.length * 0.55;
  const barGap = barAreaWidth / data.length;

  const yLines = 4;
  const yStep = niceMax / yLines;

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        {Array.from({ length: yLines + 1 }, (_, i) => {
          const y = paddingTop + (barAreaHeight / yLines) * i;
          const val = Math.round(niceMax - yStep * i);
          return (
            <React.Fragment key={`grid_${i}`}>
              <Line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#F0F0F0" strokeWidth={1} />
              <SvgText x={paddingLeft - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#BDBDBD">{val}</SvgText>
            </React.Fragment>
          );
        })}

        {targetCalories > 0 && targetCalories <= niceMax && (
          <Line
            x1={paddingLeft}
            y1={paddingTop + barAreaHeight * (1 - targetCalories / niceMax)}
            x2={chartWidth - paddingRight}
            y2={paddingTop + barAreaHeight * (1 - targetCalories / niceMax)}
            stroke={COLORS.primary}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        )}

        {data.map((d, i) => {
          const x = paddingLeft + barGap * i + (barGap - barWidth) / 2;
          const barHeight = d.calories > 0 ? (d.calories / niceMax) * barAreaHeight : 0;
          const y = paddingTop + barAreaHeight - barHeight;
          const proteinHeight = d.protein > 0 && d.calories > 0 ? (d.protein / niceMax) * barAreaHeight : 0;
          const isToday = d.dateKey === todayKey;
          const fillColor = isToday ? COLORS.primary : COLORS.primary + '80';

          return (
            <React.Fragment key={`bar_${i}`}>
              {d.calories > 0 && (
                <>
                  <Rect x={x} y={y} width={barWidth} height={barHeight - proteinHeight} fill={fillColor} rx={3} ry={3} />
                  <Rect x={x} y={paddingTop + barAreaHeight - proteinHeight} width={barWidth} height={proteinHeight} fill={COLORS.protein + 'CC'} rx={0} ry={0} />
                  {isToday && (
                    <Rect x={x - 1} y={y - 1} width={barWidth + 2} height={barHeight + 2} fill="none" stroke={COLORS.primary} strokeWidth={1.5} rx={3} ry={3} />
                  )}
                </>
              )}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 4}
                textAnchor="middle"
                fontSize={10}
                fill={isToday ? COLORS.primary : '#BDBDBD'}
                fontWeight={isToday ? '700' : '400'}
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
