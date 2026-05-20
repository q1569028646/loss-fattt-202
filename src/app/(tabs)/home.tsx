import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, MEAL_LABELS } from '../../utils/constants';
import { hapticSuccess, hapticWarning, hapticLight } from '../../utils/haptics';
import { useProfileStore } from '../../stores/profileStore';
import { useFoodStore } from '../../stores/foodStore';
import { CalorieRing } from '../../components/charts/CalorieRing';
import { MacroBar } from '../../components/food/MacroBar';
import { MacroPieChart } from '../../components/charts/MacroPieChart';
import { PhotoGallery } from '../../components/food/PhotoGallery';
import { FoodCard } from '../../components/food/FoodCard';
import { WeeklyReport } from '../../components/reports/WeeklyReport';
import { SmartAnalysis } from '../../components/insights/SmartAnalysis';
import { AchievementWall } from '../../components/achievements/AchievementWall';
import { HomeSkeleton } from '../../components/ui/Skeleton';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { QuickActions } from '../../components/home/QuickActions';
import { useAchievementStore } from '../../stores/achievementStore';
import { useExerciseStore } from '../../stores/exerciseStore';
import type { MealType } from '../../types';

function dateToKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  return dateToKey(Date.now());
}

function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile, addWeightEntry, weightEntries } = useProfileStore();
  const {
    todayEntries, allEntries, selectedDate,
    initialize, setSelectedDate, deleteEntry, toggleFavorite,
    getSummary, getStreak, getTodayPhotos,
  } = useFoodStore();
  const { getExerciseTotal } = useExerciseStore();

  const [weightInput, setWeightInput] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [homeReady, setHomeReady] = useState(false);

  const { loadAchievements, checkAndUnlock, getProgress } = useAchievementStore();

  useEffect(() => {
    let isMounted = true;
    initialize().then(async () => {
      if (!isMounted) return;
      await loadAchievements();
      if (!isMounted) return;
      await checkAndUnlock();
      if (isMounted) setHomeReady(true);
    });
    return () => { isMounted = false; };
  }, []);

  const handleToggleFavorite = (id: string) => {
    hapticLight();
    toggleFavorite(id).catch(() => {});
  };

  const handleDelete = (id: string) => {
    hapticWarning();
    deleteEntry(id).catch(() => {});
  };

  const summary = getSummary();
  const dailyCalories = profile.tdee + profile.calorieAdjustment;
  const exerciseKcal = getExerciseTotal(selectedDate);
  const netCalories = summary.calories - exerciseKcal;
  const calorieDeficit = dailyCalories - netCalories;
  const isDeficit = calorieDeficit > 0;

  const { carbsG, fatG } = useMemo(() => {
    const proteinCal = profile.proteinG * 4;
    const remaining = dailyCalories - proteinCal;
    return {
      carbsG: Math.round(Math.max(0, remaining * 0.65) / 4),
      fatG: Math.round(Math.max(0, remaining * 0.35) / 9),
    };
  }, [dailyCalories, profile.proteinG]);

  const meals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(dateToKey(date.getTime()));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    if (dateToKey(date.getTime()) > todayKey()) return;
    setSelectedDate(dateToKey(date.getTime()));
  };

  const handleSaveWeight = () => {
    const w = parseFloat(weightInput);
    if (isNaN(w) || w <= 0) return;
    addWeightEntry(w);
    hapticSuccess();
    setWeightInput('');
    setShowWeightInput(false);
    Alert.alert('已记录', `体重 ${w}kg 已保存`);
  };

  const streak = getStreak();
  const todayPhotos = getTodayPhotos();
  const isToday = selectedDate === todayKey();

  const quickActions = [
    { icon: '🍽️', label: '记录饮食', onPress: () => router.push('/(tabs)/add-food') },
    { icon: '⚖️', label: '记体重', onPress: () => setShowWeightInput(v => !v) },
    { icon: '🏃', label: '记运动', onPress: () => router.push('/exercise') },
  ];

  const hasAnyEntry = todayEntries.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {!homeReady ? <HomeSkeleton /> : (
          <>
            {/* 日期导航 */}
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={handlePrevDay} style={styles.dateArrow}>
                <Text style={styles.dateArrowText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
              <TouchableOpacity onPress={handleNextDay} style={styles.dateArrow}>
                <Text style={[styles.dateArrowText, !isToday && styles.dateArrowActive]}>›</Text>
              </TouchableOpacity>
            </View>

            {/* 连续记录 */}
            {streak > 0 && (
              <View style={styles.streakRow}>
                <Text style={styles.streakText}>🔥 连续记录 {streak} 天</Text>
              </View>
            )}

            {/* 快速操作栏 */}
            {isToday && <QuickActions actions={quickActions} />}

            {/* 热量缺口卡片 */}
            <Card>
              <View style={styles.deficitHeader}>
                <Text style={styles.deficitLabel}>
                  {isDeficit ? '🔥 热量缺口' : '⚠️ 热量超标'}
                </Text>
                <Text style={[styles.deficitValue, isDeficit ? styles.deficitGoodText : styles.deficitBadText]}>
                  {isDeficit ? '' : '+'}{Math.abs(calorieDeficit)} kcal
                </Text>
                <Text style={styles.deficitDetail}>
                  目标 {dailyCalories} · 摄入 {summary.calories} · 运动 {exerciseKcal}
                </Text>
              </View>
            </Card>

            {/* 体重输入 */}
            {showWeightInput && (
              <Card>
                <View style={styles.weightInputRow}>
                  <TextInput
                    style={styles.weightTextInput}
                    value={weightInput}
                    onChangeText={setWeightInput}
                    placeholder="输入今日体重 (kg)"
                    placeholderTextColor="#BDBDBD"
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.weightSaveBtn} onPress={handleSaveWeight}>
                    <Text style={styles.weightSaveBtnText}>保存</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* 核心指标：热量环 */}
            <View style={styles.ringContainer}>
              <CalorieRing consumed={summary.calories} target={dailyCalories} />
            </View>

            {/* 宏量营养素 */}
            <Card>
              <MacroBar label="蛋白质" current={summary.protein} target={profile.proteinG} color={COLORS.protein} />
              <MacroBar label="碳水化合物" current={summary.carbs} target={carbsG} color={COLORS.carbs} />
              <MacroBar label="脂肪" current={summary.fat} target={fatG} color={COLORS.fat} />
              <View style={styles.pieChartRow}>
                <MacroPieChart protein={summary.protein} carbs={summary.carbs} fat={summary.fat} size={110} />
              </View>
            </Card>

            {/* 今日饮食照片 */}
            {todayPhotos.length > 0 && (
              <View style={styles.photoSection}>
                <PhotoGallery entries={todayPhotos} />
              </View>
            )}

            {/* 智能分析 */}
            <SmartAnalysis
              allEntries={allEntries}
              todayKey={selectedDate}
              dailyCalories={dailyCalories}
              proteinTarget={profile.proteinG || 0}
              weightHistory={(weightEntries || []).map((e: any) => ({ date: e.date || e.createdAt, weight: e.weightKg }))}
              goalWeight={profile.goalWeightKg || 0}
              achievementProgress={getProgress()}
              onOpenAchievements={() => setShowAchievements(true)}
            />

            {/* 周报告 */}
            <WeeklyReport
              allEntries={allEntries}
              targetCalories={dailyCalories}
              onExpand={() => {}}
            />

            {/* 今日饮食列表 */}
            {hasAnyEntry ? (
              <View style={styles.mealSection}>
                <Text style={styles.sectionTitle}>📋 今日饮食</Text>
                {meals.map(meal => {
                  const entries = todayEntries.filter(e => e.mealType === meal);
                  const mealCals = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
                  return (
                    <View key={meal} style={styles.mealGroup}>
                      <View style={styles.mealHeader}>
                        <Text style={styles.mealName}>{MEAL_LABELS[meal]}</Text>
                        <Text style={styles.mealCals}>{mealCals} kcal</Text>
                      </View>
                      {entries.map(entry => (
                        <FoodCard key={entry.id} entry={entry} onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} />
                      ))}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptySection}>
                <EmptyState
                  icon="🍽️"
                  title="今天还没有记录"
                  description="开始记录你的第一顿饭吧！拍照识别或搜索食物都可以~"
                  actionLabel="记录饮食"
                  onAction={() => router.push('/(tabs)/add-food')}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
      <AchievementWall visible={showAchievements} onClose={() => setShowAchievements(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA' },
  scrollView: { flex: 1 },
  content: { paddingBottom: 100 },
  // 日期导航
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 8, paddingBottom: 4, gap: 20,
  },
  dateArrow: { padding: 8 },
  dateArrowText: { fontSize: 28, color: COLORS.primary, fontWeight: '300' },
  dateArrowActive: { color: '#E0E0E0' },
  dateText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  // 连续记录
  streakRow: { alignItems: 'center', marginBottom: 6 },
  streakText: {
    fontSize: 13, fontWeight: '600', color: '#FF6B00',
    backgroundColor: '#FFF3E0', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16,
  },
  // 热量缺口
  deficitHeader: { alignItems: 'center' },
  deficitLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  deficitValue: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  deficitGoodText: { color: '#2E7D32' },
  deficitBadText: { color: '#E65100' },
  deficitDetail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  // 体重
  weightInputRow: { flexDirection: 'row', gap: 10 },
  weightTextInput: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  weightSaveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  weightSaveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  // 热量环
  ringContainer: { alignItems: 'center', paddingVertical: 8 },
  // 营养素饼图
  pieChartRow: { alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  // 照片
  photoSection: { paddingHorizontal: 16, marginBottom: 4 },
  // 饮食列表
  mealSection: { paddingHorizontal: 16, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12, marginLeft: 4 },
  mealGroup: { marginBottom: 14 },
  mealHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6, paddingHorizontal: 4,
  },
  mealName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  mealCals: { fontSize: 13, color: COLORS.textSecondary },
  emptySection: { marginTop: 16 },
});
