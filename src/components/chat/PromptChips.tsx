import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

interface PromptChipProps {
  label: string;
  onPress: () => void;
}

export function PromptChip({ label, onPress }: PromptChipProps) {
  return (
    <TouchableOpacity style={styles.chip} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

interface PromptChipsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
}

export function PromptChips({ prompts, onSelect }: PromptChipsProps) {
  return (
    <View style={styles.container}>
      {prompts.map((prompt, index) => (
        <PromptChip key={index} label={prompt} onPress={() => onSelect(prompt)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '500',
  },
});
