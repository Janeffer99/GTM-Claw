# 智效GTM — Progress

> 面向组织的产品线 GTM 材料智能化平台 · 进度周报站点

**在线访问**：https://janeffer99.github.io/GTM-Claw/

## 技术栈

- [Astro 5](https://astro.build/) + [React 19](https://react.dev/) + [MDX](https://mdxjs.com/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- 静态部署 · [GitHub Actions](.github/workflows/deploy.yml) → [GitHub Pages](https://pages.github.com/)

## 目录结构

```
src/
├─ content/weeks/       每周进度报告（.mdx）
├─ pages/               路由
├─ layouts/             页面外壳
├─ components/          UI 组件
├─ styles/global.css    设计 token + prose 样式
├─ content.config.ts    内容集合 schema
└─ consts.ts            站点元信息
```

## 本地开发

```bash
npm install
npm run dev       # http://localhost:4321/GTM-Claw/
npm run build     # 输出到 dist/
npm run preview   # 预览 build 产物
```

## 新增一期周报

1. 在 `src/content/weeks/` 下新建 `2026-Wxx.mdx`
2. 顶部加 frontmatter：
   ```yaml
   ---
   title: "本周标题"
   week: "2026-Wxx"
   date: 2026-08-26
   summary: "一句话摘要，会显示在首页卡片和 SEO 描述里。"
   tags: ["标签1", "标签2"]
   ---
   ```
3. 正文用标准 Markdown 写
4. `git push` → Actions 自动构建 → 站点自动更新（约 40 秒）

## License

内容与代码均归 [@Janeffer99](https://github.com/Janeffer99) 所有。
