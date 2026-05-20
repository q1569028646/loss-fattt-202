export const schemas = {
  version: 1,
  tables: [
    {
      name: 'food_entries',
      columns: [
        'name', 'meal_type', 'serving_size', 'serving_unit',
        'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium',
        'image_uri', 'ai_provider_id', 'raw_ai_response', 'created_at', 'deleted_at',
      ],
    },
    {
      name: 'weight_entries',
      columns: ['weight_kg', 'body_fat_percent', 'created_at'],
    },
    {
      name: 'chat_messages',
      columns: ['role', 'content', 'created_at'],
    },
  ],
};
