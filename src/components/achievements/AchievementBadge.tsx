import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';
import type { Achievement } from '../../stores/achievementStore';

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const { icon, name, description, unlocked, progress } = achievement;

  return (
    <View style={[styles.card, !unlocked && styles.cardLocked]}>
      <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{icon}</Text>
      <Text style={[styles.name, !unlocked && styles.nameLocked]}>{name}</Text>
      <Text style={styles.desc}>{description}</Text>
      {unlocked ? (
        <Text style={styles.unlockedLabel}>🟢 已解锁</Text>
      ) : (
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { flex: progress }]} />
            <View style={{ flex: 1 - progress }} />
          </View>
          <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    width: 100,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  cardLocked: {
    borderColor: '#F0F0F0',
    opacity: 0.7,
  },
  icon: {
    fontSize: 32,
    marginBottom: 4,
  },
  iconLocked: {
    opacity: 0.4,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  nameLocked: {
    color: '#BDBDBD',
  },
  desc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  unlockedLabel: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
