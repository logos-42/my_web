# 我的个人网站 - React + Vite 版本

这是一个使用 **React + Vite + TypeScript** 构建的个人博客网站，已从 Next.js 重构而来。

## 🚀 技术栈

- **框架**: React 18
- **构建工具**: Vite 5
- **路由**: React Router v6
- **语言**: TypeScript
- **样式**: CSS
- **Markdown 处理**: Vite import.meta.glob
- **数据库**: Supabase (PostgreSQL) - 用于存储导入文章
- **部署**: Vercel

## ✨ 主要功能

- **文章系统**：支持多分类的文章展示
- **导入文章**：从微信公众号、知乎、Paragraph、Substack 等平台导入文章
- **画廊功能**：图片展示、排序、分页
- **响应式设计**：适配各种设备
- **SEO 优化**：页面元数据配置
- **路由系统**：客户端路由导航

## 📁 项目结构

```
src/
├── components/     # 可复用组件
│   ├── ArticleList/
│   ├── Gallery/
│   ├── SEO/
│   └── Sidebar/
├── data/          # 数据模块
│   └── articles.ts
├── hooks/         # React hooks
│   └── useImportedArticles.ts
├── pages/         # 页面组件
│   ├── HomePage.tsx
│   ├── ArticlePage.tsx
│   ├── CategoryPage.tsx
│   ├── EssaysPage.tsx
│   ├── BlogPage.tsx
│   ├── ProjectsPage.tsx
│   ├── MusicPage.tsx
│   ├── PhilosophyPage.tsx
│   ├── ArtPage.tsx
│   ├── WechatPage.tsx
│   ├── PodcastPage.tsx
│   ├── AdminPage.tsx
│   └── ImportedPage.tsx
├── styles/        # 样式文件
└── content/       # Markdown 文章内容
    ├── blogs/
    ├── essays/
    ├── music/
    ├── philosophy/
    └── projects/
```

## 🛠️ 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 📝 添加文章

### 方式一：本地 Markdown 文件

在 `src/content/` 对应分类目录下创建 `.md` 文件：

```markdown
---
title: 文章标题
date: 2024-01-01
excerpt: 文章摘要
---

# 文章正文

这里是文章内容...
```

### 方式二：导入外部文章

访问 `/admin` 页面，使用 GitHub 登录后，可导入外部平台的文章：

- **微信公众号文章**
- **知乎专栏**
- **Paragraph**
- **Substack**

导入的文章存储在 Supabase 数据库中，无需重新部署即可实时显示。

## 📥 导入文章功能

### 支持平台

| 平台 | 说明 |
|------|------|
| 微信公众号 | 通过文章链接导入 |
| 知乎专栏 | 通过专栏文章链接导入 |
| Paragraph | 通过文章链接导入 |
| Substack | 通过文章链接导入 |

### 使用步骤

1. 访问 `/admin` 页面
2. 点击 "使用 GitHub 登录"
3. 输入文章链接，选择分类
4. 点击 "导入文章"
5. 导入成功后，文章会自动显示在首页和对应分类页面

### 管理导入文章

- 在 `/admin` 页面可查看已导入的文章列表
- 可删除已导入的文章
- 删除后可重新导入

## 🔄 从 Next.js 迁移说明

主要改动：

1. **路由系统**：Next.js App Router → React Router v6
2. **数据获取**：Node.js fs 模块 → Vite import.meta.glob
3. **图片组件**：next/image → 原生 img 标签
4. **链接组件**：next/link → react-router-dom Link
5. **布局系统**：Next.js Layout → 自定义 App 组件 + Outlet
6. **SEO**：Next.js metadata → 自定义 SEO 组件

## 📦 部署

### Vercel 部署

项目已配置 `vercel.json`，可直接部署到 Vercel：

1. 连接 GitHub 仓库
2. 自动构建部署

### 环境变量

部署时需要在 Vercel 配置以下环境变量：

```
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
ADMIN_GITHUB_ID=your_github_username

# GitHub 仓库（用于存储文章内容）
GITHUB_REPO=owner/repo
GITHUB_BRANCH=main
GITHUB_TOKEN=your_github_token

# Supabase（用于存储导入文章记录）
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 其他平台

```bash
npm run build
# 输出目录：dist/
```

将 `dist/` 目录部署到任何静态托管服务即可。

## 📄 许可证

MIT
