import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { COLORS } from '../../utils/constants';
import { calculatePercentage } from '../../utils/formatters';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: string;
}

export function MacroBar({ label, current, target, unit = 'g', color }: MacroBarProps) {
  const percentage = calculatePercentage(current, target);
  const clampedPct = Math.max(0.01, percentage / 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(current)}/{Math.round(target)}{unit}
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ now: Math.round(percentage), min: 0, max: 100 }}
        accessibilityLabel={`${label} ${Math.round(current)}/${Math.round(target)}${unit}`}
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <View style={[styles.fill, { transform: [{ scaleX: clampedPct }], backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    width: '100%',
    borderRadius: 4,
    ...Platform.select({
      ios: { transformOrigin: 'left' },
      android: { transformOrigin: 'left' },
      web: {},
    }),
  },
});
