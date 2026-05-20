# NutriFlow — OCR营养标签 + 千焦转换器 + 周月报告 + 自动餐次 设计文档

Date: 2026-05-14

## Overview

新增4个功能模块：

1. **营养成分表OCR识别** — 拍照识别食品包装营养标签，AI解析结构化营养数据
2. **千焦↔千卡转换器** — 集成在OCR流程中 + 独立转换弹窗
3. **周/月营养报告** — 首页新增7天柱状图 + 30天趋势折线图
4. **自动识别餐次** — 根据当前时间自动选中早/午/晚/加餐

---

## Feature 1: 营养成分表OCR识别 (`ocr-nutrition-label`)

### 目标

用户拍摄食品包装背面的营养成分表，AI自动解析出所有营养数据并结构化显示，用户只需输入吃了多少克即可记录。

### 与现有AI食物识别的区别

| 特性 | 现有AI食物识别 | 新OCR营养标签识别 |
|------|---------------|-------------------|
| 输入 | 食物本身照片 | 营养成分表照片 |
| AI任务 | 识别食物种类+估算营养 | 读取表格文字+结构化提取 |
| 输出 | 多食物列表+估算营养 | 单一食品完整营养数据 |
| 置信度 | 视觉估算，中等 | 文字读取，高 |
| 份量 | AI估算份量 | 用户输入实际吃了多少克 |

### AI Prompt 设计

专用 System Prompt：指示AI从营养成分表图片中提取所有营养数据，输出结构化JSON。
关键规则：
- 提取每100g或每份的营养数据
- 自动将千焦换算为千卡（kJ ÷ 4.184）
- 同时返回原始kJ值和换算后的kcal值
- 识别份量标签说明（如"每100g"、"每份(250ml)"）
- 如果图片模糊或不是营养标签，返回error

### 返回数据结构

```typescript
interface NutritionLabelResult {
  // 标签基准数据
  energy_kj: number;           // 原始千焦值
  energy_kcal: number;         // AI自动换算的千卡值
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  saturated_fat_g: number;
  trans_fat_g: number;

  // 标签元信息
  serving_label: string;       // "每100g" / "每份(250ml)"
  serving_base_grams: number;  // 标签基准克数（通常100）
  product_name: string;        // AI尝试读取的产品名

  error?: string;
}
```

### UI 流程

```
┌─────────────────────────────────────┐
│  添加食物页面 (add-food.tsx)         │
│                                      │
│  [📷 拍照识别]  [🖼️ 相册选择]        │  ← 现有AI食物识别
│                                      │
│  [📋 识别营养标签]                    │  ← 新增按钮
│       ↑ 独立入口，带虚线边框          │
│                                      │
├─────────────────────────────────────┤
│  (点击后 → 拍照/选图 → 发送AI)       │
├─────────────────────────────────────┤
│                                      │
│  ┌── OCR识别结果 ────────────────┐  │
│  │ 产品: XX饼干                   │  │
│  │ 标签基准: 每100g              │  │
│  │ ┌──────────┬──────────┐      │  │
│  │ │ 能量(kJ)  │  1520kJ  │      │  │
│  │ │ 能量(kcal)│  363kcal │ ←自动换算│
│  │ │ 蛋白质    │  12.5g   │      │  │
│  │ │ 脂肪      │  8.6g    │      │  │
│  │ │ 碳水      │  55.2g   │      │  │
│  │ │ 纤维      │  3.2g    │      │  │
│  │ │ 糖        │  5.1g    │      │  │
│  │ │ 钠        │  320mg   │      │  │
│  │ └──────────┴──────────┘      │  │
│  │                               │  │
│  │ 我吃了: [    ] 克             │  │ ← 用户输入
│  │ 实际摄入: XX kcal             │  │ ← 按比例计算
│  │                               │  │
│  │ [取消]   [保存到午餐]         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 份量计算逻辑

```
用户实际摄入 = (用户输入克数 / 标签基准克数) × 每项营养数据
```

例：标签基准100g，用户吃了35g → 所有营养数据 × 0.35

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/services/ai/prompts/nutritionLabel.ts` | OCR专用System Prompt |
| NEW | `src/components/food/NutritionLabelResult.tsx` | OCR结果展示卡片组件 |
| MODIFY | `src/app/(tabs)/add-food.tsx` | 新增「识别营养标签」按钮 + OCR流程状态管理 |
| MODIFY | `src/types/index.ts` | 新增 `NutritionLabelResult` 类型 |
| MODIFY | `src/services/ai/AIClient.ts` | 新增 `analyzeNutritionLabel()` 方法 |

---

## Feature 2: 千焦↔千卡转换器 (`kj-kcal-converter`)

### 目标

千焦(kJ)是中国食品标签的法定单位，但普通用户更习惯千卡(kcal/大卡)。提供实时双向转换工具。

### 转换公式

```
kcal = kJ ÷ 4.184
kJ  = kcal × 4.184
```

### 集成方式

**A. OCR流程中内置**（自动转换）
- OCR识别营养标签时，AI返回 `energy_kj` 和 `energy_kcal` 两值
- 结果卡片同时显示 kJ 和 kcal，无需用户手动算
- 这是默认行为，用户无需额外操作

**B. 独立转换器弹窗**
- 在 `add-food.tsx` 页面右上角增加 `⚡` 图标按钮
- 点击弹出底部 Sheet（Modal）

### 独立转换器 UI

```
┌───────────────────────────┐
│  ⚡ 千焦 ↔ 千卡 转换器     │
│                            │
│  ┌──────────────────────┐ │
│  │ 千焦                  │ │
│  │ [________________] kJ │ │  ← 用户输入
│  │         ↓              │ │
│  │    363.3  kcal        │ │  ← 实时换算
│  └──────────────────────┘ │
│                            │
│  ┌──────────────────────┐ │
│  │ 千卡                  │ │
│  │ [________________] kcal│ │  ← 反向输入
│  │         ↓              │ │
│  │    1520  kJ            │ │  ← 实时换算
│  └──────────────────────┘ │
│                            │
│  公式: 1 kcal = 4.184 kJ   │
│                            │
│        [关闭]              │
└───────────────────────────┘
```

### 实现细节

- 两个输入框双向绑定，任一输入变化时另一框自动更新
- 保留1位小数
- 输入为空时另一方显示 `—`
- 公式提示放在底部

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/food/KjKcalConverter.tsx` | 转换器弹窗组件 |
| MODIFY | `src/app/(tabs)/add-food.tsx` | 页面右上角加 ⚡ 按钮 + Modal状态 |

---

## Feature 3: 周/月营养报告 (`weekly-monthly-report`)

### 目标

在首页显示本周7天热量柱状图和趋势，支持展开查看近30天趋势图。用可视化帮助用户了解自己的饮食习惯。

### 数据来源

- `useFoodStore().allEntries` — 所有历史食物记录
- `useFoodStore().getSummary(dateKey)` — 单日汇总
- 纯计算，无需额外存储

### UI 布局（放在首页 MacroPieChart 下方）

```
┌─────────────────────────────────────┐
│ 📊 本周营养报告                      │
│                                      │
│   kcal                               │
│  2000 ┤         ██                    │
│  1800 ┤  ██     ██  ██               │
│  1600 ┤  ██  ██  ██  ██  ██  ██      │
│  1400 ┤  ██  ██  ██  ██  ██  ██      │
│  1200 ┤  ██  ██  ██  ██  ██  ██      │
│       ├───┬───┬───┬───┬───┬───┬───   │
│       一  二  三  四  五  六  日       │
│                                      │
│  ┌───────────┬───────────┬─────────┐ │
│  │ 日均热量    │ 日均蛋白质  │ 记录天数 │ │
│  │ 1680 kcal │  78g      │   7天   │ │
│  └───────────┴───────────┴─────────┘ │
│                                      │
│  [📈 查看近30天趋势 >]               │  ← 点击展开
└─────────────────────────────────────┘
```

### 展开月报告

点击「查看近30天趋势」→ 在当前位置展开，不跳页：

```
┌─────────────────────────────────────┐
│ 📈 近30天趋势              [收起 ▲] │
│                                      │
│  (折线图)                            │
│  2000 ┤ ··                           │
│  1800 ┤   ··  ··                     │
│  1600 ┤      ··  ····                │
│  1400 ┤              ····            │
│       └─────────────────────         │
│       15天前             今天        │
│                                      │
│  月度统计                             │
│  最高日: 2230 kcal (5月8日)           │
│  最低日: 1340 kcal (5月2日)           │
│  月平均: 1770 kcal/天                │
│  总摄入: 53,100 kcal                 │
│  蛋白质平均: 82g/天                   │
└─────────────────────────────────────┘
```

### 图表实现

- 柱状图：7根柱子，高度对应热量，颜色用 COLORS.primary，当天高亮
- 折线图：30个数据点的SVG Path，带虚线网格
- 全部用 `react-native-svg`（已安装）绘制
- X轴自动标注星期几
- Y轴自适应范围（动态计算max值）

### 周报告柱状图组件设计

```typescript
interface WeeklyBarChartProps {
  data: { dateKey: string; label: string; calories: number; protein: number }[];
}
```

- `label` = 一/二/三/四/五/六/日
- 每根柱子分两段：蛋白质部分（COLORS.protein）+ 其余（COLORS.primary 半透明）
- 当天柱子有特殊高亮边框

### 月报告折线图组件设计

```typescript
interface MonthlyLineChartProps {
  data: { dateKey: string; label: string; calories: number }[];
}
```

- 30个数据点
- SVG Path 绘制平滑曲线（贝塞尔插值）
- 背景虚线水平网格
- 最高点和最低点标注

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| NEW | `src/components/charts/WeeklyBarChart.tsx` | 7天柱状图组件 |
| NEW | `src/components/charts/MonthlyTrendChart.tsx` | 30天趋势折线图组件 |
| NEW | `src/components/reports/WeeklyReport.tsx` | 周报告容器（含柱状图+统计卡片） |
| NEW | `src/components/reports/MonthlyReport.tsx` | 月报告容器（含折线图+月度统计） |
| MODIFY | `src/app/(tabs)/home.tsx` | 在MacroPieChart下方添加周/月报告区域 |

---

## Feature 4: 自动识别餐次 (`auto-meal-type`)

### 目标

用户打开添加食物页面时，根据当前时间自动选中最合适的餐次，减少手动切换操作。

### 时间映射表

| 时间段 | 自动选中 | 餐次类型 |
|--------|---------|---------|
| 05:00 - 10:59 | 早餐 | `breakfast` |
| 11:00 - 13:59 | 午餐 | `lunch` |
| 14:00 - 16:59 | 加餐 | `snack` |
| 17:00 - 20:59 | 晚餐 | `dinner` |
| 21:00 - 04:59 | 加餐 | `snack` |

### 交互行为

- 页面加载时，`useEffect` 计算当前时间 → 设置 `selectedMeal` 默认值
- 用户仍然可以手动点击餐次Chip切换
- 不影响其他逻辑（AI识别、手动录入、食物库搜索等）

### 实现

```typescript
function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'snack';
  if (hour >= 17 && hour < 21) return 'dinner';
  return 'snack';
}
```

在 `add-food.tsx` 中：

```typescript
const [selectedMeal, setSelectedMeal] = useState<MealType>(getDefaultMealType);
```

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `src/app/(tabs)/add-food.tsx` | `useState` 初始值改为 `getDefaultMealType()` |

---

## Feature 5: AI Client 扩展 (`analyzeNutritionLabel`)

### 目标

在现有 `AIClient.ts` 中新增 `analyzeNutritionLabel()` 方法，与现有的 `analyzeFood()` 并列。

### API调用方式

- 与 `analyzeFood()` 相同的调用模式
- 不同的 System Prompt
- 使用相同的图片压缩/Base64预处理逻辑
- 返回 `NutritionLabelResult` 类型

### 方法签名

```typescript
async analyzeNutritionLabel(imageBase64: string): Promise<NutritionLabelResult>
```

### 文件变更

| 操作 | 文件 | 说明 |
|------|------|------|
| MODIFY | `src/services/ai/AIClient.ts` | 新增 `analyzeNutritionLabel()` 方法 |
| NEW | `src/services/ai/prompts/nutritionLabel.ts` | System Prompt |
| MODIFY | `src/types/index.ts` | 新增 `NutritionLabelResult` 接口 |

---

## 完整文件变更总览

### 新增文件 (7个)

| 文件 | 模块 |
|------|------|
| `src/services/ai/prompts/nutritionLabel.ts` | OCR营养标签 Prompt |
| `src/components/food/NutritionLabelResult.tsx` | OCR结果卡片 |
| `src/components/food/KjKcalConverter.tsx` | 千焦转换器弹窗 |
| `src/components/charts/WeeklyBarChart.tsx` | 周柱状图 |
| `src/components/charts/MonthlyTrendChart.tsx` | 月趋势折线图 |
| `src/components/reports/WeeklyReport.tsx` | 周报告容器 |
| `src/components/reports/MonthlyReport.tsx` | 月报告容器 |

### 修改文件 (3个)

| 文件 | 变更内容 |
|------|---------|
| `src/types/index.ts` | 新增 `NutritionLabelResult` 接口 |
| `src/services/ai/AIClient.ts` | 新增 `analyzeNutritionLabel()` 方法 |
| `src/app/(tabs)/add-food.tsx` | 加OCR按钮、转换器入口按钮、自动餐次默认值 |
| `src/app/(tabs)/home.tsx` | 添加 `WeeklyReport` + `MonthlyReport` 区域 |

---

## 模块依赖关系

```
NutritionLabelPrompt
        ↓
    AIClient.analyzeNutritionLabel()  ← 新增方法
        ↓
NutritionLabelResult (component)
        ↓
    add-food.tsx (新增OCR按钮入口 + OCR结果展示)

KjKcalConverter (component)  ← 独立组件
        ↓
    add-food.tsx (右上角⚡按钮)

WeeklyBarChart → WeeklyReport
MonthlyTrendChart → MonthlyReport  ← 纯前端Chart，用SVG
        ↓
    home.tsx (新增报告区域)

getDefaultMealType()  ← 纯函数
        ↓
    add-food.tsx (useState初始值)
```

---

## 数据流

```
┌─────────┐    ┌───────────┐    ┌──────────────────┐
│ 拍照/选图 │ →  │ toBase64  │ →  │ AI分析            │
│ 营养标签  │    │ (已有函数) │    │ analyzeNutrition- │
└─────────┘    └───────────┘    │ Label()          │
                                 └──────┬───────────┘
                                        │
                               ┌────────▼───────────┐
                               │ NutritionLabelResult│
                               │ { energy_kj,        │
                               │   energy_kcal,      │
                               │   protein_g, ... }  │
                               └────────┬───────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │ 用户输入"我吃了X克"         │
                          │ → 按比例计算实际营养摄入    │
                          └─────────────┬─────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │ addFoodFromAnalysis()      │
                          │ → foodStore持久化          │
                          └───────────────────────────┘
```

---

## 实现顺序（建议）

| 优先级 | 功能 | 复杂度 | 依赖 |
|--------|------|--------|------|
| 1 | 自动识别餐次 | 极低 | 无 |
| 2 | 千焦转换器 | 低 | 无 |
| 3 | 营养成分表OCR | 高 | AIClient扩展 |
| 4 | 周/月营养报告 | 中高 | SVG图表 |

理由：先做简单的快速交付，OCR需要Prompt调试，报告需要SVG绘制。

---

## 非功能需求

- **OCR识别超时**：最长15秒，超时同现有AI食物识别的错误处理
- **周报告缓存**：当日数据变化时自动刷新，不额外缓存（数据量小）
- **月报告性能**：30天数据点，纯前端计算，无需分页
- **转换器精度**：保留1位小数，公式 `÷ 4.184`
- **深色模式**：本期不做（后续单独迭代）
