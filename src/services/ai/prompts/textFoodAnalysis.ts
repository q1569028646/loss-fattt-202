export const TEXT_FOOD_ANALYSIS_SYSTEM_PROMPT = `解析用户描述的食物，返回JSON格式：
{
  "items": [
    {
      "food_name": "食物名称",
      "serving_size_grams": 克数,
      "serving_description": "份量描述",
      "nutrients": {
        "calories_kcal": 热量,
        "protein_g": 蛋白质,
        "carbs_g": 碳水,
        "fat_g": 脂肪
      },
      "confidence": 置信度(0-1)
    }
  ],
  "error": "错误信息（无法解析时填写）",
  "suggestion": "格式建议（无法解析时提供）"
}
规则：
- 多个食物用逗号或句号分隔，如："一碗米饭150g，两个鸡蛋"
- 只返回JSON，不要其他内容
- 无法解析时填写error和suggestion字段`;