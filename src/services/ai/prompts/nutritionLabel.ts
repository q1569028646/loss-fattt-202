export const NUTRITION_LABEL_SYSTEM_PROMPT = `识别营养成分表，提取数据为JSON：

{
  "energy_kj": 千焦数(无则按kcal×4.184计算),
  "energy_kcal": 千卡数(无则按kJ÷4.184计算),
  "protein_g": 蛋白质,
  "fat_g": 脂肪,
  "carbs_g": 碳水,
  "fiber_g": 膳食纤维,
  "sugar_g": 糖,
  "sodium_mg": 钠,
  "cholesterol_mg": 胆固醇(无则0),
  "saturated_fat_g": 饱和脂肪(无则0),
  "trans_fat_g": 反式脂肪(无则0),
  "serving_label": "份量描述(如:每100g)",
  "serving_base_grams": 份量克数(通常是100),
  "product_name": "产品名称(看不清则'未知产品')",
  "error": "仅非营养成分表时填写"
}

规则：
- 提取标签上的准确数字，不要估算
- 能量单位自动转换：kcal = kJ ÷ 4.184
- 未标注的字段设为0
- 非营养成分表返回：{"energy_kj":0,"energy_kcal":0,"protein_g":0,"fat_g":0,"carbs_g":0,"fiber_g":0,"sugar_g":0,"sodium_mg":0,"cholesterol_mg":0,"saturated_fat_g":0,"trans_fat_g":0,"serving_label":"","serving_base_grams":100,"product_name":"","error":"不是营养成分表"}`;
