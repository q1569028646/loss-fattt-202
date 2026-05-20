import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { lightTheme as theme } from '../../utils/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** 是否有内边距 */
  padded?: boolean;
  /** 圆角大小 */
  radius?: number;
}

export function Card({ children, style, padded = true, radius = 16 }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        { borderRadius: radius },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  padded: {
    padding: 16,
  },
});
