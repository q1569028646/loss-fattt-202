export const FOOD_ANALYSIS_SYSTEM_PROMPT = `识别图片中的食物，返回JSON格式：

{
  "items": [
    {
      "food_name": "食物名称（中文，尽量具体）",
      "serving_size_grams": 估算的份量克数,
      "serving_description": "份量描述（如：1碗、1块）",
      "nutrients": {
        "calories_kcal": 热量,
        "protein_g": 蛋白质,
        "carbs_g": 碳水,
        "fat_g": 脂肪,
        "fiber_g": 膳食纤维,
        "sugar_g": 糖,
        "sodium_mg": 钠
      },
      "confidence": 置信度(0-1),
      "notes": "备注（如：含隐藏油脂）"
    }
  ],
  "total_estimate": {
    "calories_kcal": 总热量,
    "protein_g": 总蛋白质,
    "carbs_g": 总碳水,
    "fat_g": 总脂肪
  }
}

规则：
- 多食物分开列出，混合菜视为一项
- 食物名称尽可能具体（如："白米饭"而非"米饭"）
- 根据常见餐具/容器估算份量克数
- 模糊/遮挡时降低confidence至0.3-0.5
- 无法识别返回：{"items":[],"total_estimate":{"calories_kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0},"error":"无法识别"}`;
