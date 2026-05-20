# NutriFlow — 体验升级 + 数据洞察 设计文档

Date: 2026-05-14

## Overview

本次迭代包含 6 个功能模块，分为「体验升级」和「数据洞察」两条线：

**体验升级（3项）**
1. **加载动效** — 骨架屏 + 闪烁动画，覆盖首页/添加页/教练页/趋势页
2. **触感反馈** — 保存/删除/收藏操作时的 Haptic 震动
3. **成就徽章** — 7个固定徽章 + 解锁进度条 + 徽章墙弹窗

**数据洞察（3项）**
4. **饮食模式分析** — 问题预警：晚餐占比高、碳水过多、蛋白质不足等
5. **月度评级** — S/A/B/C/D 字母评级，基于30天达标率
6. **达标预测** — 基于体重趋势线，预测达标日期

所有洞察整合到首页一个「🧠 智能分析」卡片中。

---

## Feature 1: 加载动效（骨架屏 Skeleton Screen）

### 目标

在数据加载期间显示灰色骨架占位块 + 闪烁动画（Shimmer），替代空白页面或单一 loading spinner，提升感知速度。

### 实现方式

使用 React Native `Animated API` 实现 Shimmer 效果：

```typescript
// 原理：一个绝对定位的渐变 View，水平来回移动
const shimmerTranslate = useRef(new Animated.Value(-1)).current;

Animated.loop(
  Animated.timing(shimmerTranslate, {
    toValue: 1,
    duration: 1200,
    useNativeDriver: true,
  })
).start();
```

### Skeleton 组件

创建通用 `SkeletonBlock` 组件：

```typescript
interface SkeletonBlockProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}
```

基于此构建复合 Skeleton：

```typescript
// Skeleton 变体
<SkeletonBlock width={200} height={16} borderRadius={8} />        // 文字行
<SkeletonBlock width={120} height={120} borderRadius={60} />       // 圆形（热量环）
<SkeletonBlock width="100%" height={80} borderRadius={12} />       // 卡片
<SkeletonBlock width={60} height={14} borderRadius={6} />           // 标签
```

### 改造页面

**A. 首页 HomeScreen** — `loading` 状态时显示骨架屏：

```
┌──────────────────────────────────┐
│  ‹        5月14日 周三        ›  │
│        [标签骨架 60x14]          │
│ ┌──────────────────────────────┐ │
│ │ [圆环骨架 120x120 居中]       │ │
│ │ [文字骨架 100x16]             │ │
│ │ [条形骨架 100%x10]            │ │
│ │ [条形骨架 100%x10]            │ │
│ │ [条形骨架 100%x10]            │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ [卡片骨架 100%x60]            │ │
│ └──────────────────────────────┘ │
│                                  │
│ 早餐  [空状态文字]                │
│ 午餐  [空状态文字]                │
└──────────────────────────────────┘
```

**B. 添加食物页 AddFoodScreen** — AI 分析 loading 时：

```
┌──────────────────────────────────┐
│ [预览图骨架 200x200 圆角]        │
│ [文字骨架 200x16]                │
│ [文字骨架 160x14]                │
│ 正在分析...                      │
└──────────────────────────────────┘
```

**C. 教练页 CoachScreen** — 历史消息加载或 AI 回复时：

```
┌──────────────────────────────────┐
│ 🤖 AI 营养教练                   │
│                                  │
│ [气泡骨架 右对齐 200x40]          │
│ [气泡骨架 左对齐 250x60]          │
│ [气泡骨架 右对齐 180x40]          │
│                                  │
│ 正在思考...                      │
│                                  │
│ [输入框骨架 100%x40]             │
└──────────────────────────────────┘
```

**D. 趋势页 ProgressScreen** — 数据加载时图表区域骨架：

```
│ [图表骨架 100%x160]             │
│ [统计卡片骨架 100%x80]           │
```

注意：趋势页的骨架屏因改动较大，本次仅做首页/添加页/教练页。

### Skeleton 使用时机

| 页面 | 触发条件 | 持续时间 |
|------|---------|---------|
| 首页 | `loading === true`（initialize 中） | ~1-2秒 |
| 添加页 | `loading === true`（AI 分析中） | 3-10秒 |
| 教练页 | `isLoading === true && messages.length === 0` | ~1秒 |

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/ui/Skeleton.tsx` | 通用 SkeletonBlock + Shimmer 动画 |
| MODIFY | `src/app/(tabs)/home.tsx` | loading 时显示骨架屏 |
| MODIFY | `src/app/(tabs)/add-food.tsx` | AI 分析 loading 时显示骨架屏 |
| MODIFY | `src/app/(tabs)/coach.tsx` | 首次加载消息时显示骨架屏 |

---

## Feature 2: 触感反馈（Haptic Feedback）

### 目标

在关键操作时给予轻微震动反馈，提升交互质感。

### 依赖

```bash
npx expo install expo-haptics
```

### 工具函数

```typescript
// src/utils/haptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function hapticLight() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticSuccess() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticWarning() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
```

### 触发时机

| 操作 | 震动类型 | 位置 |
|------|---------|------|
| 保存食物（AI识别/手动/OCR/食物库） | `hapticSuccess()` | add-food.tsx 的保存回调 |
| 删除食物 | `hapticWarning()` | home.tsx 的 handleDelete |
| 收藏/取消收藏 | `hapticLight()` | home.tsx 的 handleToggleFavorite |
| 运动消耗保存 | `hapticLight()` | home.tsx 的 handleSaveExercise |
| 体重保存 | `hapticSuccess()` | home.tsx 的 handleSaveWeight |
| 复制昨天餐食 | `hapticSuccess()` | add-food.tsx 的 copyYesterdayMeal |

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/utils/haptics.ts` | 三个导出函数 |
| MODIFY | `src/app/(tabs)/home.tsx` | 导入 + 在删除/收藏/运动/体重操作中调用 |
| MODIFY | `src/app/(tabs)/add-food.tsx` | 导入 + 在所有保存成功回调中调用 |

---

## Feature 3: 成就徽章系统（Achievement Badges）

### 目标

通过游戏化激励用户持续使用 App，7 个固定徽章追踪关键里程碑。

### 数据存储

新建 `achievementStore`，数据持久化到 AsyncStorage：

```typescript
interface AchievementState {
  achievements: Achievement[];
  loadAchievements: () => Promise<void>;
  checkAndUnlock: () => Promise<void>;
  getProgress: () => { unlocked: number; total: number };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;          // emoji
  condition: AchievementCondition;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;       // 0-1 的进度
}

type AchievementCondition =
  | { type: 'streak_days'; days: number }
  | { type: 'total_records_in_days'; days: number; minRecords: number }
  | { type: 'weight_loss'; kg: number }
  | { type: 'protein_streak'; days: number }
  | { type: 'first_photo' }
  | { type: 'calorie_deficit_streak'; days: number }
  | { type: 'total_records'; count: number };
```

### 7个徽章定义

| id | 图标 | 名称 | 描述 | 条件 | 进度计算 |
|----|------|------|------|------|---------|
| `streak_7` | 🔥 | 坚持就是胜利 | 连续记录7天 | 连续7天有食物记录 | 当前连续天数/7 |
| `monthly_20` | 🎯 | 月度达人 | 30天内记录≥20天 | 近30天有记录的天数≥20 | 近30天记录天数/20 |
| `weight_1kg` | ⚖️ | 初见成效 | 体重下降≥1kg | 当前体重 ≤ 初始体重 - 1kg | delta_kg / 1 |
| `protein_7` | 🥗 | 蛋白质达人 | 连续7天蛋白质达标 | 连续7天蛋白质≥目标值 | 连续天数/7 |
| `first_photo` | 📸 | 第一顿饭 | 首次拍照记录 | 存在任何带 imageUri 的 entry | 0或1 |
| `deficit_7` | 💪 | 热量掌控 | 连续7天热量缺口 | 连续7天 摄入-运动 < 目标 | 连续天数/7 |
| `records_100` | 🏆 | 百次记录 | 累计记录≥100次 | 累计食物条目≥100 | 总条目数/100 |

### checkAndUnlock 逻辑

每次首页 `initialize()` 或食物保存后自动调用，遍历所有未解锁徽章，检查条件：

```typescript
checkAndUnlock: async () => {
  const store = get();
  const { allEntries, dayRecords } = useFoodStore.getState();
  const { profile, weightHistory } = useProfileStore.getState();
  const now = Date.now();

  for (const ach of store.achievements) {
    if (ach.unlocked) continue;

    let newProgress = 0;
    let shouldUnlock = false;

    switch (ach.condition.type) {
      case 'streak_days':
        newProgress = getStreak() / ach.condition.days;
        shouldUnlock = getStreak() >= ach.condition.days;
        break;
      case 'first_photo':
        const hasPhoto = allEntries.some(e => e.imageUri && !e.deletedAt);
        shouldUnlock = hasPhoto;
        newProgress = hasPhoto ? 1 : 0;
        break;
      // ... 其他条件
    }

    set(state => ({
      achievements: state.achievements.map(a =>
        a.id === ach.id
          ? { ...a, progress: Math.min(newProgress, 1), unlocked: shouldUnlock, unlockedAt: shouldUnlock ? now : undefined }
          : a
      )
    }));
  }

  await saveAchievements(get().achievements);
}
```

### UI 展示

**A. 首页徽章进度条**

首页智能分析卡片内，或单独一行：

```
🏅 成就  4/7 已解锁  [🔥 🎯 ⚖️ ○ ○ ○]  [查看全部 >]
```

- 已解锁：彩色emoji
- 未解锁：灰色空心圆 `○`
- 点击 → 弹出 AchievementWall 弹窗

**B. 徽章墙弹窗 (AchievementWall)**

```
┌──────────────────────────────────┐
│  🏅 成就徽章              [✕]    │
│                                  │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │  🔥  │ │  🎯  │ │  ⚖️  │     │
│  │坚持就是│ │月度达人│ │初见成效│     │
│  │ 胜利  │ │  🟢  │ │  🟢  │     │
│  │  🟢  │ └──────┘ └──────┘     │
│  └──────┘                        │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │  🥗  │ │  📸  │ │  💪  │     │
│  │蛋白质 │ │第一顿 │ │热量掌 │     │
│  │达人   │ │  饭  │ │  控  │     │
│  │■■■□□ │ │  🟢  │ │■■□□□ │     │
│  └──────┘ └──────┘ └──────┘     │
│  ┌──────┐                        │
│  │  🏆  │                        │
│  │百次记录│                       │
│  │■■■□□ │                        │
│  └──────┘                        │
│                                  │
└──────────────────────────────────┘
```

每个徽章卡片：
- 上方大 emoji
- 中间名称
- 下方：已解锁显示 `🟢` + 日期，未解锁显示进度条 `■■■□□` + `3/7天`

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/stores/achievementStore.ts` | 成就状态管理 + checkAndUnlock |
| NEW | `src/components/achievements/AchievementBadge.tsx` | 单个徽章卡片 |
| NEW | `src/components/achievements/AchievementWall.tsx` | 徽章墙弹窗 Modal |
| MODIFY | `src/app/(tabs)/home.tsx` | 导入 + 徽章进度条 + 弹窗状态 |
| MODIFY | `src/app/(tabs)/add-food.tsx` | 保存成功后调用 checkAndUnlock |
| MODIFY | `src/stores/AsyncStorage 初始化` | 在 useAchievementStore 中注册 storage key |

---

## Feature 4: 饮食模式分析（Diet Pattern Alert）

### 目标

检测用户饮食中的问题模式，仅展示触发了的问题（没问题时不显示），帮助用户意识到并改善不良习惯。

### 检测规则（5项）

| ID | 检测项 | 触发条件 | 预警文本模板 |
|----|--------|---------|-------------|
| `dinner_heavy` | 晚餐热量过高 | 晚餐热量 > 全天热量 × 50% | `晚餐占全天 {pct}%，热量集中在晚上不利于代谢` |
| `carbs_high` | 碳水占比过高 | 碳水热量 > 总摄入 × 65% | `碳水占 {pct}%，试试增加蛋白质比例` |
| `protein_low` | 蛋白质不足 | 蛋白质 < 目标 × 80% | `蛋白质只达目标 {pct}%，多吃蛋奶豆制品` |
| `over_calorie_streak` | 连续超标 | 连续≥3天 净摄入 > 目标 | `连续 {days} 天超目标热量，注意控制` |
| `repeated_food` | 食物重复 | 同日同食物名称出现≥3次 | `今天吃了 {count} 次{name}，换点花样营养更均衡` |

### 数据来源

- `useFoodStore().allEntries` — 当天 + 最近几天的记录
- `useProfileStore().profile` — 蛋白质目标
- 纯计算，不额外存储

### 计算逻辑

```typescript
function analyzeDietPatterns(
  allEntries: FoodEntry[],
  proteinTarget: number,
  todayKey: string
): AlertItem[] {
  const alerts: AlertItem[] = [];

  // 获取今天数据
  const todayEntries = filterByDate(allEntries, todayKey);
  const totalCal = sum(todayEntries, 'calories');
  const totalProtein = sum(todayEntries, 'protein');
  const totalCarbs = sum(todayEntries, 'carbs');
  const totalFat = sum(todayEntries, 'fat');

  // 1. 晚餐占比
  const dinnerCal = sum(todayEntries.filter(e => e.mealType === 'dinner'), 'calories');
  const dinnerPct = totalCal > 0 ? dinnerCal / totalCal : 0;
  if (dinnerPct > 0.5) {
    alerts.push({
      type: 'warning',
      message: `晚餐占全天 ${Math.round(dinnerPct * 100)}%，热量集中在晚上不利于代谢`,
    });
  }

  // 2. 碳水占比
  const carbsCal = totalCarbs * 4;
  const fatCal = totalFat * 9;
  const proteinCal = totalProtein * 4;
  const totalMacroCal = carbsCal + fatCal + proteinCal;
  const carbsPct = totalMacroCal > 0 ? carbsCal / totalMacroCal : 0;
  if (carbsPct > 0.65 && totalCal > 300) {
    alerts.push({
      type: 'info',
      message: `碳水占 ${Math.round(carbsPct * 100)}%，试试增加蛋白质比例`,
    });
  }

  // 3. 蛋白质不足
  const proteinPct = proteinTarget > 0 ? totalProtein / proteinTarget : 1;
  if (proteinPct < 0.8 && totalCal > 300) {
    alerts.push({
      type: 'warning',
      message: `蛋白质只达目标 ${Math.round(proteinPct * 100)}%，多吃蛋奶豆制品`,
    });
  }

  // 4. 连续超标
  let overStreak = 0;
  for (let i = 0; i < 7; i++) {
    const dk = getDateKey(-i);
    const entries = filterByDate(allEntries, dk);
    const cal = sum(entries, 'calories');
    const exercise = getExerciseKcal(dk);
    if (cal - exercise > dailyCalories) {
      overStreak++;
    } else {
      break;
    }
  }
  if (overStreak >= 3) {
    alerts.push({
      type: 'warning',
      message: `连续 ${overStreak} 天超目标热量，注意控制`,
    });
  }

  // 5. 食物重复
  const foodCounts: Record<string, number> = {};
  todayEntries.forEach(e => { foodCounts[e.name] = (foodCounts[e.name] || 0) + 1; });
  for (const [name, count] of Object.entries(foodCounts)) {
    if (count >= 3) {
      alerts.push({
        type: 'info',
        message: `今天吃了 ${count} 次${name}，换点花样营养更均衡`,
      });
    }
  }

  return alerts;
}
```

### UI 展示

在智能分析卡片中，作为子区域：

```
⚠️ 饮食洞察 (2项)
┌──────────────────────────────────┐
│ ⚠️ 晚餐占全天 58%，热量集中在   │
│    晚上不利于代谢                │
├──────────────────────────────────┤
│ ℹ️ 蛋白质只达目标 72%，多吃蛋   │
│    奶豆制品                     │
└──────────────────────────────────┘
```

- `type: 'warning'` → 橙色左边框 `⚠️`
- `type: 'info'` → 蓝色左边框 `ℹ️`
- 无预警时整个区域不渲染

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/insights/DietPatternAlert.tsx` | 预警卡片组件 + 分析函数 |
| MODIFY | `src/app/(tabs)/home.tsx` | 集成到智能分析卡片中 |

---

## Feature 5: 月度评级（Monthly Rating）

### 目标

给用户一个直观的字母评级（S/A/B/C/D），基于近30天热量达标率。

### 评级规则

```typescript
function getMonthlyRating(allEntries: FoodEntry[], dailyTarget: number): {
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  rate: number;   // 0-1 达标率
  days: number;   // 有记录的天数
} {
  let totalDays = 0;
  let onTargetDays = 0;

  for (let i = 0; i < 30; i++) {
    const dk = getDateKey(-i);
    const entries = filterByDate(allEntries, dk);
    if (entries.length === 0) continue; // 跳过无记录的天
    totalDays++;
    const cal = sum(entries, 'calories');
    if (cal <= dailyTarget) onTargetDays++;
  }

  const rate = totalDays > 0 ? onTargetDays / totalDays : 0;

  let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
  if (rate >= 0.9) grade = 'S';
  else if (rate >= 0.75) grade = 'A';
  else if (rate >= 0.5) grade = 'B';
  else if (rate >= 0.25) grade = 'C';

  return { grade, rate, days: totalDays };
}
```

### 评级颜色

| 评级 | 颜色 | 含义 |
|------|------|------|
| S | 🟡 金色 #FFD700 | 优秀 |
| A | 🟢 绿色 #4CAF50 | 良好 |
| B | 🔵 蓝色 #2196F3 | 一般 |
| C | 🟠 橙色 #FF9800 | 需注意 |
| D | 🔴 红色 #F44336 | 需要改善 |

### UI 展示

```
🏆 本月评级
┌──────┐
│      │  近30天 82% 天数热量达标
│  A   │  记录天数: 26天
│      │
└──────┘
```

大字母居中，背景色随评级变化。

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/insights/MonthlyRating.tsx` | 评级卡片 |
| MODIFY | `src/app/(tabs)/home.tsx` | 集成到智能分析卡片中 |

---

## Feature 6: 达标预测（Goal Prediction）

### 目标

基于近14天的体重数据，用简单线性回归预测达到目标体重的日期。

### 数据来源

- `useProfileStore().weightHistory` — `{ date: string, weight: number }[]`
- `useProfileStore().profile.goalWeightKg` — 目标体重

### 计算逻辑

```typescript
function predictGoalDate(
  weightHistory: { date: string; weight: number }[],
  goalWeight: number
): { prediction: 'achieved' | 'on_track' | 'wrong_direction' | 'insufficient_data';
    daysToGoal?: number;
    date?: string;
    weeklyChange?: number;
    currentWeight?: number;
} {
  // 取最近14天数据，按日期排序
  const recent = weightHistory
    .filter(w => {
      const daysAgo = (Date.now() - new Date(w.date).getTime()) / (86400000);
      return daysAgo >= 0 && daysAgo <= 14;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (recent.length < 5) return { prediction: 'insufficient_data' };

  const currentWeight = recent[recent.length - 1].weight;

  if (currentWeight <= goalWeight) return { prediction: 'achieved', currentWeight };

  // 简单线性回归: y = slope * x + intercept
  // x = 天数索引(0...n-1), y = 体重
  const n = recent.length;
  const xMean = (n - 1) / 2;
  const yMean = recent.reduce((s, w) => s + w.weight, 0) / n;
  let num = 0, den = 0;
  recent.forEach((w, i) => {
    num += (i - xMean) * (w.weight - yMean);
    den += (i - xMean) ** 2;
  });
  const slope = num / den;

  if (slope >= 0) {
    // 体重持平或上升，方向不对
    const weeklyChange = Math.round(slope * 7 * 100) / 100;
    return { prediction: 'wrong_direction', weeklyChange, currentWeight };
  }

  // 计算还需要多少天
  const daysToGoal = Math.round((goalWeight - currentWeight) / slope);
  const targetDate = new Date(Date.now() + daysToGoal * 86400000);
  const weeklyChange = Math.round(Math.abs(slope) * 7 * 100) / 100;

  return {
    prediction: 'on_track',
    daysToGoal: Math.max(1, daysToGoal),
    date: `${targetDate.getMonth() + 1}月${targetDate.getDate()}日`,
    weeklyChange,
    currentWeight,
  };
}
```

### UI 展示

三种情况：

**A. 正在减重中（on_track）**
```
📈 达标预测
按当前趋势，预计 18 天后 (6月1日) 达到目标 60kg
↓0.35kg/周
```

**B. 体重反弹（wrong_direction）**
```
📈 达标预测
近14天体重 ↑0.3kg/周，需要调整饮食
当前 63kg → 目标 60kg
```

**C. 已达标（achieved）**
```
🎉 已达成目标体重 60kg！
继续加油保持！
```

**D. 数据不足（insufficient_data）**
```
📈 达标预测
再记录 5 天体重就能查看预测
```

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/insights/GoalPrediction.tsx` | 预测卡片 + 计算函数 |
| MODIFY | `src/app/(tabs)/home.tsx` | 集成到智能分析卡片中 |

---

## 首页整合设计

### SmartAnalysis 容器组件

```typescript
// src/components/insights/SmartAnalysis.tsx
interface SmartAnalysisProps {
  allEntries: FoodEntry[];
  todayKey: string;
  dailyCalories: number;
  proteinTarget: number;
  exerciseKcal: number;
  weightHistory: { date: string; weight: number }[];
  goalWeight: number;
  onOpenAchievements: () => void;
  achievementProgress: { unlocked: number; total: number };
}
```

### 首页布局（最终效果）

```
┌──────────────────────────────────┐
│  ‹       5月14日 周三         ›  │
│        🔥 连续记录 12 天         │
│                                  │
│  🏃 运动消耗       [  300] kcal │
│  🔥 热量缺口         +350 kcal   │
│  ⚖️ 当前体重  63kg → 目标 60kg  │
│                                  │
│         [CalorieRing]            │
│    [蛋白质 ████░░]               │
│    [碳水   ██████░]              │
│    [脂肪   ███░░░░]              │
│         [MacroPieChart]          │
│                                  │
│         [PhotoGallery]           │
│                                  │
│  🧠 智能分析                     │
│  ┌──────────────────────────────┐│
│  │ 🏆 本月评级            A     ││
│  │    近30天 82% 天数达标       ││
│  │                              ││
│  │ 📈 达标预测                  ││
│  │    预计18天后(6月1日)达60kg  ││
│  │    ↓0.35kg/周               ││
│  │                              ││
│  │ ⚠️ 饮食洞察 (2项)            ││
│  │  · 晚餐占全天58%，分到白天   ││
│  │  · 蛋白质72%，多吃蛋奶      ││
│  │                              ││
│  │ 🏅 成就  4/7 已解锁 [查看>]  ││
│  └──────────────────────────────┘│
│                                  │
│  📊 本周营养报告                 │
│  [WeeklyBarChart]                │
│  日均:1680 | 蛋白:78g | 7天     │
│  [📈 查看近30天趋势 >]           │
│                                  │
│  今日饮食                        │
│  早餐  450 kcal                  │
│  [FoodCard] [FoodCard]           │
│  午餐  680 kcal                  │
│  [FoodCard]                      │
│  ...                             │
└──────────────────────────────────┘
```

智能分析卡片位于 MacroPieChart 下方、WeeklyReport 上方。

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/insights/SmartAnalysis.tsx` | 智能分析容器 |
| MODIFY | `src/app/(tabs)/home.tsx` | 导入 + 替换当前位置 |

---

## 完整文件变更总览

### 新增文件 (13个)

| 文件 | 模块 |
|------|------|
| `src/components/ui/Skeleton.tsx` | 加载动效 |
| `src/utils/haptics.ts` | 触感反馈 |
| `src/stores/achievementStore.ts` | 成就系统 |
| `src/components/achievements/AchievementBadge.tsx` | 单个徽章展示 |
| `src/components/achievements/AchievementWall.tsx` | 徽章墙弹窗 |
| `src/components/insights/SmartAnalysis.tsx` | 智能分析容器 |
| `src/components/insights/DietPatternAlert.tsx` | 饮食模式预警 |
| `src/components/insights/MonthlyRating.tsx` | 月度评级 |
| `src/components/insights/GoalPrediction.tsx` | 达标预测 |

### 修改文件 (4个)

| 文件 | 变更内容 |
|------|---------|
| `src/app/(tabs)/home.tsx` | 集成智能分析卡片 + 骨架屏 + 触感反馈 + 徽章入口 |
| `src/app/(tabs)/add-food.tsx` | 骨架屏(loading) + 触感反馈(保存) + checkAndUnlock |
| `src/app/(tabs)/coach.tsx` | 骨架屏(首次加载) |
| `src/stores/profileStore.ts` | 确认 weightHistory 数据结构适配 |

---

## 数据依赖关系

```
achievementStore
  ├── useFoodStore().allEntries      (连续记录、拍照、食物重复)
  ├── useFoodStore().getStreak()     (连续天数)
  ├── useProfileStore().weightHistory (体重下降)
  └── useProfileStore().profile      (蛋白质目标)

SmartAnalysis
  ├── MonthlyRating
  │   └── useFoodStore().allEntries (30天热量)
  ├── GoalPrediction
  │   └── useProfileStore().weightHistory (14天体重点)
  ├── DietPatternAlert
  │   ├── useFoodStore().allEntries (当天+近期记录)
  │   └── useProfileStore().profile (蛋白质目标)
  └── AchievementWall
      └── useAchievementStore()

Haptics
  └── (无数据依赖，纯副作用)
```

---

## 实现顺序（建议）

| 优先级 | 功能 | 复杂度 | 依赖 |
|--------|------|--------|------|
| 1 | 触感反馈 | 极低 | expo-haptics |
| 2 | 加载动效 | 低 | Animated API |
| 3 | 成就徽章 | 中 | AsyncStorage + foodStore |
| 4 | 饮食模式分析 | 中低 | 纯计算 |
| 5 | 月度评级 | 低 | 纯计算 |
| 6 | 达标预测 | 中 | profileStore.weightHistory |

---

## 非功能需求

- **骨架屏帧率**: Shimmer 动画 60fps，使用 `useNativeDriver: true`
- **徽章检查频率**: 每次保存食物/打开首页时自动检查
- **模式分析频率**: 首页渲染时计算（数据量小，无需缓存）
- **震动权限**: 无需额外权限，`expo-haptics` 开箱即用
- **暗黑模式**: 本期不做（后续单独迭代）
