# NutriFlow Feature Enhancement Design

Date: 2026-05-13

## Overview

Add 4 core features to NutriFlow:

1. Built-in Food Database with fuzzy search
2. Macro Nutrient Pie Chart (macro distribution visualization)
3. Streak/Consistency Tracking
4. Food Photo Album

***

## Feature 1: Built-in Food Database (`database/`)

### Goal

Allow users to search common foods by name (Chinese), get nutrition data instantly, and add with one tap — no AI call or manual entry needed.

### Approach: Local JSON database

* Create a JSON file `src/data/foods.json` containing 500+ common Chinese foods

* Data sources: Chinese Food Composition Table (中国食物成分表), common restaurant dishes

* Each entry:

```json
{
  "id": "food_001",
  "name": "米饭",
  "name_en": "rice",
  "aliases": ["白米饭", "白饭"],
  "category": "主食",
  "serving_size_grams": 100,
  "serving_description": "100g (约1小碗)",
  "nutrients": {
    "calories_kcal": 116,
    "protein_g": 2.6,
    "carbs_g": 25.9,
    "fat_g": 0.3,
    "fiber_g": 0.3,
    "sugar_g": 0,
    "sodium_mg": 2
  }
}
```

### Search Logic

* Fuzzy matching by `name` and `aliases`

* Support partial matches: "米" → matches "米饭", "小米粥", "糯米"

* Show top 10 results sorted by relevance

* Category filter chips: 主食/肉类/蔬菜/水果/零食/饮品

### UI: Search Modal on Add-Food Page

```
┌─────────────────────────┐
│  🔍 搜索食物...         │ ← Search input with clear button
├─────────────────────────┤
│ [主食] [肉类] [蔬菜]    │ ← Category filter chips
├─────────────────────────┤
│ 米饭             116cal │
│ 小米粥            46cal │  ← Search results, tap to add
│ 糯米             348cal │
│ ...                    │
├─────────────────────────┤
│  份量: [100] g  [-] [+] │ ← Serving size adjust
│     [添加到午餐]        │ ← Add button
└─────────────────────────┘
```

### Files to modify

* NEW: `src/data/foods.ts` — 500+ food entries + search function

* NEW: `src/components/food/FoodSearchModal.tsx` — search UI

* MODIFY: `src/app/(tabs)/add-food.tsx` — add "📖 食物库" button in quick section

***

## Feature 2: Macro Nutrient Pie Chart (`piechart/`)

### Goal

Show today's protein/carbs/fat ratio as a donut/pie chart on the home page, so users can visually see if their macro distribution is balanced.

### Approach: react-native-svg (already installed)

* Use existing `react-native-svg` to draw a simple pie chart

* Position it next to the CalorieRing or replace the MacroBar section

* Show percentage labels on each segment

### UI

```
     ╭─────────────╮
     │    🥧       │
     │  蛋白质 25% │  ← Protein (blue/COLORS.protein)
     │  碳水 50%   │  ← Carbs (orange/COLORS.carbs)
     │  脂肪 25%   │  ← Fat (pink/COLORS.fat)
     ╰─────────────╯
```

* Pie segments: protein (blue), carbs (orange), fat (pink)

* Center text: target grams (e.g. "80g / 120g / 40g")

* Below chart: legend with exact values

### Files to create/modify

* NEW: `src/components/charts/MacroPieChart.tsx`

* MODIFY: `src/app/(tabs)/home.tsx` — add pie chart in macro section

***

## Feature 3: Streak Tracking (`streak/`)

### Goal

Show "🔥 已连续记录 X 天" on the home page to motivate consistent logging.

### Approach: Calculate from `allEntries`

* Scan `allEntries` from most recent day backwards

* Count consecutive days where at least 1 food entry exists

* Store streak data in `foodStore` as a computed function

### Logic

```typescript
getStreak(): number {
  const all = this.allEntries;
  let streak = 0;
  const today = new Date();
  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = dateToKey(d.getTime());
    const start = getStartOfDay(dateKey);
    const end = getEndOfDay(dateKey);
    const hasEntry = all.some(e => e.createdAt >= start && e.createdAt <= end && !e.deletedAt);
    if (hasEntry) {
      streak++;
    } else if (i > 0) {  // skip today if no entries yet, but break if yesterday has none
      break;
    }
  }
  return streak;
}
```

### UI: Small badge on Home page header

* Display: `🔥 连续记录 ${streak} 天`

* Add a fire emoji streak counter badge next to the date

### Files to modify

* MODIFY: `src/stores/foodStore.ts` — add `getStreak()` method

* MODIFY: `src/app/(tabs)/home.tsx` — display streak badge

***

## Feature 4: Food Photo Album (`album/`)

### Goal

Auto-save food photos taken during AI recognition, and display them in a visual gallery on a new tab or on the home page.

### Approach: Store image URIs in entries

* `FoodEntry` already has `imageUri?: string` field

* When saving from AI recognition, save the image locally and store the URI

* Create a photo gallery view on the Home page

### Photo storage

* On mobile: save to app's document directory using `expo-file-system`

* On web: data URI or blob URL

* Display thumbnails in a horizontal scroll on the home page

### UI: Photo Strip on Home Page

```
┌──────────────────────────────┐
│ 📸 今日饮食记录     [查看全部] │
├──────────────────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│ │🍚│ │🥗│ │🍎│ │☕│  ...  │ ← Horizontal scroll of thumbnails
│ └──┘ └──┘ └──┘ └──┘       │
│  米饭  沙拉  苹果  咖啡      │
└──────────────────────────────┘
```

* Tap a photo → full-screen view with food details overlay

* Only show entries that have `imageUri`

### Files to create/modify

* NEW: `src/components/food/PhotoGallery.tsx` — photo strip component

* NEW: `src/components/food/PhotoViewer.tsx` — full-screen photo viewer

* MODIFY: `src/app/(tabs)/home.tsx` — add photo gallery section

* MODIFY: `src/stores/foodStore.ts` — add `getTodayPhotos()` method

***

## Implementation Order

| Priority | Feature          | Complexity       | Dependencies                  |
| -------- | ---------------- | ---------------- | ----------------------------- |
| 1        | Food Database    | High (data + UI) | None                          |
| 2        | Macro Pie Chart  | Low              | None (react-native-svg ready) |
| 3        | Streak Tracking  | Low              | None                          |
| 4        | Food Photo Album | Medium           | expo-file-system              |

## Files Changed Summary

| File                                      | Change                                     |
| ----------------------------------------- | ------------------------------------------ |
| `src/data/foods.ts`                       | NEW — 500+ food entries                    |
| `src/components/food/FoodSearchModal.tsx` | NEW — search UI                            |
| `src/components/charts/MacroPieChart.tsx` | NEW — SVG pie chart                        |
| `src/components/food/PhotoGallery.tsx`    | NEW — photo strip                          |
| `src/components/food/PhotoViewer.tsx`     | NEW — full-screen viewer                   |
| `src/stores/foodStore.ts`                 | ADD getStreak(), getTodayPhotos()          |
| `src/app/(tabs)/home.tsx`                 | ADD streak badge, pie chart, photo gallery |
| `src/app/(tabs)/add-food.tsx`             | ADD "📖 食物库" button                        |

