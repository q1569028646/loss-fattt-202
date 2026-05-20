import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

export type InputMethod = 'ai_photo' | 'search' | 'nutrition_label' | 'manual';

const METHODS: { key: InputMethod; icon: string; label: string; desc: string }[] = [
  { key: 'ai_photo', icon: '📷', label: 'AI拍照识别', desc: '拍照自动识别食物营养' },
  { key: 'search', icon: '📖', label: '食物库搜索', desc: '搜索1657+种食材' },
  { key: 'nutrition_label', icon: '📋', label: '营养标签识别', desc: '扫描营养成分表' },
  { key: 'manual', icon: '📝', label: '手动录入', desc: '自行输入食物信息' },
];

interface InputMethodSelectorProps {
  onSelect: (method: InputMethod) => void;
}

export function InputMethodSelector({ onSelect }: InputMethodSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>选择录入方式</Text>
      <View style={styles.grid}>
        {METHODS.map(method => (
          <TouchableOpacity
            key={method.key}
            style={styles.methodCard}
            onPress={() => onSelect(method.key)}
            activeOpacity={0.7}
          >
            <Text style={styles.methodIcon}>{method.icon}</Text>
            <Text style={styles.methodLabel}>{method.label}</Text>
            <Text style={styles.methodDesc}>{method.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  methodIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
