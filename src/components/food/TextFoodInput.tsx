import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { FoodAnalysisResult, MealType } from '../../types';

interface TextFoodInputProps {
  visible: boolean;
  onClose: () => void;
  onAnalyze: (text: string) => Promise<FoodAnalysisResult[]>;
  onSave: (item: FoodAnalysisResult, mealType: MealType, saveToFoods: boolean) => void;
}

interface ConfirmItem {
  item: FoodAnalysisResult;
  mealType: MealType;
  saveToFoods: boolean;
}

export function TextFoodInput({ visible, onClose, onAnalyze, onSave }: TextFoodInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(-1);
  const [pendingItems, setPendingItems] = useState<ConfirmItem[]>([]);

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  const mealLabels: Record<MealType, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const results = await onAnalyze(text);
      if (results.length === 0) {
        Alert.alert('提示', '未识别到食物，请尝试更详细的描述');
      } else {
        setPendingItems(results.map(item => ({
          item,
          mealType: 'lunch' as MealType,
          saveToFoods: false,
        })));
        setConfirmIndex(0);
      }
    } catch (error) {
      Alert.alert('错误', '识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (confirmIndex < pendingItems.length) {
      const current = pendingItems[confirmIndex];
      onSave(current.item, current.mealType, current.saveToFoods);
      if (confirmIndex === pendingItems.length - 1) {
        handleClose();
      } else {
        setConfirmIndex(confirmIndex + 1);
      }
    }
  };

  const handleSkip = () => {
    if (confirmIndex < pendingItems.length - 1) {
      setConfirmIndex(confirmIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setText('');
    setPendingItems([]);
    setConfirmIndex(-1);
    onClose();
  };

  const updatePendingItem = (index: number, updates: Partial<ConfirmItem>) => {
    const newItems = [...pendingItems];
    newItems[index] = { ...newItems[index], ...updates };
    setPendingItems(newItems);
  };

  const renderConfirmModal = () => {
    if (confirmIndex < 0 || confirmIndex >= pendingItems.length) return null;
    const current = pendingItems[confirmIndex];
    const item = current.item;

    return (
      <Modal visible={confirmIndex >= 0} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>
              确认食物 {confirmIndex + 1}/{pendingItems.length}
            </Text>

            <ScrollView style={styles.confirmScroll}>
              <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.food_name}</Text>
                <Text style={styles.servingInfo}>
                  {item.serving_size_grams}g · {item.serving_description}
                </Text>
              </View>

              <View style={styles.nutrientRow}>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{item.nutrients.calories_kcal}</Text>
                  <Text style={styles.nutrientLabel}>千卡</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{item.nutrients.protein_g}</Text>
                  <Text style={styles.nutrientLabel}>蛋白质(g)</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{item.nutrients.carbs_g}</Text>
                  <Text style={styles.nutrientLabel}>碳水(g)</Text>
                </View>
                <View style={styles.nutrientItem}>
                  <Text style={styles.nutrientValue}>{item.nutrients.fat_g}</Text>
                  <Text style={styles.nutrientLabel}>脂肪(g)</Text>
                </View>
              </View>

              {item.notes && (
                <Text style={styles.notes}>{item.notes}</Text>
              )}

              <Text style={styles.sectionLabel}>添加到</Text>
              <View style={styles.mealSelector}>
                {mealTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.mealButton,
                      current.mealType === type && styles.mealButtonActive,
                    ]}
                    onPress={() => updatePendingItem(confirmIndex, { mealType: type })}
                  >
                    <Text
                      style={[
                        styles.mealButtonText,
                        current.mealType === type && styles.mealButtonTextActive,
                      ]}
                    >
                      {mealLabels[type]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>保存到常用食物库</Text>
                <Switch
                  value={current.saveToFoods}
                  onValueChange={val => updatePendingItem(confirmIndex, { saveToFoods: val })}
                  trackColor={{ false: '#e0e0e0', true: '#81c784' }}
                />
              </View>
            </ScrollView>

            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>跳过</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>确认添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>文字输入食物</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>关闭</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="描述你吃的食物，如：一碗米饭150g，两个鸡蛋，一杯牛奶250ml"
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.analyzeButtonText}>识别食物</Text>
            )}
          </TouchableOpacity>

          <View style={styles.examples}>
            <Text style={styles.examplesTitle}>示例：</Text>
            <Text style={styles.exampleText}>一碗米饭，一份炒青菜，两个鸡腿</Text>
            <Text style={styles.exampleText}>一杯奶茶350ml，一个三明治</Text>
          </View>
        </View>
      </View>
      {renderConfirmModal()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#fafafa',
  },
  analyzeButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  examples: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  examplesTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  confirmContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmScroll: {
    maxHeight: 400,
  },
  foodInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  foodName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  servingInfo: {
    fontSize: 14,
    color: '#666',
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  nutrientItem: {
    alignItems: 'center',
  },
  nutrientValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
  },
  nutrientLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notes: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mealSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mealButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  mealButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mealButtonText: {
    fontSize: 14,
    color: '#666',
  },
  mealButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    marginRight: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
