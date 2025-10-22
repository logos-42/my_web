# 我的个人网站 - Next.js版本

这是一个使用Next.js重构的个人网站，包含了完整的画廊功能、文章管理系统、RSS订阅和Google Analytics集成。

## 🚀 功能特性

### 核心功能
- **静态网站生成**：基于Next.js的静态站点生成
- **响应式设计**：完美适配桌面和移动设备
- **SEO优化**：内置SEO优化和结构化数据

### 内容管理
- **Markdown支持**：使用Markdown编写文章
- **分类管理**：支持多分类文章组织
- **自动生成**：自动生成文章列表和导航

### 画廊功能
- **完整保留**：保留了原有的所有画廊功能
- **分页浏览**：支持大量图片的分页显示
- **排序功能**：按受欢迎度、随机、最新排序
- **收藏功能**：用户可以收藏喜欢的作品
- **唯一凭证**：每件作品都有唯一的验证ID
- **全屏查看**：支持图片全屏查看

### 其他功能
- **RSS订阅**：自动生成RSS feed
- **Google Analytics**：集成网站分析
- **反向链接**：支持反向链接系统

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (routes)/          # 路由页面
│   ├── api/               # API路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React组件
│   ├── Gallery/          # 画廊组件
│   ├── Sidebar/          # 侧边栏组件
│   ├── ArticleList/      # 文章列表组件
│   └── SEO/              # SEO组件
├── content/              # Markdown内容
│   ├── articles/         # 文章
│   ├── philosophy/       # 哲科
│   ├── music/           # 音乐
│   └── blogs/           # 博客
├── lib/                 # 工具函数
│   ├── markdown.ts      # Markdown处理
│   ├── gallery.ts       # 画廊工具
│   └── analytics.ts     # 分析工具
└── styles/              # 样式文件
    ├── styles.css       # 主样式
    └── css/             # 组件样式
```

## 🛠️ 技术栈

- **Next.js 14**：React框架
- **TypeScript**：类型安全
- **Tailwind CSS**：样式框架（可选）
- **gray-matter**：Front matter解析
- **remark**：Markdown处理
- **date-fns**：日期处理

## 📦 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
创建 `.env.local` 文件：
```env
NEXT_PUBLIC_GA_ID=你的Google Analytics ID
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 3. 开发模式
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

### 5. 启动生产服务器
```bash
npm start
```

## 🎨 画廊功能

### 配置
画廊支持1000+张图片，可以通过修改 `Gallery.tsx` 中的 `totalImages` 参数来调整。

### 图片管理
- 图片存放在 `public/finish/` 目录
- 命名格式：`thumbnail_1.jpg`, `thumbnail_2.jpg`, ...
- 支持JPG、PNG等格式

### 功能特性
- **分页显示**：每页显示24张图片
- **多种排序**：受欢迎度、随机、最新
- **收藏系统**：本地存储用户收藏
- **唯一凭证**：每件作品的唯一ID
- **全屏查看**：点击图片全屏显示

## 📝 内容管理

### 添加新文章
1. 在对应的分类目录下创建 `.md` 文件
2. 添加front matter：
```markdown
---
title: 文章标题
date: 2024-01-01
category: articles
excerpt: 文章摘要
---

# 文章内容
```

### 分类说明
- `articles/`：一般文章
- `philosophy/`：哲学思考
- `music/`：音乐相关
- `blogs/`：博客文章

## 🚀 部署

### Vercel部署
1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 自动部署

### 其他平台
支持任何支持Next.js的平台：
- Netlify
- GitHub Pages
- AWS Amplify
- 自建服务器

## 🔧 配置说明

### Google Analytics
在 `.env.local` 中配置：
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### RSS订阅
RSS feed自动生成在 `/api/rss` 路径。

### 域名配置
在 `vercel.json` 中配置自定义域名。

## 📊 性能优化

- **静态生成**：所有页面预渲染
- **图片优化**：Next.js Image组件优化
- **代码分割**：自动代码分割
- **缓存策略**：优化的缓存策略

## 🔍 SEO优化

- **Meta标签**：自动生成SEO meta标签
- **结构化数据**：支持JSON-LD结构化数据
- **Sitemap**：自动生成sitemap
- **RSS订阅**：支持RSS订阅

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 📄 许可证

MIT License
