# AI Design Stimulus Generator

一个面向设计师的在线工具。用户输入设计需求或问题后，前端调用自有 Node.js 后端，后端通过智谱 API 请求 GLM-4.7-FlashX，并返回结构化的 `near / medium / far` 三类设计刺激词，用于功能优化、场景重构与跨领域创新。

## 项目介绍

- 前后端分离：`client` 为 React + Vite + Tailwind CSS，`server` 为 Node.js + Express
- AI 调用仅发生在后端
- 使用环境变量配置 ModelScope API Key、Base URL 与模型名
- 返回严格结构化 JSON，并带有输入校验、基础安全中间件、限流与错误处理
- UI 为设计工具风格，三组结果卡片 + 底部详情面板

## 本地运行方法

### 1. 安装依赖

```bash
cd client
npm install

cd ../server
npm install
```

### 2. 配置环境变量

复制根目录的 `.env.example` 内容：

- 在 `client/.env.local` 中填写前端变量
- 在 `server/.env` 中填写后端变量

示例：

```bash
# client/.env.local
VITE_API_BASE_URL=http://localhost:10000
```

```bash
# server/.env
MODELSCOPE_API_KEY=your_modelscope_api_key_here
MODELSCOPE_BASE_URL=your_modelscope_openai_compatible_base_url_here
MODELSCOPE_MODEL=ZhipuAI/GLM-4.7-Flashx
ALLOWED_ORIGIN=http://localhost:5173
PORT=10000
```

### 3. 启动后端

```bash
cd server
npm run dev
```

### 4. 启动前端

```bash
cd client
npm run dev
```

### 5. 访问

- 前端默认地址：`http://localhost:5173`
- 后端默认地址：`http://localhost:10000`
- 健康检查：`http://localhost:10000/health`

## GitHub 使用说明

1. 在 GitHub 创建一个新的仓库
2. 将当前项目推送到仓库根目录

```bash
git init
git add .
git commit -m "feat: add AI design stimulus generator"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

3. Vercel 连接仓库时将 Root Directory 设为 `client`
4. Render 连接仓库时将 Root Directory 设为 `server`

## 环境变量配置方法

根目录 `.env.example` 仅提供占位符，不包含真实密钥。

前端：

- `VITE_API_BASE_URL`

后端：

- `MODELSCOPE_API_KEY`
- `MODELSCOPE_BASE_URL`
- `MODELSCOPE_MODEL`
- `ALLOWED_ORIGIN`
- `PORT`

## 前端部署到 Vercel 的步骤

1. 将项目推送到 GitHub
2. 在 Vercel 中导入仓库
3. 将 Root Directory 设为 `client`
4. Framework Preset 选择 `Vite`
5. 添加环境变量：

```bash
VITE_API_BASE_URL=https://your-render-backend-url.onrender.com
```

6. 点击 Deploy

## 后端部署到 Render 的步骤

1. 将项目推送到 GitHub
2. 在 Render 中创建新的 Web Service
3. 选择对应仓库
4. Root Directory 设为 `server`
5. Build Command：

```bash
npm install
```

6. Start Command：

```bash
npm start
```

7. 配置环境变量：

```bash
MODELSCOPE_API_KEY=your_modelscope_api_key_here
MODELSCOPE_BASE_URL=your_modelscope_openai_compatible_base_url_here
MODELSCOPE_MODEL=ZhipuAI/GLM-4.7-Flashx
ALLOWED_ORIGIN=https://your-vercel-frontend-url.vercel.app
PORT=10000
```

8. Health Check Path 设置为 `/health`

仓库根目录提供了 `render.yaml`，也可以使用 Render Blueprint 方式导入。

## 如何配置 GLM-4.7-FlashX API

1. 在 ModelScope 平台开通对应 API-Inference 能力
2. 获取 OpenAI 兼容方式所需的：
   - API Key
   - Base URL
   - Model 名称
3. 将这些值填入 `server/.env` 或 Render 环境变量
4. 本项目默认后端按 `chat completions` 风格发起请求，可通过环境变量切换模型或兼容的服务地址，无需改动前端代码

## 如何配置前后端联调

本地联调：

- 前端 `VITE_API_BASE_URL=http://localhost:10000`
- 后端 `ALLOWED_ORIGIN=http://localhost:5173`

线上联调：

- Vercel 中把 `VITE_API_BASE_URL` 改为 Render 的公网地址
- Render 中把 `ALLOWED_ORIGIN` 改为 Vercel 的正式域名

## 项目结构说明

```text
project-root/
  client/
    src/
      components/
      hooks/
      lib/
      App.jsx
      main.jsx
      index.css
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vercel.json
    vite.config.js
  server/
    src/
      controllers/
      middleware/
      prompts/
      routes/
      services/
      utils/
      index.js
    package.json
  .env.example
  .gitignore
  README.md
  render.yaml
```

## 接口说明

### `POST /api/generate`

请求体：

```json
{
  "prompt": "请为一款适合老年人的智能水杯生成设计刺激词"
}
```

成功响应：

```json
{
  "near": [
    {
      "word": "防滑握柄",
      "inspiration": "强化拿取稳定性",
      "direction": "优化持握结构与表面材料"
    }
  ],
  "medium": [],
  "far": []
}
```

### `GET /health`

返回服务状态、模型名与时间戳。
