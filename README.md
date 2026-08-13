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
│   │   ├── visualization/    # 渲染器（array / tree / linkedlist / stack / sqltable / graph / kmp / huffman / hashtable / er / btree，按 engine.renderType 插件化）
│   │   ├── components/       # 播放器、控制栏、侧边栏、弹窗
│   │   └── content/          # 课程主题配置
│   └── routes/               # 页面路由
├── e2e/                      # Playwright 端到端测试
└── .nexus-map/               # 代码结构知识库
```

## 当前状态

v2.0 正式版。已实现数据结构 19 课：排序（快速/冒泡/插入/选择/归并）、树（二叉树遍历/二叉搜索树/哈夫曼）、图（存储/遍历/最短路径/最小生成树/拓扑排序/关键路径）、线性表、栈和队列、KMP、二分查找、哈希表。已实现数据库 15 课：数据库系统概述、SELECT 查询、高级查询、窗口函数、执行计划与索引选择、建表练习、数据更新、视图、索引、触发器、存储过程、E-R 模型、关系规范化、事务与并发、用户与权限管理。全部支持步进可视化、即时练习反馈、错题本与掌握度追踪；v2.0 新增填空/拖指针/补代码题型、可导入导出的讲授剧本、移动端优化。

## 许可

 proprietary。保留所有权利。

## 关于

见应用内 `/about` 页面。
