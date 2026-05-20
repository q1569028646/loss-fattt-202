# 中国食物成分表 JSON 数据整合方案

## 1. 目标
- 将下载的 63 个 JSON 文件（1657 条食物数据）完整整合到 NutriFlow 中
- 保持 JSON 文件原样不动
- 删除旧的食谱数据（foods.ts 旧内容、generate-food-db.js 脚本）
- 适配现有 App 功能，确保无 Bug

## 2. JSON 数据结构

每个 JSON 文件是数组，包含完整营养数据：

```json
{
  "foodCode": "012001x",
  "foodName": "稻米（代表值）",
  "edible": "100",        // 可食部 %
  "energyKCal": "346",    // 能量 kcal
  "energyKJ": "1453",     // 能量 kJ
  "protein": "7.9",       // 蛋白质 g
  "fat": "0.9",           // 脂肪 g
  "CHO": "77.2",          // 碳水化合物 g
  "dietaryFiber": "0.6",  // 膳食纤维 g
  "cholesterol": "0",     // 胆固醇 mg
  "ash": "0.7",           // 灰分 g
  "vitaminA": "0",        // 维生素A μgRE
  "carotene": "0",        // 胡萝卜素 μg
  "retinol": "0",         // 视黄醇 μg
  "thiamin": "0.15",      // VB1 mg
  "riboflavin": "0.04",   // VB2 mg
  "niacin": "2.00",       // 烟酸 mg
  "vitaminC": "0",        // VC mg
  "vitaminETotal": "0.43",// VE mg
  "Ca": "8",              // 钙 mg
  "P": "112",             // 磷 mg
  "K": "112",             // 钾 mg
  "Na": "1.8",            // 钠 mg
  "Mg": "31",             // 镁 mg
  "Fe": "1.1",            // 铁 mg
  "Zn": "1.54",           // 锌 mg
  "Se": "2.83",           // 硒 μg
  "Cu": "0.25",           // 铜 mg
  "Mn": "1.13"            // 锰 mg
}
```

## 3. 分类映射

从文件名到 App 类别的映射：

| 文件名前缀 | App 类别 |
|-----------|---------|
| 谷类及其制品 | 主食 |
| 薯类淀粉及其制品 | 主食 |
| 干豆类及其制品 | 主食 |
| 蔬菜类及其制品 | 蔬菜 |
| 菌藻类 | 蔬菜 |
| 水果类及其制品 | 水果 |
| 坚果种子类 | 坚果 |
| 畜肉类及其制品 | 肉类 |
| 禽肉类及其制品 | 禽类 |
| 蛋类及其制品 | 蛋奶 |
| 乳类及其制品 | 蛋奶 |
| 鱼虾蟹贝类 | 海鲜 |
| 植物油 | 调味品 |
| 动物油脂类 | 调味品 |
| 其他类 | 零食 |

## 4. 接口设计

保持向后兼容，在原有 FoodDBItem 基础上增加 raw 字段存放完整原始数据：

```typescript
export interface FoodDBItem {
  // 原有字段（保持兼容）
  id: string;
  name: string;
  name_en: string;
  aliases: string[];
  category: string;
  serving_size_grams: number;
  serving_description: string;
  nutrients: {
    calories_kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    sodium_mg: number;
  };
  // 新增：完整原始数据
  foodCode: string;
  edible: number;
  energyKJ: number;
  cholesterol: number;
  vitaminA: number;
  carotene: number;
  retinol: number;
  thiamin: number;
  riboflavin: number;
  niacin: number;
  vitaminC: number;
  vitaminETotal: number;
  Ca: number;
  P: number;
  K: number;
  Mg: number;
  Fe: number;
  Zn: number;
  Se: number;
  Cu: number;
  Mn: number;
}
```

## 5. 实施方案

### 步骤 1：复制 JSON 文件
- 将 `docs/plans/json_data_vision_251206_Qwen2-5-VL-72B-Instruct/` 复制到 `src/data/json_data_vision/`
- 保持文件原样

### 步骤 2：编写构建脚本
- `scripts/build-food-db.js`
- 读取所有 JSON 文件，按分类映射添加 category
- 为每个 item 生成唯一 id（fd_0001 起）
- 输出完整的 `foods.ts`

### 步骤 3：替换 foods.ts
- 运行脚本生成新 `foods.ts`
- 包含完整数据和 searchFoods 函数

### 步骤 4：更新相关组件
- 检查 FoodSearchModal.tsx / add-food.tsx / foodStore.ts
- 确保新数据格式兼容（nutrients 映射保持不变）

### 步骤 5：清理旧文件
- 删除 `scripts/generate-food-db.js`
- 删除 `scripts/fetch-food-data.js`（已删）
- 更新 add-food.tsx 中的引用文本

### 步骤 6：验证
- TypeScript 类型检查（tsc --noEmit）
- 确认所有功能正常运行