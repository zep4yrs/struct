# StructVis

> 数据结构与数据库可视化学习工具 — 让每个步骤都可见、可交互、可练习。

## 项目定位

StructVis 是一款面向自学者的交互式可视化练习工具，覆盖**数据结构**与 **MySQL 数据库**两大模块。它不是算法炫技 Demo，也不是题库刷题平台，而是围绕教材章节设计的**过程型学习环境**：每一步都可以暂停、动手改参数、立即看到结果。

核心目标：

- 把抽象的执行过程变成**可步进的可视化动画**
- 提供**即时反馈**的练习题，做错立刻解释
- 本地持久化学习进度与掌握度

## 技术栈

- Svelte 5 + SvelteKit
- Tailwind v4
- GSAP（动画）
- Vitest + Playwright（测试）
- adapter-static（纯静态部署）

## 快速开始

```bash
cd structvis
npm install
npm run dev
```

常用命令：

```bash
npm run test        # 单元测试
npm run test:e2e    # 端到端测试
npm run check       # 类型检查
npm run build       # 生产构建
```

## 项目结构

```
structvis/
├── src/
│   ├── lib/
│   │   ├── engines/          # 算法/数据库引擎（AlgorithmEngine / SelectEngine / TriggerEngine / ProcedureEngine）
│   │   ├── visualization/    # 渲染器（array / tree / linkedlist / sql-table / pseudocode）
│   │   ├── components/       # 播放器、控制栏、侧边栏、弹窗
│   │   └── content/          # 课程主题配置
│   └── routes/               # 页面路由
├── e2e/                      # Playwright 端到端测试
└── .nexus-map/               # 代码结构知识库
```

## 当前状态

v0.1 开发中。已实现的数据结构：快速排序、二叉树遍历、线性表、图存储、KMP、哈夫曼、BST、最短路径、最小生成树、拓扑排序、关键路径、哈希表。已实现的数据库模块：SELECT 查询、高级查询、数据更新、视图、触发器、存储过程、事务与并发、E-R 模型、关系规范化、用户权限管理。

## 许可

 proprietary。保留所有权利。

## 关于

见应用内 `/about` 页面。
