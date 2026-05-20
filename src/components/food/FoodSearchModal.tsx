import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, ScrollView, Alert } from 'react-native';
import { COLORS, MEAL_LABELS } from '../../utils/constants';
import { searchFoods, FOOD_CATEGORIES, FoodDBItem, loadCustomFoods, addCustomFood, updateCustomFood, deleteCustomFood, CustomFoodInput, isCustomFoodId } from '../../data/foods';
import type { MealType } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (food: FoodDBItem, meal: MealType, grams: number) => void;
  selectedMeal: MealType;
}

export function FoodSearchModal({ visible, onClose, onSelect, selectedMeal }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [grams, setGrams] = useState(100);
  const [customGrams, setCustomGrams] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodDBItem | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const [customFoods, setCustomFoods] = useState<FoodDBItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodDBItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('主食');
  const [formCalories, setFormCalories] = useState('');
  const [formProtein, setFormProtein] = useState('');
  const [formCarbs, setFormCarbs] = useState('');
  const [formFat, setFormFat] = useState('');

  useEffect(() => {
    if (visible) {
      loadCustomFoods().then(setCustomFoods);
    }
  }, [visible]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const dbResults = searchFoods(debouncedQuery, category, 20);

  const results = useMemo((): FoodDBItem[] => {
    const q = debouncedQuery.trim().toLowerCase();
    let customFiltered = customFoods;
    if (category) customFiltered = customFiltered.filter(f => f.category === category);
    if (q) customFiltered = customFiltered.filter(f => f.name.toLowerCase().includes(q));
    const merged = [...customFiltered];
    const existingIds = new Set(merged.map(f => f.id));
    for (const item of dbResults) {
      if (!existingIds.has(item.id)) merged.push(item);
    }
    return merged.slice(0, 20);
  }, [customFoods, dbResults, debouncedQuery, category]);

  const handleSelect = useCallback((food: FoodDBItem) => {
    setSelectedFood(food);
    setGrams(food.serving_size_grams);
    setCustomGrams('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (selectedFood) {
      await onSelect(selectedFood, selectedMeal, grams);
      setSelectedFood(null);
      setGrams(100);
      setCustomGrams('');
    }
  }, [selectedFood, selectedMeal, grams, onSelect]);

  const handleClose = useCallback(() => {
    setSelectedFood(null);
    setQuery('');
    setDebouncedQuery('');
    setCategory(undefined);
    setGrams(100);
    setCustomGrams('');
    onClose();
  }, [onClose]);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const GRAM_PRESETS = [50, 100, 150, 200, 300];

  const handleGramPreset = useCallback((g: number) => {
    setGrams(g);
    setCustomGrams('');
  }, []);

  const handleCustomGramChange = useCallback((text: string) => {
    setCustomGrams(text);
    const parsed = parseFloat(text);
    if (!isNaN(parsed) && parsed > 0) {
      setGrams(parsed);
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormName('');
    setFormCategory('主食');
    setFormCalories('');
    setFormProtein('');
    setFormCarbs('');
    setFormFat('');
  }, []);

  const openEditForm = useCallback((food: FoodDBItem) => {
    setEditingFood(food);
    setFormName(food.name);
    setFormCategory(food.category);
    setFormCalories(String(food.nutrients.calories_kcal));
    setFormProtein(String(food.nutrients.protein_g));
    setFormCarbs(String(food.nutrients.carbs_g));
    setFormFat(String(food.nutrients.fat_g));
    setShowAddForm(true);
  }, []);

  const openAddForm = useCallback(() => {
    setEditingFood(null);
    resetForm();
    setShowAddForm(true);
  }, [resetForm]);

  const handleSaveForm = useCallback(async () => {
    if (!formName.trim()) {
      Alert.alert('提示', '请输入食物名称');
      return;
    }
    const kcal = parseFloat(formCalories);
    if (isNaN(kcal)) {
      Alert.alert('提示', '请填写热量');
      return;
    }
    const input: CustomFoodInput = {
      name: formName.trim(),
      category: formCategory,
      calories_kcal: kcal,
      protein_g: parseFloat(formProtein) || 0,
      carbs_g: parseFloat(formCarbs) || 0,
      fat_g: parseFloat(formFat) || 0,
    };

    if (editingFood) {
      const updated = await updateCustomFood(editingFood.id, input);
      setCustomFoods(prev => prev.map(f => f.id === editingFood.id ? updated : f));
      if (selectedFood?.id === editingFood.id) {
        setSelectedFood(updated);
      }
      Alert.alert('已更新', `${input.name} 已更新`);
    } else {
      const newFood = await addCustomFood(input);
      setCustomFoods(prev => [...prev, newFood]);
      setDebouncedQuery(formName.trim());
      setQuery(formName.trim());
      Alert.alert('已保存', `${input.name} 已添加到食物库`);
    }

    setShowAddForm(false);
    setEditingFood(null);
    resetForm();
  }, [formName, formCategory, formCalories, formProtein, formCarbs, formFat, editingFood, selectedFood, resetForm]);

  const handleDeleteFood = useCallback((food: FoodDBItem) => {
    Alert.alert(
      '确认删除',
      `确定要删除"${food.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deleteCustomFood(food.id);
            setCustomFoods(prev => prev.filter(f => f.id !== food.id));
            if (selectedFood?.id === food.id) {
              setSelectedFood(null);
            }
            Alert.alert('已删除', `"${food.name}" 已从食物库删除`);
          },
        },
      ]
    );
  }, [selectedFood]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📖 食物库</Text>
            <TouchableOpacity onPress={handleClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="搜索食物名称..."
              placeholderTextColor="#BDBDBD"
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>

          <TouchableOpacity style={styles.addCustomBtn} onPress={openAddForm}>
            <Text style={styles.addCustomBtnIcon}>✚</Text>
            <Text style={styles.addCustomBtnText}>添加自定义食物</Text>
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
            <TouchableOpacity
              style={[styles.catChip, !category && styles.catChipActive]}
              onPress={() => setCategory(undefined)}
            >
              <Text style={[styles.catChipText, !category && styles.catChipTextActive]}>全部</Text>
            </TouchableOpacity>
            {FOOD_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(category === cat ? undefined : cat)}
              >
                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionDivider} />
        </View>

        {selectedFood ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedName}>{selectedFood.name}</Text>
                <Text style={styles.selectedDesc}>{selectedFood.category}</Text>
              </View>
              <View style={styles.selectedActions}>
                {isCustomFoodId(selectedFood.id) && (
                  <>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditForm(selectedFood)}>
                      <Text style={styles.iconBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteFood(selectedFood)}>
                      <Text style={styles.iconBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={() => setSelectedFood(null)}><Text style={styles.deselectBtn}>✕</Text></TouchableOpacity>
              </View>
            </View>
            <View style={styles.nutrientRow}>
              <View style={styles.nutrientBox}><Text style={styles.nutrientVal}>{Math.round(selectedFood.nutrients.calories_kcal * grams / selectedFood.serving_size_grams)}</Text><Text style={styles.nutrientLbl}>kcal</Text></View>
              <View style={styles.nutrientBox}><Text style={[styles.nutrientVal, { color: COLORS.protein }]}>{(selectedFood.nutrients.protein_g * grams / selectedFood.serving_size_grams).toFixed(1)}</Text><Text style={styles.nutrientLbl}>蛋白质g</Text></View>
              <View style={styles.nutrientBox}><Text style={[styles.nutrientVal, { color: COLORS.carbs }]}>{(selectedFood.nutrients.carbs_g * grams / selectedFood.serving_size_grams).toFixed(1)}</Text><Text style={styles.nutrientLbl}>碳水g</Text></View>
              <View style={styles.nutrientBox}><Text style={[styles.nutrientVal, { color: COLORS.fat }]}>{(selectedFood.nutrients.fat_g * grams / selectedFood.serving_size_grams).toFixed(1)}</Text><Text style={styles.nutrientLbl}>脂肪g</Text></View>
            </View>
            <View style={styles.gramsSection}>
              <Text style={styles.gramsLabel}>克数</Text>
              <View style={styles.gramPresets}>
                {GRAM_PRESETS.map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.gramChip, grams === g && !customGrams && styles.gramChipActive]}
                    onPress={() => handleGramPreset(g)}
                  >
                    <Text style={[styles.gramChipText, grams === g && !customGrams && styles.gramChipTextActive]}>{g}g</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.customGramRow}>
                <TextInput
                  style={styles.customGramInput}
                  value={customGrams}
                  onChangeText={handleCustomGramChange}
                  placeholder="自定义"
                  placeholderTextColor="#BDBDBD"
                  keyboardType="decimal-pad"
                />
                <Text style={styles.customGramUnit}>g</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>添加到{MEAL_LABELS[selectedMeal]} ({Math.round(grams)}g)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={results}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{query ? '没有找到匹配的食物' : customFoods.length > 0 ? '' : '输入关键词搜索食物'}</Text>
                <Text style={styles.emptyHint}>{query ? '试试搜其他关键词，或点上方"添加自定义食物"' : customFoods.length > 0 ? '' : '试试搜"米饭"、"鸡胸"、"番茄"等'}</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.resultItemWrapper}>
                <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                  <View style={styles.resultInfo}>
                    <View style={styles.resultNameRow}>
                      <Text style={styles.resultName}>{item.name}</Text>
                      {isCustomFoodId(item.id) && <View style={styles.customBadge}><Text style={styles.customBadgeText}>自定义</Text></View>}
                    </View>
                    <Text style={styles.resultDesc}>{item.serving_description} · {item.category}</Text>
                  </View>
                  <Text style={styles.resultCal}>{item.nutrients.calories_kcal} kcal</Text>
                </TouchableOpacity>
                {isCustomFoodId(item.id) && (
                  <View style={styles.resultActions}>
                    <TouchableOpacity style={styles.resultActionBtn} onPress={() => openEditForm(item)}>
                      <Text style={styles.resultActionText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resultActionBtn} onPress={() => handleDeleteFood(item)}>
                      <Text style={styles.resultActionText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )}
        {results.length > 0 && !selectedFood && (
          <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop}>
            <Text style={styles.scrollTopBtnText}>↑</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showAddForm} transparent animationType="fade" onRequestClose={() => { setShowAddForm(false); setEditingFood(null); resetForm(); }}>
        <View style={styles.formOverlay}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{editingFood ? '✏️ 编辑食物' : '✚ 添加自定义食物'}</Text>

            <Text style={styles.formLabel}>食物名称</Text>
            <TextInput style={styles.formInput} value={formName} onChangeText={setFormName} placeholder="例：我的自制鸡胸肉" placeholderTextColor="#BDBDBD" />

            <Text style={styles.formLabel}>分类</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formCategoryRow}>
              {FOOD_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.formCatChip, formCategory === cat && styles.formCatChipActive]}
                  onPress={() => setFormCategory(cat)}
                >
                  <Text style={[styles.formCatChipText, formCategory === cat && styles.formCatChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.formLabel}>每100g 营养值</Text>
            <View style={styles.formNutrientRow}>
              <View style={styles.formNutrientItem}>
                <Text style={styles.formNutrientLabel}>热量</Text>
                <TextInput style={styles.formNutrientInput} value={formCalories} onChangeText={setFormCalories} placeholder="0" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
                <Text style={styles.formNutrientUnit}>kcal</Text>
              </View>
              <View style={styles.formNutrientItem}>
                <Text style={[styles.formNutrientLabel, { color: COLORS.protein }]}>蛋白质</Text>
                <TextInput style={styles.formNutrientInput} value={formProtein} onChangeText={setFormProtein} placeholder="0" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
                <Text style={styles.formNutrientUnit}>g</Text>
              </View>
              <View style={styles.formNutrientItem}>
                <Text style={[styles.formNutrientLabel, { color: COLORS.carbs }]}>碳水</Text>
                <TextInput style={styles.formNutrientInput} value={formCarbs} onChangeText={setFormCarbs} placeholder="0" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
                <Text style={styles.formNutrientUnit}>g</Text>
              </View>
              <View style={styles.formNutrientItem}>
                <Text style={[styles.formNutrientLabel, { color: COLORS.fat }]}>脂肪</Text>
                <TextInput style={styles.formNutrientInput} value={formFat} onChangeText={setFormFat} placeholder="0" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
                <Text style={styles.formNutrientUnit}>g</Text>
              </View>
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.formCancelBtn} onPress={() => { setShowAddForm(false); setEditingFood(null); resetForm(); }}>
                <Text style={styles.formCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formSaveBtn} onPress={handleSaveForm}>
                <Text style={styles.formSaveText}>{editingFood ? '保存修改' : '保存到食物库'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  topSection: { backgroundColor: '#FAFAFA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  closeBtn: { fontSize: 22, color: COLORS.textSecondary, padding: 4 },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: '#E0E0E0' },
  addCustomBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#C8E6C9', borderStyle: 'dashed' },
  addCustomBtnIcon: { fontSize: 16, color: COLORS.primary, marginRight: 6, fontWeight: '700' },
  addCustomBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  categoryRow: { paddingHorizontal: 16, marginBottom: 6, maxHeight: 40 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 6 },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  catChipTextActive: { color: '#FFFFFF' },
  sectionDivider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 20, marginBottom: 8 },
  listContent: { paddingTop: 8 },
  resultItemWrapper: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5', backgroundColor: '#FFFFFF' },
  resultItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: '500', color: COLORS.text },
  resultDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  resultCal: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginLeft: 12 },
  resultActions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8, justifyContent: 'flex-end' },
  resultActionBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F5F5F5' },
  resultActionText: { fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: COLORS.textSecondary },
  emptyHint: { fontSize: 13, color: '#BDBDBD', marginTop: 8 },
  selectedCard: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.primaryLight },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  selectedInfo: { flex: 1 },
  selectedName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  selectedDesc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  selectedActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 4 },
  iconBtnText: { fontSize: 16 },
  deselectBtn: { fontSize: 18, color: '#BDBDBD', padding: 4 },
  nutrientRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  nutrientBox: { alignItems: 'center' },
  nutrientVal: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  nutrientLbl: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  servingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  servingsLabel: { fontSize: 14, color: COLORS.textSecondary, marginRight: 12 },
  servingsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  servingsBtnText: { fontSize: 20, color: COLORS.text, fontWeight: '600' },
  servingsValue: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginHorizontal: 16, minWidth: 40, textAlign: 'center' },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  gramsSection: { marginBottom: 16 },
  gramsLabel: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 8 },
  gramPresets: { flexDirection: 'row', marginBottom: 10, gap: 6 },
  gramChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, backgroundColor: '#F0F0F0' },
  gramChipActive: { backgroundColor: COLORS.primary },
  gramChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  gramChipTextActive: { color: '#FFFFFF' },
  customGramRow: { flexDirection: 'row', alignItems: 'center' },
  customGramInput: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: COLORS.text, width: 80, textAlign: 'center' },
  customGramUnit: { fontSize: 14, color: COLORS.textSecondary, marginLeft: 6 },
  resultNameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  customBadge: { backgroundColor: '#E8F5E9', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6 },
  customBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  formOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginHorizontal: 24, width: '85%', maxWidth: 400 },
  formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 12 },
  formInput: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text },
  formCategoryRow: { flexDirection: 'row', maxHeight: 36 },
  formCatChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#F0F0F0', marginRight: 6 },
  formCatChipActive: { backgroundColor: COLORS.primary },
  formCatChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  formCatChipTextActive: { color: '#FFFFFF' },
  formNutrientRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  formNutrientItem: { width: '23%', alignItems: 'center' },
  formNutrientLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  formNutrientInput: { backgroundColor: '#F5F5F5', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4, fontSize: 14, fontWeight: '600', color: COLORS.text, textAlign: 'center', width: '100%' },
  formNutrientUnit: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  formCancelBtn: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  formCancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '500' },
  formSaveBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  formSaveText: { fontSize: 15, color: '#FFFFFF', fontWeight: '600' },
  scrollTopBtn: { position: 'absolute', bottom: 24, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  scrollTopBtnText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: -2 },
});
