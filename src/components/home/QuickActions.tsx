import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { lightTheme as theme } from '../../utils/theme';
import { hapticLight } from '../../utils/haptics';

interface QuickAction {
  icon: string;
  label: string;
  onPress: () => void;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <View style={styles.container}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.item}
          onPress={() => {
            hapticLight();
            action.onPress();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>{action.icon}</Text>
          </View>
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
});
