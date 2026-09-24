# Student Atlas

高校学生数据管理与地理洞察工作台，提供登录认证、学生档案检索、报到状态查看、学生住址地图和账户管理能力。

项目基于 Next.js App Router、vinext、Cloudflare Workers、Cloudflare D1、Drizzle ORM、Better Auth、Semi Design 和 MapLibre 构建。

## 本地开发

安装依赖后执行：

```bash
pnpm install
pnpm dev
```

默认访问 `http://localhost:3000`。

## 部署

部署到 Cloudflare Workers：

```bash
pnpm deploy
```

上传预览环境：

```bash
pnpm upload
```

项目使用远程 Cloudflare D1 数据库。数据库迁移和生产数据操作应先确认影响范围。
