import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, MEAL_LABELS } from '../../utils/constants';
import { useFoodStore } from '../../stores/foodStore';
import { useAIProviderStore } from '../../stores/aiProviderStore';
import { FoodSearchModal } from '../../components/food/FoodSearchModal';
import { KjKcalConverter } from '../../components/food/KjKcalConverter';
import { NutritionLabelResultCard } from '../../components/food/NutritionLabelResult';
import { TextFoodInput } from '../../components/food/TextFoodInput';
import type { MealType, FoodEntry } from '../../types';
import { useImagePicker } from './hooks/useImagePicker';
import { useFoodAnalysis, EditableFoodField, MEALS, getConfidenceColor, getConfidenceLabel } from './hooks/useFoodAnalysis';
import { useOCRAnalysis } from './hooks/useOCRAnalysis';
import { useManualEntry } from './hooks/useManualEntry';

function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}

export default function AddFoodScreen() {
  const router = useRouter();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(getDefaultMealType);
  const [note, setNote] = useState('');
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showConverter, setShowConverter] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);

  const { addFoodEntry, getFavoriteFoods, getRecentFoods, copyYesterdayMeal } = useFoodStore();
  const { providers, activeProviderId } = useAIProviderStore();
  const activeProvider = providers.find(p => p.id === activeProviderId);
  const isWeb = Platform.OS === 'web';
  const hasApiKey = !!activeProvider?.apiKey;

  const favoriteFoods = getFavoriteFoods();
  const recentFoods = getRecentFoods(8);

  const imagePicker = useImagePicker();
  const foodAnalysis = useFoodAnalysis({
    selectedMeal,
    note,
    imagePicker,
    onNoteClear: () => setNote(''),
  });
  const ocrAnalysis = useOCRAnalysis({ selectedMeal, imagePicker });
  const manualEntry = useManualEntry({ selectedMeal, foodAnalysis });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <Text style={styles.title}>添加食物</Text>
          <TouchableOpacity style={styles.converterBtn} onPress={() => setShowConverter(true)} accessibilityRole="button">
            <Text style={styles.converterBtnIcon}>⚡</Text>
            <Text style={styles.converterBtnLabel}>kJ换算</Text>
          </TouchableOpacity>
        </View>

        {!hasApiKey && (
          <TouchableOpacity style={styles.apiKeyWarning} onPress={() => router.push('/(tabs)/settings')} accessibilityRole="button">
            <Text style={styles.apiKeyWarningText}>⚠️ 尚未配置API Key，AI拍照识别不可用。点击前往设置 →</Text>
          </TouchableOpacity>
        )}

        {isWeb && (
          <View style={styles.webNotice}>
            <Text style={styles.webNoticeText}>💡 浏览器端请使用"相册选择"上传图片，拍照功能仅在手机App中可用</Text>
          </View>
        )}

        <View style={styles.mealSelector}>
          {MEALS.map(meal => (
            <TouchableOpacity key={meal} style={[styles.mealChip, selectedMeal === meal && styles.mealChipSelected]} onPress={() => setSelectedMeal(meal)} accessibilityRole="button">
              <Text style={[styles.mealChipText, selectedMeal === meal && styles.mealChipTextSelected]}>{MEAL_LABELS[meal]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modeToggle}>
          <TouchableOpacity style={[styles.modeButton, !manualEntry.manualMode && styles.modeButtonActive]} onPress={() => manualEntry.setManualMode(false)} accessibilityRole="button">
            <Text style={[styles.modeButtonText, !manualEntry.manualMode && styles.modeButtonTextActive]}>AI识别</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeButton, manualEntry.manualMode && styles.modeButtonActive]} onPress={() => manualEntry.setManualMode(true)} accessibilityRole="button">
            <Text style={[styles.modeButtonText, manualEntry.manualMode && styles.modeButtonTextActive]}>手动录入</Text>
          </TouchableOpacity>
        </View>

        {!manualEntry.manualMode ? (
          <>
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>⭐ 收藏</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {favoriteFoods.map(food => (
                  <TouchableOpacity key={`fav_${food.id}`} style={styles.quickChip} onPress={() => {
                    const entry: FoodEntry = { ...food, id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, mealType: selectedMeal, createdAt: Date.now(), isFavorite: false, deletedAt: undefined };
                    addFoodEntry(entry);
                    Alert.alert('已添加', `${food.name} 已添加到${MEAL_LABELS[selectedMeal]}`);
                  }}>
                    <Text style={styles.quickChipText} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.quickChipCal}>{food.calories}kcal</Text>
                  </TouchableOpacity>
                ))}
                {favoriteFoods.length === 0 && <Text style={styles.quickEmpty}>在首页点☆收藏食物</Text>}
              </ScrollView>
            </View>

            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>📋 最近常吃</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll}>
                {recentFoods.map(food => (
                  <TouchableOpacity key={`recent_${food.id}`} style={styles.quickChip} onPress={() => {
                    const entry: FoodEntry = { ...food, id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, mealType: selectedMeal, createdAt: Date.now(), isFavorite: false, deletedAt: undefined };
                    addFoodEntry(entry);
                    Alert.alert('已添加', `${food.name} 已添加到${MEAL_LABELS[selectedMeal]}`);
                  }}>
                    <Text style={styles.quickChipText} numberOfLines={1}>{food.name}</Text>
                    <Text style={styles.quickChipCal}>{food.calories}kcal</Text>
                  </TouchableOpacity>
                ))}
                {recentFoods.length === 0 && <Text style={styles.quickEmpty}>最近7天无记录</Text>}
              </ScrollView>
            </View>

            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>📅 复制昨天</Text>
              <View style={styles.copyRow}>
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(meal => (
                  <TouchableOpacity key={`copy_${meal}`} style={styles.copyBtn} onPress={async () => {
                    await copyYesterdayMeal(meal);
                    Alert.alert('已复制', `昨天的${MEAL_LABELS[meal]}已复制到今天`);
                  }}>
                    <Text style={styles.copyBtnText}>{MEAL_LABELS[meal]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.foodDBButton} onPress={() => setShowFoodSearch(true)} accessibilityRole="button">
              <Text style={styles.foodDBIcon}>📖</Text>
              <Text style={styles.foodDBLabel}>食物库搜索</Text>
              <Text style={styles.foodDBHint}>1657种食材</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.cameraButton} onPress={foodAnalysis.takePhoto} disabled={foodAnalysis.loading}>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.cameraLabel}>{isWeb ? '不支持' : '拍照识别'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={foodAnalysis.pickImage} disabled={foodAnalysis.loading}>
                <Text style={styles.cameraIcon}>🖼️</Text>
                <Text style={styles.cameraLabel}>相册选择</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ocrSection}>
              <Text style={styles.ocrSectionTitle}>📋 识别营养标签</Text>
              <Text style={styles.ocrSectionHint}>拍摄食品包装上的营养成分表</Text>
              <View style={styles.ocrButtons}>
                <TouchableOpacity style={styles.ocrButton} onPress={ocrAnalysis.takeOcrPhoto} disabled={ocrAnalysis.ocrLoading}>
                  <Text style={styles.ocrButtonIcon}>📷</Text>
                  <Text style={styles.ocrButtonLabel}>{isWeb ? '不支持' : '拍照'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ocrButton} onPress={ocrAnalysis.pickOcrImage} disabled={ocrAnalysis.ocrLoading}>
                  <Text style={styles.ocrButtonIcon}>🖼️</Text>
                  <Text style={styles.ocrButtonLabel}>相册</Text>
                </TouchableOpacity>
              </View>
            </View>

            {ocrAnalysis.ocrLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 16 }} />
                <Text style={styles.loadingText}>📋 正在识别营养标签...</Text>
                <Text style={styles.loadingSubtext}>正在读取营养成分表数据</Text>
                <Text style={styles.loadingHint}>这可能需要 3-10 秒</Text>
              </View>
            )}

            {ocrAnalysis.ocrFailed && !ocrAnalysis.ocrLoading && (
              <View style={styles.failedCard}>
                <Text style={styles.failedTitle}>⚠️ 识别失败</Text>
                <Text style={styles.failedMessage}>{ocrAnalysis.ocrFailed}</Text>
                <Text style={styles.failedHint}>请确认图片是清晰的营养成分表后重新尝试</Text>
                <View style={styles.failedActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={ocrAnalysis.resetOcr}><Text style={styles.retryButtonText}>🔄 重新选择图片</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {ocrAnalysis.ocrResult && !ocrAnalysis.ocrLoading && (
              <NutritionLabelResultCard
                result={ocrAnalysis.ocrResult}
                mealType={selectedMeal}
                saving={ocrAnalysis.ocrSaving}
                onSave={ocrAnalysis.handleOcrSave}
                onCancel={ocrAnalysis.resetOcr}
              />
            )}

            <TouchableOpacity style={styles.textInputButton} onPress={() => setShowTextInput(true)} accessibilityRole="button">
              <Text style={styles.textInputIcon}>✏️</Text>
              <View style={styles.textInputContent}>
                <Text style={styles.textInputLabel}>文字描述</Text>
                <Text style={styles.textInputHint}>输入文字描述食物和份量</Text>
              </View>
              <Text style={styles.textInputArrow}>›</Text>
            </TouchableOpacity>

            <TextInput style={styles.noteInput} value={note} onChangeText={setNote} placeholder="添加备注（可选，帮助AI更准确识别）" placeholderTextColor="#BDBDBD" multiline />

            {foodAnalysis.loading && (
              <View style={styles.loadingContainer}>
                {imagePicker.imagePreviewUri && <Image source={{ uri: imagePicker.imagePreviewUri }} style={styles.previewImage} resizeMode="cover" />}
                <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 16 }} />
                <Text style={styles.loadingText}>🤖 AI 正在识别中...</Text>
                <Text style={styles.loadingSubtext}>正在将图片发送到 {foodAnalysis.activeProvider?.name || 'AI'} 进行分析</Text>
                <Text style={styles.loadingHint}>这可能需要 3-10 秒</Text>
              </View>
            )}

            {foodAnalysis.analyzeFailed && !foodAnalysis.loading && (
              <View style={styles.failedCard}>
                <Text style={styles.failedTitle}>⚠️ 识别失败</Text>
                <Text style={styles.failedMessage}>{foodAnalysis.analyzeFailed}</Text>
                <Text style={styles.failedHint}>请确认照片中是清晰的菜品后重试，或手动录入</Text>
                <View style={styles.failedActions}>
                  <TouchableOpacity style={styles.retryButton} onPress={foodAnalysis.handleRetry}><Text style={styles.retryButtonText}>🔄 重试</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.switchManualButton} onPress={manualEntry.handleSwitchToManual}><Text style={styles.switchManualButtonText}>📝 手动录入</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {foodAnalysis.multiResult && !foodAnalysis.loading && (
              <View style={styles.multiResultContainer}>
                <View style={styles.multiResultHeader}>
                  <Text style={styles.multiResultTitle}>🔍 识别结果</Text>
                  <Text style={styles.multiResultCount}>共 {foodAnalysis.multiResult.items.length} 项</Text>
                </View>

                {foodAnalysis.multiResult.items.map((item, index) => {
                  const isSelected = foodAnalysis.selectedItems.has(index);
                  const isExpanded = foodAnalysis.expandedItems.has(index);
                  const confColor = getConfidenceColor(item.confidence);
                  const isLowConf = item.confidence < 0.6;

                  return (
                    <View key={`item_${index}`} style={[styles.foodItemCard, isLowConf && styles.foodItemCardWarn, !isSelected && styles.foodItemCardDisabled]}>
                      <View style={styles.foodItemTop}>
                        <TouchableOpacity style={styles.checkbox} onPress={() => foodAnalysis.toggleSelect(index)}>
                          <View style={[styles.checkboxInner, isSelected && styles.checkboxChecked]}>
                            {isSelected && <Text style={styles.checkboxTick}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                        <View style={styles.foodItemInfo}>
                          <TextInput style={styles.foodItemName} value={item.food_name} onChangeText={v => foodAnalysis.updateItemField(index, 'food_name' as EditableFoodField, v)} />
                          <Text style={styles.foodItemServing}>{item.serving_description} · {Math.round(item.nutrients.calories_kcal)} kcal</Text>
                        </View>
                        <View style={[styles.confBadge, { backgroundColor: confColor + '20' }]}>
                          <Text style={[styles.confText, { color: confColor }]}>{getConfidenceLabel(item.confidence)}</Text>
                        </View>
                        <TouchableOpacity style={styles.expandBtn} onPress={() => foodAnalysis.toggleExpand(index)}>
                          <Text style={styles.expandBtnText}>{isExpanded ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.removeItemBtn} onPress={() => foodAnalysis.removeItem(index)}>
                          <Text style={styles.removeItemText}>✕</Text>
                        </TouchableOpacity>
                      </View>

                      {isLowConf && (
                        <View style={styles.warnBanner}>
                          <Text style={styles.warnText}>⚠️ AI不太确定，请检查名称和营养数据</Text>
                        </View>
                      )}

                      {isExpanded && (
                        <View style={styles.expandedContent}>
                          <View style={styles.editRow}>
                            <Text style={styles.editLabel}>份量说明</Text>
                            <TextInput style={styles.editInput} value={item.serving_description} onChangeText={v => foodAnalysis.updateItemField(index, 'serving_description' as EditableFoodField, v)} />
                          </View>
                          <View style={styles.editRow}>
                            <Text style={styles.editLabel}>份量(克)</Text>
                            <TextInput style={styles.editInput} value={String(item.serving_size_grams)} onChangeText={v => foodAnalysis.updateItemField(index, 'serving_size_grams' as EditableFoodField, v)} keyboardType="decimal-pad" />
                          </View>
                          <View style={styles.nutrientGrid}>
                            <View style={styles.nutrientItem}>
                              <Text style={styles.nutrientLabel}>热量</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.calories_kcal))} onChangeText={v => foodAnalysis.updateItemField(index, 'calories_kcal' as EditableFoodField, v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>kcal</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={[styles.nutrientLabel, { color: COLORS.protein }]}>蛋白质</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.protein_g * 10) / 10)} onChangeText={v => foodAnalysis.updateItemField(index, 'protein_g' as EditableFoodField, v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>g</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={[styles.nutrientLabel, { color: COLORS.carbs }]}>碳水</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.carbs_g * 10) / 10)} onChangeText={v => foodAnalysis.updateItemField(index, 'carbs_g' as EditableFoodField, v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>g</Text>
                            </View>
                            <View style={styles.nutrientItem}>
                              <Text style={[styles.nutrientLabel, { color: COLORS.fat }]}>脂肪</Text>
                              <TextInput style={styles.nutrientInput} value={String(Math.round(item.nutrients.fat_g * 10) / 10)} onChangeText={v => foodAnalysis.updateItemField(index, 'fat_g' as EditableFoodField, v)} keyboardType="decimal-pad" />
                              <Text style={styles.nutrientUnit}>g</Text>
                            </View>
                          </View>
                          {item.notes && <Text style={styles.itemNotes}>💡 {item.notes}</Text>}
                        </View>
                      )}
                    </View>
                  );
                })}

                {foodAnalysis.selectedSummary && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>📊 勾选汇总</Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{Math.round(foodAnalysis.selectedSummary.cal)}</Text>
                        <Text style={styles.summaryUnit}>kcal</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.protein }]}>{Math.round(foodAnalysis.selectedSummary.pro * 10) / 10}</Text>
                        <Text style={styles.summaryUnit}>蛋白质g</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.carbs }]}>{Math.round(foodAnalysis.selectedSummary.carb * 10) / 10}</Text>
                        <Text style={styles.summaryUnit}>碳水g</Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={[styles.summaryValue, { color: COLORS.fat }]}>{Math.round(foodAnalysis.selectedSummary.fat * 10) / 10}</Text>
                        <Text style={styles.summaryUnit}>脂肪g</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.batchSaveRow}>
                  <TouchableOpacity style={styles.cancelResultButton} onPress={foodAnalysis.resetAnalysis}>
                    <Text style={styles.cancelResultText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.batchSaveButton} onPress={foodAnalysis.handleBatchSave}>
                    <Text style={styles.batchSaveText}>保存 {foodAnalysis.selectedItems.size} 项到{MEAL_LABELS[selectedMeal]}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.manualForm}>
            <TextInput style={styles.manualInput} value={manualEntry.manualEntry.name} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, name: text }))} placeholder="食物名称" placeholderTextColor="#BDBDBD" />
            <View style={styles.manualRow}>
              <TextInput style={[styles.manualInput, styles.manualInputHalf]} value={manualEntry.manualEntry.servingSize} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, servingSize: text }))} placeholder="份量" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TextInput style={[styles.manualInput, styles.manualInputHalf]} value={manualEntry.manualEntry.servingUnit} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, servingUnit: text }))} placeholder="单位" placeholderTextColor="#BDBDBD" />
            </View>
            <View style={styles.manualCalRow}>
              <TextInput style={[styles.manualInput, styles.manualCalInput]} value={manualEntry.manualEntry.calories} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, calories: text }))} placeholder="热量 (kcal)" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TouchableOpacity style={styles.manualConvertBtn} onPress={() => setShowConverter(true)}>
                <Text style={styles.manualConvertBtnText}>⚡ kJ→kcal</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.manualRow}>
              <TextInput style={[styles.manualInput, styles.manualInputThird]} value={manualEntry.manualEntry.protein} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, protein: text }))} placeholder="蛋白质g" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TextInput style={[styles.manualInput, styles.manualInputThird]} value={manualEntry.manualEntry.carbs} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, carbs: text }))} placeholder="碳水g" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
              <TextInput style={[styles.manualInput, styles.manualInputThird]} value={manualEntry.manualEntry.fat} onChangeText={text => manualEntry.setManualEntry(prev => ({ ...prev, fat: text }))} placeholder="脂肪g" placeholderTextColor="#BDBDBD" keyboardType="decimal-pad" />
            </View>
            <TouchableOpacity style={styles.foodDBCheckRow} onPress={() => manualEntry.setSaveToFoodDB(!manualEntry.saveToFoodDB)}>
              <View style={[styles.foodDBCheckbox, manualEntry.saveToFoodDB && styles.foodDBCheckboxActive]}>
                {manualEntry.saveToFoodDB && <Text style={styles.foodDBCheckboxTick}>✓</Text>}
              </View>
              <Text style={styles.foodDBCheckLabel}>同时保存到食物库</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveFullButton} onPress={manualEntry.handleManualSave} accessibilityRole="button">
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <FoodSearchModal visible={showFoodSearch} onClose={() => setShowFoodSearch(false)} onSelect={foodAnalysis.handleFoodDBSelect} selectedMeal={selectedMeal} />
      <KjKcalConverter visible={showConverter} onClose={() => setShowConverter(false)} onUseKcal={manualEntry.manualMode ? (kcal) => manualEntry.setManualEntry(prev => ({ ...prev, calories: String(kcal) })) : undefined} />
      <TextFoodInput
        visible={showTextInput}
        onClose={() => setShowTextInput(false)}
        onAnalyze={foodAnalysis.handleTextAnalyze}
        onSave={foodAnalysis.handleTextSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  converterBtn: { padding: 8, backgroundColor: '#FFF8E1', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  converterBtnIcon: { fontSize: 16 },
  converterBtnLabel: { fontSize: 12, fontWeight: '600', color: '#F57F17' },
  apiKeyWarning: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.accent },
  apiKeyWarningText: { fontSize: 13, color: '#E65100', fontWeight: '500' },
  webNotice: { backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.protein },
  webNoticeText: { fontSize: 12, color: '#1565C0' },
  mealSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0' },
  mealChipSelected: { backgroundColor: COLORS.primary },
  mealChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  mealChipTextSelected: { color: '#FFFFFF' },
  modeToggle: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 10, padding: 3, marginBottom: 20 },
  modeButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  modeButtonActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  modeButtonText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  modeButtonTextActive: { color: COLORS.text, fontWeight: '600' },
  quickSection: { marginBottom: 12 },
  quickTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  quickScroll: { flexDirection: 'row' },
  quickChip: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, minWidth: 80, maxWidth: 120, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  quickChipText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  quickChipCal: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  quickEmpty: { fontSize: 12, color: '#BDBDBD', fontStyle: 'italic' },
  copyRow: { flexDirection: 'row', gap: 8 },
  copyBtn: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.primaryLight },
  copyBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  foodDBButton: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.primaryLight },
  foodDBIcon: { fontSize: 24, marginRight: 10 },
  foodDBLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  foodDBHint: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 8 },
  ocrSection: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#E3F2FD', borderStyle: 'dashed' },
  ocrSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  ocrSectionHint: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  ocrButtons: { flexDirection: 'row', gap: 10 },
  ocrButton: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'center' },
  ocrButtonIcon: { fontSize: 24, marginBottom: 4 },
  ocrButtonLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  textInputButton: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderWidth: 1.5, borderColor: '#FFF3E0' },
  textInputIcon: { fontSize: 24, marginRight: 12 },
  textInputContent: { flex: 1 },
  textInputLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  textInputHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  textInputArrow: { fontSize: 24, color: '#BDBDBD' },
  actionButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  cameraButton: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: '#E8F5E9', borderStyle: 'dashed' },
  cameraIcon: { fontSize: 36, marginBottom: 8 },
  cameraLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  noteInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.text, minHeight: 60, textAlignVertical: 'top', marginBottom: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 20 },
  previewImage: { width: 200, height: 200, borderRadius: 16, marginBottom: 12, borderWidth: 2, borderColor: COLORS.primaryLight },
  loadingText: { fontSize: 18, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  loadingSubtext: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  loadingHint: { fontSize: 11, color: '#BDBDBD', marginTop: 8 },
  failedCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  failedTitle: { fontSize: 18, fontWeight: '700', color: COLORS.error, marginBottom: 8 },
  failedMessage: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  failedActions: { flexDirection: 'row', gap: 12 },
  failedHint: { fontSize: 12, color: '#BDBDBD', textAlign: 'center', marginBottom: 16, marginTop: -8 },
  retryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  switchManualButton: { backgroundColor: '#FFEBEE', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: '#FFCDD2' },
  switchManualButtonText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },

  multiResultContainer: { marginTop: 8 },
  multiResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  multiResultTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  multiResultCount: { fontSize: 13, color: COLORS.textSecondary },

  foodItemCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2, elevation: 1 },
  foodItemCardWarn: { borderColor: '#FFB74D', borderWidth: 1.5 },
  foodItemCardDisabled: { opacity: 0.45 },
  foodItemTop: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { padding: 4, marginRight: 6 },
  checkboxInner: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  foodItemInfo: { flex: 1 },
  foodItemName: { fontSize: 16, fontWeight: '600', color: COLORS.text, paddingVertical: 2 },
  foodItemServing: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  confBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginLeft: 6 },
  confText: { fontSize: 11, fontWeight: '600' },
  expandBtn: { padding: 6, marginLeft: 4 },
  expandBtnText: { fontSize: 12, color: COLORS.textSecondary },
  removeItemBtn: { padding: 6, marginLeft: 2 },
  removeItemText: { fontSize: 13, color: '#BDBDBD' },
  warnBanner: { backgroundColor: '#FFF8E1', borderRadius: 8, padding: 8, marginTop: 8 },
  warnText: { fontSize: 12, color: '#F57F17' },
  expandedContent: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  editLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500', width: 70 },
  editInput: { flex: 1, fontSize: 14, color: COLORS.text, backgroundColor: '#F5F5F5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  nutrientGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 },
  nutrientItem: { width: '48%', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 8, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  nutrientLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, width: 36 },
  nutrientInput: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 2, textAlign: 'center' },
  nutrientUnit: { fontSize: 10, color: COLORS.textSecondary, marginLeft: 3 },
  itemNotes: { fontSize: 12, color: COLORS.textSecondary, backgroundColor: '#FFF8E1', padding: 8, borderRadius: 6, marginTop: 4 },

  summaryCard: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 12 },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  summaryUnit: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },

  batchSaveRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelResultButton: { backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' },
  cancelResultText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500' },
  batchSaveButton: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  batchSaveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  saveFullButton: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  foodDBCheckRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  foodDBCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  foodDBCheckboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  foodDBCheckboxTick: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  foodDBCheckLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  manualForm: { gap: 12 },
  manualInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.text },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInputHalf: { flex: 1 },
  manualInputThird: { flex: 1 },
  manualCalRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  manualCalInput: { flex: 1 },
  manualConvertBtn: { backgroundColor: '#FFF8E1', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 14, borderWidth: 1, borderColor: '#FFE0B2' },
  manualConvertBtnText: { fontSize: 12, fontWeight: '600', color: '#F57F17' },
});
