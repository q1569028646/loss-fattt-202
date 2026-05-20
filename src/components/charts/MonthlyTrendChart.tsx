import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../utils/constants';

interface PointData {
  dateKey: string;
  label: string;
  calories: number;
}

interface MonthlyTrendChartProps {
  data: PointData[];
  targetCalories?: number;
}

export function MonthlyTrendChart({ data, targetCalories = 2000 }: MonthlyTrendChartProps) {
  const chartWidth = 320;
  const chartHeight = 160;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 24;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const validData = data.filter(d => d.calories > 0);
  if (validData.length === 0) {
    return (
      <View style={styles.empty}>
        <SvgText fontSize={13} fill="#BDBDBD" x={chartWidth / 2} y={chartHeight / 2} textAnchor="middle">暂无数据</SvgText>
      </View>
    );
  }

  const maxCal = Math.max(targetCalories, ...validData.map(d => d.calories), 500);
  const niceMax = Math.ceil(maxCal / 500) * 500;
  const yLines = 4;
  const yStep = niceMax / yLines;

  const getX = (i: number) => paddingLeft + (plotWidth / Math.max(data.length - 1, 1)) * i;
  const getY = (cal: number) => paddingTop + plotHeight * (1 - cal / niceMax);

  const points = data
    .map((d, i) => {
      if (d.calories <= 0) return null;
      return { x: getX(i), y: getY(d.calories), cal: d.calories, i };
    })
    .filter(Boolean) as { x: number; y: number; cal: number; i: number }[];

  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
      linePath += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }

  let areaPath = '';
  if (points.length > 0) {
    areaPath = linePath + ` L ${points[points.length - 1].x} ${paddingTop + plotHeight} L ${points[0].x} ${paddingTop + plotHeight} Z`;
  }

  const maxPoint = points.reduce((a, b) => a.cal > b.cal ? a : b, points[0]);
  const minPoint = points.reduce((a, b) => a.cal < b.cal ? a : b, points[0]);

  const xLabelInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={chartHeight}>
        {Array.from({ length: yLines + 1 }, (_, i) => {
          const y = paddingTop + (plotHeight / yLines) * i;
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
            y1={getY(targetCalories)}
            x2={chartWidth - paddingRight}
            y2={getY(targetCalories)}
            stroke={COLORS.primary}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.4}
          />
        )}

        {areaPath && <Path d={areaPath} fill={COLORS.primary + '15'} />}

        {linePath && <Path d={linePath} fill="none" stroke={COLORS.primary} strokeWidth={2} />}

        {points.map((p, idx) => (
          <Circle key={`dot_${idx}`} cx={p.x} cy={p.y} r={2.5} fill={COLORS.primary} />
        ))}

        {points.length > 1 && maxPoint && (
          <>
            <Circle cx={maxPoint.x} cy={maxPoint.y} r={4} fill={COLORS.fat} stroke="#FFFFFF" strokeWidth={1.5} />
            <SvgText x={maxPoint.x} y={maxPoint.y - 8} textAnchor="middle" fontSize={9} fill={COLORS.fat} fontWeight="600">{maxPoint.cal}</SvgText>
          </>
        )}

        {points.length > 1 && minPoint && minPoint.i !== maxPoint.i && (
          <>
            <Circle cx={minPoint.x} cy={minPoint.y} r={4} fill={COLORS.protein} stroke="#FFFFFF" strokeWidth={1.5} />
            <SvgText x={minPoint.x} y={minPoint.y + 16} textAnchor="middle" fontSize={9} fill={COLORS.protein} fontWeight="600">{minPoint.cal}</SvgText>
          </>
        )}

        {data.map((d, i) => {
          if (i % xLabelInterval !== 0 && i !== data.length - 1) return null;
          const x = getX(i);
          return (
            <SvgText key={`xlabel_${i}`} x={x} y={chartHeight - 4} textAnchor="middle" fontSize={9} fill="#BDBDBD">
              {d.label}
            </SvgText>
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
  },
});
