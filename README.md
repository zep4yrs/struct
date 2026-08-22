# StructVis

> 看见数据结构与数据库的每一步跳动。

## 简介

StructVis 是一款面向自学者的交互式可视化学习工具，覆盖**数据结构**与 **MySQL 数据库**两大模块。它不是算法炫技的 Demo，也不是题库刷题平台，而是一个围绕教材章节设计的**过程型学习环境**：每一步都可以暂停、动手改参数、立刻看见结果。

核心目标：

- 把抽象的执行过程变成**可步进、可回放**的可视化动画
- 提供**即时反馈**的练习题，做错立刻解释
- 本地持久化学习进度与掌握度，错题自动进入错题本

## 功能特性

- **72 个知识点**：数据结构 48 讲（排序 / 树 / 图 / 线性结构 / 查找 / 动态规划）+ 数据库 24 讲（查询 / 窗口函数 / 执行计划与索引选择 / 建表 / 数据更新 / 视图 / 索引 / 触发器 / 存储过程 / E-R 模型 / 关系规范化 / 事务与并发 / 用户与权限）
- **步进可视化播放器**：逐帧、回放、调速、直接跳步；12 类渲染器（数组 / 树 / 链表 / 栈 / 队列 / 图 / B+ 树 / 哈希表 / E-R / SQL 表 / 伪代码等），按引擎插件化
- **四类练习题型**：选择 / 填空 / 拖指针 / 补代码，答错即时解释
- **错题本与掌握度**：错题重新作答、标记已掌握、进度统计
- **讲授剧本**：讲解词可导入 / 导出 / 重置，适合课堂演示与备课
- **演示投影模式**：全屏键盘操作，适合大屏教学
- **全站搜索**（`/` 快捷键唤起）、**暗色主题**、**移动端适配**

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
npm run test        # 单元测试（480+）
npm run test:e2e    # 端到端测试（40+，含视觉截图基线）
npm run check       # 类型检查（0 errors）
npm run build       # 生产构建
npm run lint        # Prettier + ESLint
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
└── e2e/                      # Playwright 端到端测试
```

## 当前状态

v2.0 正式版。全部课程支持步进可视化、即时练习反馈、错题本与掌握度追踪；v2.0 新增填空 / 拖指针 / 补代码题型、可导入导出的讲授剧本、SQL 扩展（窗口函数 / 执行计划）与移动端优化。质量门禁：svelte-check 0 errors、400+ 单元测试、40+ 端到端测试（含截图基线回归）全绿。

## 部署

GitHub Actions：push 到 master 自动构建并提交 `docs/`，通过 GitHub Pages 发布（base 路径 `/struct`）。

## 许可

[GPL-3.0](LICENSE)（GNU General Public License v3）。Copyright (c) 2026 枫桥 (zep4yrs)。

你可以自由使用、修改、分发本项目，但**基于本项目的衍生作品必须同样以 GPL-3.0 开源**——防止有人拿去闭源商用。

## 关于

见应用内 `/about` 页面。
