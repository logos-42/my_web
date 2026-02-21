# 我的个人网站 - React + Vite 版本

这是一个使用 **React + Vite + TypeScript** 构建的个人博客网站，已从 Next.js 重构而来。

## 🚀 技术栈

- **框架**: React 18
- **构建工具**: Vite 5
- **路由**: React Router v6
- **语言**: TypeScript
- **样式**: CSS
- **Markdown 处理**: Vite import.meta.glob

## ✨ 主要功能

- **文章系统**：支持多分类的文章展示
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
│   └── WechatPage.tsx
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

### 其他平台

```bash
npm run build
# 输出目录：dist/
```

将 `dist/` 目录部署到任何静态托管服务即可。

## 📄 许可证

MIT
