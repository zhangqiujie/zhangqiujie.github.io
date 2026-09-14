# ZQJ Tech Blog

轻量静态技术博客：Astro 6、Tailwind CSS 4、Markdown/MDX，以及 GitHub Pages 自动部署。

## 目录与职责

```text
.
├── .github/workflows/deploy.yml       # GitHub Pages 构建和发布
├── scripts/validate-content.mjs       # 校验仓库内文章与资源是否齐全
├── src/
│   ├── components/                    # 单一 UI 职责的展示组件
│   │   ├── Pagination.astro
│   │   ├── PostCard.astro
│   │   ├── PostMeta.astro
│   │   ├── TagBadge.astro
│   │   └── TerminalHeader.astro
│   ├── content/posts/                 # 需提交到 GitHub 的文章镜像
│   ├── layouts/BaseLayout.astro       # 全站骨架与元信息
│   ├── lib/posts/                     # 获取、归一化、排序、分页与分类树
│   ├── pages/                         # 首页、目录、标签、分页与文章详情页
│   ├── styles/global.css              # 亮色科技感基础样式
│   ├── types/post.ts                  # 领域类型
│   └── utils/                         # slug、日期、元数据、路径等纯函数
├── src/content.config.ts              # Astro 内容集合与宽容 schema
└── astro.config.mjs                   # Astro、MDX、Tailwind、Pages base 配置
```

## 本地启动

1. 在本目录执行 `npm install`。
2. 执行 `npm run dev`，打开终端显示的本地地址。
3. 执行 `npm run build` 验证生产构建。

文章与资源都已经迁入本项目：文章在 `src/content/posts/`，旧 Jekyll 的 `assets/` 在 `public/assets/`。`npm run build` 只使用这些已提交的本地文件，不会读取 Downloads 或依赖本机旧项目。

项目包含 `.npmrc`，默认通过阿里云 `https://registry.npmmirror.com/` 安装依赖。若要让所有本机 npm 项目也使用该镜像，可执行 `npm config set registry https://registry.npmmirror.com/`。

## Jekyll 兼容规则

- 文件名 `YYYY-MM-DD-title.md` 自动提供日期与 slug；Frontmatter 的 `date` 和 `title` 优先级更高。
- `layout` 被安全忽略；`categories` 和 `tags` 同时接受字符串、逗号分隔字符串或数组。
- `excerpt` 与 `description` 都能作为摘要；`draft: true` 不会发布。Jekyll YAML 中的空值（如 `description:`）会被当作缺省字段，不会中断构建。
- `categories: [一级目录, 子目录]` 会生成层级目录；标签单独生成横向索引。目录、子目录与标签都拥有可访问的静态页面。
- 未提供标题或非法日期时分别回退为文件名标题和 Unix epoch，保证单篇异常文章不会阻塞全站构建。
- Astro 的 MDX 集成会编译标准 Markdown 与 MDX；旧 Jekyll Liquid 标签不是 MDX 语法，若文章含有它们，请先替换为 Markdown/HTML 或 Astro 对应写法。

## 发布到 GitHub Pages

1. 在 GitHub 新建仓库。若仓库名为 `<用户名>.github.io`，站点在根域名；普通仓库会自动以 `/<仓库名>/` 为前缀。
2. 修改 `astro.config.mjs` 的 `site` 为你的正式地址（例如 `https://your-name.github.io`）；如使用自定义域名，设置为该域名并删除 `base` 的自动配置。
3. 同步文章后依次执行：`git add .`、`git commit -m "feat: initialize blog"`、`git push -u origin main`。
4. 打开仓库 **Settings → Pages**，将 Source 选为 **GitHub Actions**。
5. 在 Actions 查看 “Deploy to GitHub Pages” 成功后访问页面链接。之后每次推送 `main` 都会自动构建部署。

工作流首次可使用 `npm install` 直接运行；首次本地安装生成 `package-lock.json` 后，建议将它提交，并将工作流的安装命令改为 `npm ci` 以获得完全可复现的依赖版本。
