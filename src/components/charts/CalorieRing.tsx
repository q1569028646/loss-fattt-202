import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';
import { calculatePercentage } from '../../utils/formatters';
import Svg, { Circle } from 'react-native-svg';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieRing({ consumed, target, size = 180, strokeWidth = 14 }: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = calculatePercentage(consumed, target);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const remaining = Math.max(target - consumed, 0);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E8F5E9"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.consumed}>{Math.round(consumed)}</Text>
        <Text style={styles.label}>已摄入 kcal</Text>
        <Text style={styles.remaining}>剩余 {Math.round(remaining)} kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  textContainer: {
    alignItems: 'center',
  },
  consumed: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  remaining: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 4,
    fontWeight: '500',
  },
});
