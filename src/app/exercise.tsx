/**
 * 运动记录页面
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS } from '../utils/constants';
import { hapticSuccess, hapticLight } from '../utils/haptics';
import { useExerciseStore, EXERCISE_TYPES, type ExerciseType } from '../stores/exerciseStore';
import { Card } from '../components/ui/Card';

const durations = [15, 30, 45, 60, 90, 120];

export default function ExerciseScreen() {
  const router = useRouter();
  const { entries, initialize, addExercise, deleteExercise, getTodayEntries, getTotalByDate } = useExerciseStore();
  const [selectedType, setSelectedType] = useState<ExerciseType>('running');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [note, setNote] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    initialize().then(() => setInitialized(true));
  }, []);

  const todayEntries = getTodayEntries();
  const total = getTotalByDate(new Date().toISOString().split('T')[0]);

  const handleSave = async () => {
    const dur = customDuration ? parseInt(customDuration, 10) : selectedDuration;
    if (isNaN(dur) || dur <= 0) {
      Alert.alert('请输入运动时长');
      return;
    }
    await addExercise(selectedType, dur, note || undefined);
    hapticSuccess();
    setNote('');
    setCustomDuration('');
    Alert.alert('已记录', `${EXERCISE_TYPES[selectedType].label} ${dur}分钟`);
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除确认', '确定要删除这条运动记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteExercise(id) },
    ]);
  };

  const typeItems = Object.entries(EXERCISE_TYPES) as [ExerciseType, typeof EXERCISE_TYPES[ExerciseType]][];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* 标题栏 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ 返回</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🏃 记录运动</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* 今日统计 */}
        <Card>
          <View style={styles.todayStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{total.calories}</Text>
              <Text style={styles.statLabel}>消耗 (kcal)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{total.durationMin}</Text>
              <Text style={styles.statLabel}>总时长 (分钟)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayEntries.length}</Text>
              <Text style={styles.statLabel}>运动次数</Text>
            </View>
          </View>
        </Card>

        {/* 运动类型选择 */}
        <Text style={styles.sectionTitle}>运动类型</Text>
        <View style={styles.typeGrid}>
          {typeItems.map(([key, item]) => (
            <TouchableOpacity
              key={key}
              style={[styles.typeItem, selectedType === key && styles.typeItemActive]}
              onPress={() => { hapticLight(); setSelectedType(key); }}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{item.emoji}</Text>
              <Text style={[styles.typeLabel, selectedType === key && styles.typeLabelActive]}>
                {item.label}
              </Text>
              <Text style={styles.typeKcal}>~{item.kcalPer30min}kcal/30min</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 时长选择 */}
        <Text style={styles.sectionTitle}>运动时长</Text>
        <View style={styles.durationRow}>
          {durations.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.durationItem, selectedDuration === d && !customDuration && styles.durationItemActive]}
              onPress={() => { setSelectedDuration(d); setCustomDuration(''); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.durationText, selectedDuration === d && !customDuration && styles.durationTextActive]}>
                {d}分钟
              </Text>
            </TouchableOpacity>
          ))}
          <View style={[styles.durationItem, customDuration ? styles.durationItemActive : null]}>
            <TextInput
              style={[styles.durationText, styles.durationInput, customDuration ? styles.durationTextActive : null]}
              value={customDuration}
              onChangeText={setCustomDuration}
              placeholder="自定义"
              placeholderTextColor="#BDBDBD"
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* 备注 */}
        <Card>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="添加备注（可选）"
            placeholderTextColor="#BDBDBD"
          />
        </Card>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnText}>
            保存运动记录 (约{EXERCISE_TYPES[selectedType].kcalPer30min * ((customDuration ? parseInt(customDuration, 10) : selectedDuration) || 30) / 30}kcal)
          </Text>
        </TouchableOpacity>

        {/* 今日记录 */}
        {todayEntries.length > 0 && (
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>今日记录</Text>
            {todayEntries.map((entry: typeof todayEntries[0]) => (
              <Card key={entry.id} style={{ marginBottom: 8 }}>
                <View style={styles.entryRow}>
                  <View>
                    <Text style={styles.entryName}>
                      {EXERCISE_TYPES[entry.type].emoji} {EXERCISE_TYPES[entry.type].label}
                    </Text>
                    <Text style={styles.entryDetail}>
                      {entry.durationMin}分钟 · {entry.calories}kcal
                      {entry.note ? ` · ${entry.note}` : ''}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                    <Text style={styles.deleteBtn}>删除</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollView: { flex: 1 },
  content: { paddingBottom: 40 },
  // 标题栏
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  // 今日统计
  todayStats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E8E8E8' },
  // 类型选择
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  typeItem: {
    width: '30%', backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 12, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  typeItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  typeEmoji: { fontSize: 28, marginBottom: 4 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  typeLabelActive: { color: COLORS.primaryDark },
  typeKcal: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
  // 时长
  durationRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  durationItem: {
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#E8E8E8',
  },
  durationItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  durationText: { fontSize: 14, color: COLORS.text, fontWeight: '500' },
  durationTextActive: { color: COLORS.primaryDark },
  durationInput: { minWidth: 60, textAlign: 'center', padding: 0 },
  // 备注
  noteInput: { fontSize: 14, color: COLORS.text },
  // 保存
  saveBtn: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  // 历史
  historySection: { marginTop: 20 },
  entryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  entryName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  entryDetail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  deleteBtn: { fontSize: 13, color: COLORS.error, fontWeight: '500' },
});
