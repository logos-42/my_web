# 部署指南

## 🚀 Vercel部署步骤

### 1. 准备代码
确保所有文件都已正确配置：
- ✅ Next.js项目结构完整
- ✅ 所有Markdown内容已迁移
- ✅ 静态资源已复制到public目录
- ✅ 环境变量已配置

### 2. 推送到GitHub
```bash
git add .
git commit -m "feat: 迁移到Next.js架构"
git push origin main
```

### 3. Vercel部署
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的GitHub仓库
4. 配置项目设置：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist

### 4. 环境变量配置
在Vercel项目设置中添加：
```
NEXT_PUBLIC_GA_ID=你的Google Analytics ID
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 5. 自定义域名
1. 在Vercel项目设置中添加自定义域名
2. 配置DNS记录
3. 等待SSL证书自动生成

## 🔧 本地开发

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建测试
```bash
npm run build
npm start
```

## 📊 功能验证

部署完成后，验证以下功能：

### 基础功能
- [ ] 首页正常显示
- [ ] 侧边栏导航工作正常
- [ ] 响应式设计适配移动端

### 文章系统
- [ ] 文章列表正常显示
- [ ] 文章详情页正常加载
- [ ] Markdown内容正确渲染

### 画廊功能
- [ ] 画廊页面正常加载
- [ ] 图片正常显示
- [ ] 分页功能正常
- [ ] 排序功能正常
- [ ] 收藏功能正常
- [ ] 唯一凭证功能正常
- [ ] 全屏查看功能正常

### 其他功能
- [ ] RSS订阅正常：`/api/rss`
- [ ] Google Analytics正常工作
- [ ] 所有页面SEO meta标签正确

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查TypeScript类型错误
   - 确保所有依赖已安装
   - 检查环境变量配置

2. **图片不显示**
   - 确认图片已复制到public目录
   - 检查图片路径是否正确
   - 确认图片格式支持

3. **样式问题**
   - 检查CSS文件是否正确导入
   - 确认响应式样式正常
   - 检查浏览器兼容性

4. **功能异常**
   - 检查JavaScript控制台错误
   - 确认API路由正常工作
   - 检查环境变量配置

## 📈 性能优化

### 生产环境优化
- 启用Next.js图片优化
- 配置CDN加速
- 启用Gzip压缩
- 设置缓存策略

### 监控和分析
- 配置Google Analytics
- 设置性能监控
- 定期检查网站速度
- 监控错误日志

## 🔄 更新流程

### 内容更新
1. 在本地修改Markdown文件
2. 测试本地构建
3. 推送到GitHub
4. Vercel自动部署

### 功能更新
1. 在本地开发新功能
2. 测试所有功能正常
3. 更新文档
4. 推送到GitHub
5. Vercel自动部署

## 📞 技术支持

如果遇到问题，可以：
1. 检查Vercel部署日志
2. 查看浏览器控制台错误
3. 参考Next.js官方文档
4. 查看项目README文件
