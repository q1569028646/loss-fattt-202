# 安装 NutriFlow 项目依赖并启动开发服务器

## 当前环境状态
- Node.js: v24.15.0
- npm: 11.4.2
- `node_modules` 目录：**不存在**（需要全新安装）

## 实施步骤

### 步骤 1：安装项目依赖
```bash
cd /workspace && npm install
```
- 根据 `package.json` 中的依赖列表安装所有 npm 包
- 生成 `node_modules` 目录和 `package-lock.json`

### 步骤 2：验证安装结果
- 检查 `npm install` 是否成功完成（无错误退出）
- 确认 `node_modules` 目录已创建
- 运行 `npx expo doctor` 检查 Expo 项目健康状态（如可用）

### 步骤 3：启动 Expo 开发服务器
```bash
npx expo start
```
- 启动 Expo Metro bundler 开发服务器
- 由于当前环境没有 Android 模拟器，将以 Web 模式运行
- 使用 `--web` 参数直接启动 Web 版本

### 步骤 4：在浏览器中预览应用
- 启动 Web 开发服务器后，通过浏览器访问预览地址
- 确认应用可以正常加载和渲染

## 注意事项
- 项目使用 Expo SDK 54，需要确保兼容性
- 部分原生功能（相机、语音等）在 Web 模式下可能不可用
- AI 相关功能需要配置 API Key 才能使用
