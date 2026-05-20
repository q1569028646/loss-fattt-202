import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { COLORS, MEAL_LABELS } from '../../utils/constants';
import type { NutritionLabelResult, MealType } from '../../types';
import { addCustomFood } from '../../data/foods';

interface NutritionLabelResultCardProps {
  result: NutritionLabelResult;
  mealType: MealType;
  saving?: boolean;
  onSave: (labelResult: NutritionLabelResult, gramsConsumed: number) => void;
  onCancel: () => void;
}

export function NutritionLabelResultCard({ result, mealType, saving = false, onSave, onCancel }: NutritionLabelResultCardProps) {
  const [gramsInput, setGramsInput] = useState('');
  const [savingToLib, setSavingToLib] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<NutritionLabelResult>({ ...result });

  const ratio = useMemo(() => {
    const grams = parseFloat(gramsInput);
    if (isNaN(grams) || grams <= 0 || result.serving_base_grams <= 0) return 0;
    return grams / result.serving_base_grams;
  }, [gramsInput, result.serving_base_grams]);

  const adjusted = useMemo(() => {
    if (ratio <= 0) return null;
    const src = editing ? editData : result;
    return {
      energy_kj: Math.round(src.energy_kj * ratio * 10) / 10,
      energy_kcal: Math.round(src.energy_kcal * ratio * 10) / 10,
      protein_g: Math.round(src.protein_g * ratio * 10) / 10,
      fat_g: Math.round(src.fat_g * ratio * 10) / 10,
      carbs_g: Math.round(src.carbs_g * ratio * 10) / 10,
      fiber_g: Math.round(src.fiber_g * ratio * 10) / 10,
      sugar_g: Math.round(src.sugar_g * ratio * 10) / 10,
      sodium_mg: Math.round(src.sodium_mg * ratio),
      cholesterol_mg: Math.round(src.cholesterol_mg * ratio),
      saturated_fat_g: Math.round(src.saturated_fat_g * ratio * 10) / 10,
      trans_fat_g: Math.round(src.trans_fat_g * ratio * 10) / 10,
    };
  }, [ratio, result, editData, editing]);

  const displayData = editing ? editData : result;

  const rows = [
    { key: 'energy_kj', label: '能量', value: `${displayData.energy_kj} kJ`, adjValue: adjusted ? `${adjusted.energy_kj} kJ` : null, highlight: true },
    { key: 'energy_kcal', label: '能量(大卡)', value: `${displayData.energy_kcal} kcal`, adjValue: adjusted ? `${adjusted.energy_kcal} kcal` : null, highlight: true },
    { key: 'protein_g', label: '蛋白质', value: `${displayData.protein_g} g`, adjValue: adjusted ? `${adjusted.protein_g} g` : null, color: COLORS.protein },
    { key: 'fat_g', label: '脂肪', value: `${displayData.fat_g} g`, adjValue: adjusted ? `${adjusted.fat_g} g` : null, color: COLORS.fat },
    { key: 'carbs_g', label: '碳水化合物', value: `${displayData.carbs_g} g`, adjValue: adjusted ? `${adjusted.carbs_g} g` : null, color: COLORS.carbs },
    { key: 'fiber_g', label: '膳食纤维', value: `${displayData.fiber_g} g`, adjValue: adjusted ? `${adjusted.fiber_g} g` : null },
    { key: 'sugar_g', label: '糖', value: `${displayData.sugar_g} g`, adjValue: adjusted ? `${adjusted.sugar_g} g` : null },
    { key: 'sodium_mg', label: '钠', value: `${displayData.sodium_mg} mg`, adjValue: adjusted ? `${adjusted.sodium_mg} mg` : null },
  ];

  if (displayData.cholesterol_mg > 0 || editing) {
    rows.push({ key: 'cholesterol_mg', label: '胆固醇', value: `${displayData.cholesterol_mg} mg`, adjValue: adjusted ? `${adjusted.cholesterol_mg} mg` : null });
  }
  if (displayData.saturated_fat_g > 0 || editing) {
    rows.push({ key: 'saturated_fat_g', label: '饱和脂肪', value: `${displayData.saturated_fat_g} g`, adjValue: adjusted ? `${adjusted.saturated_fat_g} g` : null });
  }
  if (displayData.trans_fat_g > 0 || editing) {
    rows.push({ key: 'trans_fat_g', label: '反式脂肪', value: `${displayData.trans_fat_g} g`, adjValue: adjusted ? `${adjusted.trans_fat_g} g` : null });
  }

  const handleSave = () => {
    const grams = parseFloat(gramsInput);
    if (isNaN(grams) || grams <= 0) return;
    onSave(editing ? editData : result, grams);
  };

  const handleSaveToLibrary = async () => {
    setSavingToLib(true);
    try {
      const src = editing ? editData : result;
      const foodName = src.product_name && src.product_name !== '未知产品'
        ? src.product_name
        : '未命名食品';
      await addCustomFood({
        name: foodName,
        category: '零食',
        calories_kcal: src.energy_kcal,
        protein_g: src.protein_g,
        carbs_g: src.carbs_g,
        fat_g: src.fat_g,
      });
      Alert.alert('✅ 已保存', `"${foodName}" 已添加到食物库`, [{ text: '好的' }]);
    } catch (e: any) {
      Alert.alert('保存失败', e.message || '请稍后重试', [{ text: '好的' }]);
    } finally {
      setSavingToLib(false);
    }
  };

  const updateEditField = (key: keyof NutritionLabelResult, value: string) => {
    const num = parseFloat(value);
    setEditData(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  if (editing) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>✏️ 编辑营养数据</Text>
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={styles.editToggleText}>完成</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.editField}>
          <Text style={styles.editLabel}>产品名称</Text>
          <TextInput
            style={styles.editInput}
            value={editData.product_name}
            onChangeText={v => setEditData(prev => ({ ...prev, product_name: v }))}
            placeholder="产品名称"
            placeholderTextColor="#BDBDBD"
          />
        </View>

        <ScrollView style={styles.editScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.editGrid}>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>能量 (kJ)</Text>
              <TextInput style={styles.editInput} value={String(editData.energy_kj)} onChangeText={v => updateEditField('energy_kj', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>能量 (kcal)</Text>
              <TextInput style={styles.editInput} value={String(editData.energy_kcal)} onChangeText={v => updateEditField('energy_kcal', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: COLORS.protein }]}>蛋白质 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.protein_g)} onChangeText={v => updateEditField('protein_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: COLORS.fat }]}>脂肪 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.fat_g)} onChangeText={v => updateEditField('fat_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={[styles.editLabel, { color: COLORS.carbs }]}>碳水 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.carbs_g)} onChangeText={v => updateEditField('carbs_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>纤维 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.fiber_g)} onChangeText={v => updateEditField('fiber_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>糖 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.sugar_g)} onChangeText={v => updateEditField('sugar_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>钠 (mg)</Text>
              <TextInput style={styles.editInput} value={String(editData.sodium_mg)} onChangeText={v => updateEditField('sodium_mg', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>胆固醇 (mg)</Text>
              <TextInput style={styles.editInput} value={String(editData.cholesterol_mg)} onChangeText={v => updateEditField('cholesterol_mg', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>饱和脂肪 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.saturated_fat_g)} onChangeText={v => updateEditField('saturated_fat_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>反式脂肪 (g)</Text>
              <TextInput style={styles.editInput} value={String(editData.trans_fat_g)} onChangeText={v => updateEditField('trans_fat_g', v)} keyboardType="decimal-pad" />
            </View>
            <View style={styles.editField}>
              <Text style={styles.editLabel}>基准克数</Text>
              <TextInput style={styles.editInput} value={String(editData.serving_base_grams)} onChangeText={v => updateEditField('serving_base_grams', v)} keyboardType="decimal-pad" />
            </View>
          </View>
        </ScrollView>

        <View style={styles.gramsSection}>
          <Text style={styles.gramsLabel}>我吃了多少克？</Text>
          <View style={styles.gramsInputRow}>
            <TextInput
              style={styles.gramsInput}
              value={gramsInput}
              onChangeText={setGramsInput}
              placeholder="输入克数"
              placeholderTextColor="#BDBDBD"
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <Text style={styles.gramsUnit}>克</Text>
          </View>
          {adjusted && (
            <View style={styles.intakePreview}>
              <Text style={styles.intakeText}>
                实际摄入: <Text style={styles.intakeValue}>{adjusted.energy_kcal} kcal</Text>
                <Text style={styles.intakeSub}> ({adjusted.energy_kj} kJ)</Text>
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.libraryBtn, savingToLib && styles.libraryBtnDisabled]}
          onPress={handleSaveToLibrary}
          disabled={savingToLib}
        >
          <Text style={styles.libraryBtnText}>{savingToLib ? '保存中...' : '📚 记录到食物库'}</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, (!adjusted || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!adjusted || saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '保存中...' : `保存到${MEAL_LABELS[mealType]}`}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>📋 营养标签识别结果</Text>
        <TouchableOpacity onPress={() => { setEditData({ ...result }); setEditing(true); }}>
          <Text style={styles.editToggleText}>✏️ 编辑</Text>
        </TouchableOpacity>
      </View>

      {displayData.product_name && displayData.product_name !== '未知产品' && (
        <View style={styles.productRow}>
          <Text style={styles.productLabel}>产品</Text>
          <Text style={styles.productName}>{displayData.product_name}</Text>
        </View>
      )}

      <View style={styles.servingRow}>
        <Text style={styles.servingLabel}>标签基准: {displayData.serving_label || `每${displayData.serving_base_grams}g`}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>营养素</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellRight]}>标签值</Text>
          {adjusted && <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableCellRight]}>实际摄入</Text>}
        </View>
        {rows.map((row, i) => (
          <View key={row.key} style={[styles.tableRow, i % 2 === 0 && styles.tableRowEven]}>
            <Text style={[styles.tableCell, { color: row.color || COLORS.text }]}>{row.label}</Text>
            <Text style={[styles.tableCell, styles.tableCellRight, row.highlight && styles.valueHighlight]}>{row.value}</Text>
            {adjusted && row.adjValue && (
              <Text style={[styles.tableCell, styles.tableCellRight, { color: COLORS.primary, fontWeight: '700' }]}>{row.adjValue}</Text>
            )}
            {adjusted && !row.adjValue && <Text style={[styles.tableCell, styles.tableCellRight]}>—</Text>}
          </View>
        ))}
      </View>

      <View style={styles.gramsSection}>
        <Text style={styles.gramsLabel}>我吃了多少克？</Text>
        <View style={styles.gramsInputRow}>
          <TextInput
            style={styles.gramsInput}
            value={gramsInput}
            onChangeText={setGramsInput}
            placeholder="输入克数"
            placeholderTextColor="#BDBDBD"
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
          <Text style={styles.gramsUnit}>克</Text>
        </View>
        {adjusted && (
          <View style={styles.intakePreview}>
            <Text style={styles.intakeText}>
              实际摄入: <Text style={styles.intakeValue}>{adjusted.energy_kcal} kcal</Text>
              <Text style={styles.intakeSub}> ({adjusted.energy_kj} kJ)</Text>
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.libraryBtn, savingToLib && styles.libraryBtnDisabled]}
        onPress={handleSaveToLibrary}
        disabled={savingToLib}
      >
        <Text style={styles.libraryBtnText}>{savingToLib ? '保存中...' : '📚 记录到食物库'}</Text>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, (!adjusted || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!adjusted || saving}
        >
          <Text style={styles.saveBtnText}>{saving ? '保存中...' : `保存到${MEAL_LABELS[mealType]}`}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8F5E9',
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  editToggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    padding: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  productLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  servingRow: {
    marginBottom: 12,
  },
  servingLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  table: {
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#FAFAFA',
  },
  tableHeader: {
    backgroundColor: '#F5F5F5',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  tableCellRight: {
    textAlign: 'right',
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  valueHighlight: {
    fontWeight: '700',
    color: COLORS.text,
  },
  editScroll: {
    maxHeight: 280,
    marginBottom: 12,
  },
  editGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editField: {
    width: '47%',
    marginBottom: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  editInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  gramsSection: {
    marginBottom: 16,
  },
  gramsLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  gramsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  gramsInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    paddingVertical: 10,
  },
  gramsUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: 8,
  },
  intakePreview: {
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  intakeText: {
    fontSize: 16,
    color: COLORS.text,
  },
  intakeValue: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 20,
  },
  intakeSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  libraryBtn: {
    backgroundColor: '#FFF3E0',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  libraryBtnDisabled: {
    opacity: 0.6,
  },
  libraryBtnText: {
    color: '#E65100',
    fontSize: 15,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#C8E6C9',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
