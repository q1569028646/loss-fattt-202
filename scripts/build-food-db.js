const fs = require('fs');
const path = require('path');

const JSON_DIR = path.join(__dirname, '..', 'src', 'data', 'json_data_vision');
const OUTPUT = path.join(__dirname, '..', 'src', 'data', 'foods.ts');

const CATEGORY_MAP = [
  [/谷类及其制品/, '主食'],
  [/薯类淀粉及其制品/, '主食'],
  [/干豆类及其制品/, '主食'],
  [/蔬菜类及其制品/, '蔬菜'],
  [/菌藻类/, '蔬菜'],
  [/水果类及其制品/, '水果'],
  [/坚果种子类/, '坚果'],
  [/畜肉类及其制品/, '肉类'],
  [/禽肉类及其制品/, '禽类'],
  [/蛋类及其制品/, '蛋奶'],
  [/乳类及其制品/, '蛋奶'],
  [/鱼虾蟹贝类/, '海鲜'],
  [/植物油/, '调味品'],
  [/动物油脂类/, '调味品'],
  [/其他类/, '零食'],
];

function getCategory(filename) {
  for (const [re, cat] of CATEGORY_MAP) {
    if (re.test(filename)) return cat;
  }
  return '零食';
}

function pv(val) {
  if (val === undefined || val === null || val === '' || val === '-' || val === '—' || val === 'Tr' || val === '…' || val === '… ') return 0;
  const n = parseFloat(String(val).replace(/[^\d.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function generateAliases(name) {
  const aliases = [];
  const parenMatch = name.match(/[（(](.+?)[）)]/g);
  if (parenMatch) {
    for (const m of parenMatch) {
      const inner = m.replace(/[（）()]/g, '').trim();
      const parts = inner.split(/[，,、]/);
      for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed && trimmed !== name && trimmed.length < name.length) {
          aliases.push(trimmed);
        }
      }
    }
  }
  const bracketMatch = name.match(/[【\[](.+?)[】\]]/g);
  if (bracketMatch) {
    for (const m of bracketMatch) {
      const inner = m.replace(/[【】\[\]]/g, '').trim();
      if (inner && inner !== name) aliases.push(inner);
    }
  }
  return [...new Set(aliases)];
}

const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json')).sort();
console.log(`Found ${files.length} JSON files`);

const seen = new Set();
const allItems = [];

for (const file of files) {
  const filePath = path.join(JSON_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (!Array.isArray(data)) {
    console.log(`  SKIP ${file}: not an array`);
    continue;
  }
  const category = getCategory(file);
  let count = 0;
  for (const item of data) {
    const code = item.foodCode || '';
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const name = item.foodName || '';
    if (!name) continue;
    const aliases = generateAliases(name);
    allItems.push({
      foodCode: code,
      name,
      category,
      edible: pv(item.edible),
      energyKCal: pv(item.energyKCal),
      energyKJ: pv(item.energyKJ),
      protein: pv(item.protein),
      fat: pv(item.fat),
      CHO: pv(item.CHO),
      dietaryFiber: pv(item.dietaryFiber),
      cholesterol: pv(item.cholesterol),
      ash: pv(item.ash),
      vitaminA: pv(item.vitaminA),
      carotene: pv(item.carotene),
      retinol: pv(item.retinol),
      thiamin: pv(item.thiamin),
      riboflavin: pv(item.riboflavin),
      niacin: pv(item.niacin),
      vitaminC: pv(item.vitaminC),
      vitaminETotal: pv(item.vitaminETotal),
      Ca: pv(item.Ca),
      P: pv(item.P),
      K: pv(item.K),
      Na: pv(item.Na),
      Mg: pv(item.Mg),
      Fe: pv(item.Fe),
      Zn: pv(item.Zn),
      Se: pv(item.Se),
      Cu: pv(item.Cu),
      Mn: pv(item.Mn),
      aliases,
    });
    count++;
  }
  console.log(`  ${file}: +${count}`);
}

allItems.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category, 'zh');
  return a.name.localeCompare(b.name, 'zh');
});

const catSet = [...new Set(allItems.map(i => i.category))].sort((a, b) => a.localeCompare(b, 'zh'));
console.log(`\nTotal: ${allItems.length} items`);
console.log('Categories:', catSet);

let ts = '';
ts += 'export interface FoodDBItem {\n';
ts += '  id: string;\n';
ts += '  name: string;\n';
ts += '  name_en: string;\n';
ts += '  aliases: string[];\n';
ts += '  category: string;\n';
ts += '  serving_size_grams: number;\n';
ts += '  serving_description: string;\n';
ts += '  nutrients: {\n';
ts += '    calories_kcal: number;\n';
ts += '    protein_g: number;\n';
ts += '    carbs_g: number;\n';
ts += '    fat_g: number;\n';
ts += '    fiber_g: number;\n';
ts += '    sugar_g: number;\n';
ts += '    sodium_mg: number;\n';
ts += '  };\n';
ts += '  foodCode: string;\n';
ts += '  edible: number;\n';
ts += '  energyKJ: number;\n';
ts += '  cholesterol: number;\n';
ts += '  vitaminA: number;\n';
ts += '  carotene: number;\n';
ts += '  retinol: number;\n';
ts += '  thiamin: number;\n';
ts += '  riboflavin: number;\n';
ts += '  niacin: number;\n';
ts += '  vitaminC: number;\n';
ts += '  vitaminETotal: number;\n';
ts += '  Ca: number;\n';
ts += '  P: number;\n';
ts += '  K: number;\n';
ts += '  Mg: number;\n';
ts += '  Fe: number;\n';
ts += '  Zn: number;\n';
ts += '  Se: number;\n';
ts += '  Cu: number;\n';
ts += '  Mn: number;\n';
ts += '}\n\n';

ts += `export const FOOD_CATEGORIES = [\n  ${catSet.map(c => `'${c}'`).join(', ')},\n] as const;\n\n`;

ts += 'export const FOOD_DB: FoodDBItem[] = [\n';

for (let idx = 0; idx < allItems.length; idx++) {
  const i = allItems[idx];
  const id = `fd_${String(idx + 1).padStart(4, '0')}`;
  const en = i.name.replace(/'/g, "\\'");
  const als = i.aliases.length
    ? `[${i.aliases.map(a => `'${a.replace(/'/g, "\\'")}'`).join(', ')}]`
    : '[]';
  ts += `  { id: '${id}', name: '${en}', name_en: '', aliases: ${als}, category: '${i.category}', serving_size_grams: 100, serving_description: '100g', nutrients: { calories_kcal: ${i.energyKCal}, protein_g: ${i.protein}, carbs_g: ${i.CHO}, fat_g: ${i.fat}, fiber_g: ${i.dietaryFiber}, sugar_g: 0, sodium_mg: ${i.Na} }, foodCode: '${i.foodCode}', edible: ${i.edible}, energyKJ: ${i.energyKJ}, cholesterol: ${i.cholesterol}, vitaminA: ${i.vitaminA}, carotene: ${i.carotene}, retinol: ${i.retinol}, thiamin: ${i.thiamin}, riboflavin: ${i.riboflavin}, niacin: ${i.niacin}, vitaminC: ${i.vitaminC}, vitaminETotal: ${i.vitaminETotal}, Ca: ${i.Ca}, P: ${i.P}, K: ${i.K}, Mg: ${i.Mg}, Fe: ${i.Fe}, Zn: ${i.Zn}, Se: ${i.Se}, Cu: ${i.Cu}, Mn: ${i.Mn} },\n`;
}

ts += '];\n\n';

ts += `export function searchFoods(query: string, category?: string, limit: number = 20): FoodDBItem[] {\n`;
ts += `  if (!query.trim()) {\n`;
ts += `    if (category) return FOOD_DB.filter(f => f.category === category).slice(0, limit);\n`;
ts += `    return [];\n  }\n`;
ts += `  const q = query.toLowerCase().trim();\n`;
ts += `  const scored = FOOD_DB\n`;
ts += `    .filter(f => !category || f.category === category)\n`;
ts += `    .map(food => {\n`;
ts += `      let score = 0;\n      const nameLower = food.name.toLowerCase();\n`;
ts += `      if (nameLower === q) score = 100;\n`;
ts += `      else if (nameLower.startsWith(q)) score = 80;\n`;
ts += `      else if (nameLower.includes(q)) score = 60;\n`;
ts += `      if (score === 0) {\n`;
ts += `        for (const alias of food.aliases) {\n`;
ts += `          const aliasLower = alias.toLowerCase();\n`;
ts += `          if (aliasLower === q) { score = 70; break; }\n`;
ts += `          if (aliasLower.startsWith(q)) { score = 50; break; }\n`;
ts += `          if (aliasLower.includes(q)) { score = 30; break; }\n`;
ts += `        }\n      }\n`;
ts += `      if (score === 0) {\n`;
ts += `        for (const char of q) {\n`;
ts += `          if (nameLower.includes(char) || food.aliases.some(a => a.toLowerCase().includes(char))) {\n`;
ts += `            score = Math.max(score, 10);\n          }\n        }\n      }\n`;
ts += `      return { food, score };\n    })\n`;
ts += `    .filter(item => item.score > 0)\n`;
ts += `    .sort((a, b) => b.score - a.score)\n`;
ts += `    .slice(0, limit).map(item => item.food);\n`;
ts += `  return scored;\n}\n`;

fs.writeFileSync(OUTPUT, ts, 'utf-8');
console.log(`\nWritten! ${allItems.length} items to ${OUTPUT}`);
