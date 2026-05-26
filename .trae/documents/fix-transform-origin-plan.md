# 修复 transform-origin DOM 属性错误

## 问题分析

在浏览器控制台中出现错误：
```
Invalid DOM property `transform-origin`. Did you mean `transformOrigin`?
```

**原因**：在 `/workspace/src/components/food/MacroBar.tsx` 第 70 行使用了 `transformOrigin: 'left'`。在 React Native Web 环境中，这个属性的处理存在兼容性问题。

## 解决方案

在 React Native Web 中，需要使用平台特定的方式来设置 `transformOrigin`。可以通过以下方式解决：

### 方案：使用平台检测和样式适配

修改 `MacroBar.tsx` 文件，将 `transformOrigin: 'left'` 替换为平台特定的实现：

```typescript
import { Platform } from 'react-native';

// 在样式中使用条件判断
fill: {
  height: '100%',
  width: '100%',
  borderRadius: 4,
  ...Platform.select({
    ios: { transformOrigin: 'left' },
    android: { transformOrigin: 'left' },
    web: {}, // Web 端不使用 transformOrigin
  }),
},
```

或者，在 Web 端可以通过内联样式使用 `transform` 数组的方式实现类似效果。

## 实施步骤

1. 修改 `/workspace/src/components/food/MacroBar.tsx` 文件
2. 导入 `Platform` 模块
3. 修改 `fill` 样式，移除 `transformOrigin` 或使用平台特定样式

## 预期效果

修复后，浏览器控制台不再出现 `Invalid DOM property` 错误，进度条的动画效果保持不变。
