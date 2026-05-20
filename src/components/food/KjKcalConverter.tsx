import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { COLORS } from '../../utils/constants';

interface KjKcalConverterProps {
  visible: boolean;
  onClose: () => void;
}

export function KjKcalConverter({ visible, onClose }: KjKcalConverterProps) {
  const [kjValue, setKjValue] = useState('');
  const [kcalValue, setKcalValue] = useState('');
  const [activeField, setActiveField] = useState<'kj' | 'kcal'>('kj');

  const handleKjChange = (text: string) => {
    setKjValue(text);
    setActiveField('kj');
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0) {
      setKcalValue(String(Math.round((num / 4.184) * 10) / 10));
    } else {
      setKcalValue('');
    }
  };

  const handleKcalChange = (text: string) => {
    setKcalValue(text);
    setActiveField('kcal');
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0) {
      setKjValue(String(Math.round(num * 4.184 * 10) / 10));
    } else {
      setKjValue('');
    }
  };

  const handleClose = () => {
    setKjValue('');
    setKcalValue('');
    setActiveField('kj');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>⚡ 千焦 ↔ 千卡 转换器</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.converterSection}>
            <Text style={styles.sectionLabel}>千焦 (kJ)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={kjValue}
                onChangeText={handleKjChange}
                placeholder="输入千焦值"
                placeholderTextColor="#BDBDBD"
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.unit}>kJ</Text>
            </View>
            <Text style={styles.arrow}>↓</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultValue, activeField === 'kj' && kcalValue ? styles.resultActive : styles.resultEmpty]}>
                {kcalValue || '—'}
              </Text>
              <Text style={styles.resultUnit}>kcal (大卡)</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.converterSection}>
            <Text style={styles.sectionLabel}>千卡 (kcal / 大卡)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={kcalValue}
                onChangeText={handleKcalChange}
                placeholder="输入千卡值"
                placeholderTextColor="#BDBDBD"
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.unit}>kcal</Text>
            </View>
            <Text style={styles.arrow}>↓</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultValue, activeField === 'kcal' && kjValue ? styles.resultActive : styles.resultEmpty]}>
                {kjValue || '—'}
              </Text>
              <Text style={styles.resultUnit}>kJ (千焦)</Text>
            </View>
          </View>

          <View style={styles.formulaRow}>
            <Text style={styles.formulaText}>公式: 1 kcal = 4.184 kJ</Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.doneButtonText}>关闭</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  converterSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 10,
  },
  unit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  arrow: {
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    marginVertical: 6,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7F0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  resultValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  resultActive: {
    color: COLORS.primary,
  },
  resultEmpty: {
    color: '#BDBDBD',
  },
  resultUnit: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  formulaRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  formulaText: {
    fontSize: 12,
    color: '#BDBDBD',
  },
  doneButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
