import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, MEAL_LABELS } from '../../utils/constants';
import { formatCalories, formatGrams, getMealIcon } from '../../utils/formatters';
import type { FoodEntry } from '../../types';

interface FoodCardProps {
  entry: FoodEntry;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onPress?: (entry: FoodEntry) => void;
}

export function FoodCard({ entry, onDelete, onToggleFavorite, onPress }: FoodCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(entry)} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{getMealIcon(entry.mealType)}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{entry.name}</Text>
          <Text style={styles.mealLabel}>{MEAL_LABELS[entry.mealType] || entry.mealType}</Text>
        </View>
        <Text style={styles.serving}>
          {entry.servingSize}{entry.servingUnit}
        </Text>
        <View style={styles.macros}>
          <Text style={styles.macroItem}>{formatCalories(entry.calories)}</Text>
          <Text style={[styles.macroItem, { color: COLORS.protein }]}>P {formatGrams(entry.protein)}</Text>
          <Text style={[styles.macroItem, { color: COLORS.carbs }]}>C {formatGrams(entry.carbs)}</Text>
          <Text style={[styles.macroItem, { color: COLORS.fat }]}>F {formatGrams(entry.fat)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onToggleFavorite && (
          <TouchableOpacity style={styles.favButton} onPress={() => onToggleFavorite(entry.id)}>
            <Text style={styles.favText}>{entry.isFavorite ? '★' : '☆'}</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(entry.id)}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  mealLabel: {
    fontSize: 11,
    color: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  serving: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  macros: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favButton: {
    padding: 6,
  },
  favText: {
    fontSize: 18,
    color: '#FFC107',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
});
