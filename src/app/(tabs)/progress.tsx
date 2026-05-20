import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Circle, Text as SvgText, G, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { COLORS } from '../../utils/constants';
import { useProfileStore } from '../../stores/profileStore';
import { useFoodStore } from '../../stores/foodStore';
import { formatCalories } from '../../utils/formatters';
import { CalorieTrendChart } from '../../components/charts/CalorieTrendChart';
import { NutrientTrendChart } from '../../components/charts/NutrientTrendChart';

export default function ProgressScreen() {
  const { profile, weightEntries, addWeightEntry, deleteWeightEntry } = useProfileStore();
  const { allEntries } = useFoodStore();
  const [newWeight, setNewWeight] = useState('');

  const dailyCalories = profile.tdee + profile.calorieAdjustment;
  const weightDiff = profile.weightKg - profile.goalWeightKg;
  const daysEstimate = Math.abs(weightDiff) * 7700 / Math.max(1, Math.abs(profile.calorieAdjustment || 500));

  const chartWidth = 340;
  const chartHeight = 200;
  const padding = { top: 20, right: 24, bottom: 30, left: 45 };
  const plotW = chartWidth - padding.left - padding.right;
  const plotH = chartHeight - padding.top - padding.bottom;

  const points = [...(weightEntries || [])].slice(-14);

  // 构建热量趋势数据
  const calorieTrendData = useMemo(() => {
    const map = new Map<string, { date: string; calories: number }>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, { date: key, calories: 0 });
    }
    allEntries.forEach(e => {
      const key = new Date(e.createdAt).toISOString().split('T')[0];
      const existing = map.get(key);
      if (existing) existing.calories += e.calories || 0;
    });
    return Array.from(map.values());
  }, [allEntries]);

  // 构建营养素趋势数据
  const nutrientTrendData = useMemo(() => {
    const map = new Map<string, { date: string; protein: number; carbs: number; fat: number }>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, { date: key, protein: 0, carbs: 0, fat: 0 });
    }
    allEntries.forEach(e => {
      const key = new Date(e.createdAt).toISOString().split('T')[0];
      const existing = map.get(key);
      if (existing) {
        existing.protein += e.protein || 0;
        existing.carbs += e.carbs || 0;
        existing.fat += e.fat || 0;
      }
    });
    return Array.from(map.values());
  }, [allEntries]);

  const addWeight = async () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;
    await addWeightEntry(weight);
    setNewWeight('');
  };

  const handleDeleteWeight = (id: string) => {
    Alert.alert('确认删除', '确定要删除这条体重记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => deleteWeightEntry(id) },
    ]);
  };

  const renderChart = () => {
    if (points.length < 2) {
      return <Text style={styles.noData}>暂无足够数据，记录更多体重后显示趋势图</Text>;
    }

    const allWeights = points.map(p => p.weightKg);
    const minW = Math.min(...allWeights, profile.goalWeightKg) - 1;
    const maxW = Math.max(...allWeights, profile.weightKg) + 1;
    const range = maxW - minW || 1;

    const toX = (i: number) => padding.left + (i / (points.length - 1)) * plotW;
    const toY = (w: number) => padding.top + plotH - ((w - minW) / range) * plotH;

    const goalY = toY(profile.goalWeightKg);
    const yTicks = 5;
    const yStep = range / yTicks;

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.primary} stopOpacity={0.2} />
            <Stop offset="1" stopColor={COLORS.primary} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        <G>
          {Array.from({ length: yTicks + 1 }, (_, i) => {
            const val = minW + i * yStep;
            const y = toY(val);
            return (
              <G key={`ytick_${i}`}>
                <Line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#F0F0F0" strokeWidth={1} />
                <SvgText x={padding.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#BDBDBD">
                  {val.toFixed(1)}
                </SvgText>
              </G>
            );
          })}

          {/* 目标线 */}
          <Line x1={padding.left} y1={goalY} x2={chartWidth - padding.right} y2={goalY}
            stroke={COLORS.accent} strokeWidth={1.5} strokeDasharray="4,4" />
          <SvgText x={chartWidth - padding.right + 2} y={goalY + 3} fontSize={10} fill={COLORS.accent}>
            目标 {profile.goalWeightKg}kg
          </SvgText>

          {/* 曲线面积 */}
          {points.length >= 2 && (
            <G>
              {/* 面积填充 */}
              {(() => {
                const areaPath = points.map((p, i) => {
                  const cmd = i === 0 ? 'M' : 'L';
                  return `${cmd}${toX(i)},${toY(p.weightKg)}`;
                }).join(' ');
                const closePath = `${areaPath} L${toX(points.length - 1)},${chartHeight} L${toX(0)},${chartHeight} Z`;
                return <Rect x="0" y="0" width={chartWidth} height={chartHeight} fill="url(#areaGrad)" opacity={0} />;
              })()}
            </G>
          )}

          {points.map((p, i) => {
            const x = toX(i);
            const y = toY(p.weightKg);
            return (
              <React.Fragment key={p.id}>
                {i > 0 && (() => {
                  const prev = points[i - 1];
                  return <Line x1={toX(i - 1)} y1={toY(prev.weightKg)} x2={x} y2={y}
                    stroke={COLORS.primary} strokeWidth={2.5} strokeLinecap="round" />;
                })()}
                <Circle cx={x} cy={y} r={5} fill="#FFFFFF" stroke={COLORS.primary} strokeWidth={2.5} />
              </React.Fragment>
            );
          })}

          {points.map((p, i) => {
            const show = points.length <= 7 || i % Math.ceil(points.length / 7) === 0 || i === points.length - 1;
            if (!show) return null;
            const x = toX(i);
            const d = new Date(p.createdAt || Date.now());
            return (
              <SvgText key={`xl_${i}`} x={x} y={chartHeight - 6} textAnchor="middle" fontSize={10} fill="#BDBDBD">
                {`${d.getMonth() + 1}/${d.getDate()}`}
              </SvgText>
            );
          })}
        </G>
      </Svg>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>📈 进度追踪</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.weightKg}</Text>
            <Text style={styles.statLabel}>当前体重 kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.goalWeightKg}</Text>
            <Text style={styles.statLabel}>目标体重 kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatCalories(dailyCalories)}</Text>
            <Text style={styles.statLabel}>每日热量目标</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(daysEstimate)}</Text>
            <Text style={styles.statLabel}>预计达标天数</Text>
          </View>
        </View>

        {/* 体重趋势图 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>⚖️ 体重趋势</Text>
          {renderChart()}
        </View>

        {/* 热量趋势图 */}
        {calorieTrendData.some(d => d.calories > 0) && (
          <View style={styles.chartCard}>
            <CalorieTrendChart data={calorieTrendData} target={dailyCalories} days={14} />
          </View>
        )}

        {/* 营养素趋势图 */}
        {nutrientTrendData.some(d => d.protein > 0 || d.carbs > 0) && (
          <View style={styles.chartCard}>
            <NutrientTrendChart
              data={nutrientTrendData}
              proteinTarget={profile.proteinG || 60}
              days={14}
            />
          </View>
        )}

        {/* 记录体重 */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📝 记录体重</Text>
          <View style={styles.addWeightRow}>
            <TextInput
              style={styles.weightInput}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder="输入体重 (kg)"
              placeholderTextColor="#BDBDBD"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.addWeightButton} onPress={addWeight}>
              <Text style={styles.addWeightButtonText}>记录</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 体重历史 */}
        {(weightEntries || []).length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>📋 体重历史</Text>
            {(weightEntries || []).slice(-20).reverse().map(entry => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {new Date(entry.createdAt).toLocaleDateString('zh-CN')}
                </Text>
                <Text style={styles.historyWeight}>{entry.weightKg} kg</Text>
                <TouchableOpacity onPress={() => handleDeleteWeight(entry.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 16, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 4 },
  chartCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 2, elevation: 1,
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
  noData: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingVertical: 30 },
  addWeightRow: { flexDirection: 'row', gap: 10 },
  weightInput: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.text,
  },
  addWeightButton: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 20, justifyContent: 'center',
  },
  addWeightButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  historyDate: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  historyWeight: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  deleteBtn: { padding: 6, marginLeft: 8 },
  deleteBtnText: { fontSize: 12, color: '#BDBDBD' },
});
