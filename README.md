# StructVis

> 看见数据结构与数据库的每一步跳动。

[![Build & Deploy](https://github.com/zep4yrs/struct/actions/workflows/deploy.yml/badge.svg?branch=master)](https://github.com/zep4yrs/struct/actions/workflows/deploy.yml)
![Tests](https://img.shields.io/badge/tests-481%20unit%20%2B%2067%20e2e-3fb96f)
![License](https://img.shields.io/badge/license-GPL--3.0-blue)
[![在线体验](https://img.shields.io/badge/%E5%9C%A8%E7%BA%BF%E4%BD%93%E9%AA%8C-GitHub%20Pages-4c8dff)](https://zep4yrs.github.io/struct/)
[![赞赏支持](https://img.shields.io/badge/%E8%B5%9E%E8%B5%8F%E6%94%AF%E6%8C%81-%E7%88%B1%E5%8F%91%E7%94%9F-946ce6?logo=coffee)](https://afdian.net/a/zep4yrs)

<!-- 赞赏链接：替换为你的爱发电主页（或 GitHub Sponsors）；关于页 SPONSOR_URL 与此共用 -->

**在线体验**：<https://zep4yrs.github.io/struct/>

| 快速排序播放器                                                                              | 图的遍历                                                                                   |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| ![快速排序播放器](structvis/e2e/app.spec.ts-snapshots/quick-sort-player-chromium-win32.png) | ![图的遍历](structvis/e2e/app.spec.ts-snapshots/graph-traversal-player-chromium-win32.png) |

## 简介

StructVis 是一款面向自学者的交互式可视化学习工具，覆盖**数据结构**与 **MySQL 数据库**两大模块。它不是算法炫技的 Demo，也不是题库刷题平台，而是一个围绕教材章节设计的**过程型学习环境**：每一步都可以暂停、动手改参数、立刻看见结果。

核心目标：

- 把抽象的执行过程变成**可步进、可回放**的可视化动画
- 提供**即时反馈**的练习题，做错立刻解释
- 本地持久化学习进度与掌握度，错题自动进入错题本

## 功能特性

### 学习 · 可视化

- **86 个知识点**：数据结构 49 讲（排序 / 树 / 图 / 线性结构 / 查找 / 动态规划）+ 数据库 37 讲（查询 / 窗口函数 / 执行计划 / 建表 / 数据更新 / 视图 / 索引 / 触发器 / 存储过程 / E-R 模型 / 范式 / 事务并发 / 用户权限 + SQL 实验台：集合运算 / CASE / 函数 / 分组进阶 / 分页 / JOIN 家族 / 视图更新 / 索引失效 / EXPLAIN / 约束 / 回表 / 锁甘特图 / 可串行化调度）
- **步进可视化播放器**：逐帧、回放、调速、直接跳步、伪代码断点；22 类渲染分支按引擎插件化
- **动手模式**：先预测下一步会发生什么，再亲手点选画布验证
- **自定义数据**：输入自己的数据集（如 `9,4,6,2`），播放器实时重建动画
- **分享链接**：复制 URL 即恢复当前输入、步数与速度

### 练习 · 复习闭环

- **四类练习题型**：选择 / 填空 / 拖指针 / 补代码，答错即时给出正确答案与解析
- **错题本 + SRS**：错题自动收集、间隔复习排期（到期提醒）、标记已掌握
- **每日一题**：全网每天同一题，60 秒微学习
- **章节自测**：48 道题库按章随机抽题限时作答，成绩回写掌握度

### 竞技 · 工具

- **竞速实验室**：30 个排序引擎同屏竞速（21 经典 + 9 娱乐），实测复杂度曲线
- **技能图谱**：知识点前置依赖网络，规划学习路径
- **学习报告**：掌握度雷达、学习热力图，一键生成阶段总结
- **讲授工具**：投影模式（全屏大字号旁白）+ 讲授剧本导入导出 + 预录语音朗读
- **其他**：全站搜索（`/` 快捷键）、亮暗双主题（AA 对比度）、移动端适配、粒子背景可关闭

## 技术栈

Svelte 5 · SvelteKit · Tailwind v4 · Canvas 渲染器插件体系 · anime.js v4（时间线动画 + 数据动效）· three.js 粒子背景 · SQL 剧本引擎（sql.js 逐帧真实执行 · SQLite 方言，19 个 SQL 主题 + 自定义 SQL 入口）· Web Speech API 朗读 · Vitest + Playwright · adapter-static 纯静态部署

## 快速开始

```bash
git clone https://github.com/zep4yrs/struct.git
cd struct/structvis
npm install
npm run dev        # http://localhost:5173/struct/
```

常用命令：

```bash
npm run test        # 单元测试（481）
npm run test:e2e    # 端到端测试（48 条，含视觉截图基线）
npm run check       # svelte-check 类型检查
npm run build       # 生产构建（输出到仓库根 docs/）
npm run lint        # Prettier + ESLint
```

## 项目结构

```
structvis/
├── src/
│   ├── lib/
│   │   ├── engines/          # 算法/SQL/DB 引擎（纯逻辑，implements AlgorithmEngine，配 .spec.ts）
│   │   ├── visualization/    # Canvas 渲染器（按 engine.renderType 插件化）
│   │   ├── components/
│   │   │   ├── player/       # AlgoPlayer / ControlBar / PracticePanel / CoachMarkLayer / HelpSheet…
│   │   │   ├── layout/       # AppLayout / TopBar / Sidebar / SearchDialog
│   │   │   └── ui/           # TopicGrid / Scene3D / ActivityHeatmap / RadarChart…
│   │   ├── content/          # topics.ts（72 课题单源）+ quiz-bank.ts（自测题库）
│   │   ├── stores/           # progress / settings（localStorage 持久化，带版本信封迁移）
│   │   └── styles/           # app.css 设计 token（亮/暗双主题）
│   └── routes/               # 98 个页面（/、/home、/catalog、ds×49、db×37、/progress、/quiz、/race、/map、/report、/settings、/about）
├── e2e/                      # Playwright 端到端测试（含视觉基线）
└── docs → ../docs            # 构建产物由 CI 自动提交，用于 GitHub Pages
```

## Roadmap

- [x] v2.0 — 步进可视化 / 四类题型 / 错题本 SRS / 讲授剧本 / 投影 / 移动端
- [x] v2.x — 章节自测 / 竞速实验室 / 技能图谱 / 学习报告 / 每日一题 / 首访引导 / AA 对比度治理
- [ ] 云同步（可选账号，Local-First 不动摇）
- [ ] 教师班级版（作业布置 / 班级掌握度热力图）
- [ ] 题库热更新 API

> 完整商业化与后端思路见仓库外的设计链路沉淀（spark-output/）。

## 贡献

欢迎 PR！新增一门课程只需三步（详见 [structvis/README.md](structvis/README.md) 的贡献指南）：

1. `src/lib/engines/` 实现引擎（配单测）
2. `src/lib/content/topics.ts` 加一条课题记录
3. 新建路由页组装 `AlgoPage` + `AlgoPlayer`，跑通三道质量门禁

提交前请确保 `npm run lint && npm run check && npm run test` 全绿。

## 文档维护约定

> 本节是给未来贡献者（包括作者自己）的防漂移规则：

- 知识点数 / 页面数 / 引擎数等**一切数字以源码为准**：topics.ts、quiz-bank.ts、routes 目录是唯一事实来源，README 不手写估算值
- 新增课程或页面时，需同步检查：本 README 功能特性与项目结构、`structvis/README.md` 目录速览、应用内 `/about` 关键数字（后者已是派生值，一般无需动）
- 测试规模变化时更新徽章与「常用命令」注释

## 支持

如果 StructVis 帮到了你，欢迎[请作者喝杯咖啡](https://afdian.net/a/zep4yrs)——服务器、题库更新与新课程开发都靠这份支持续命。全部学习功能永久免费。

## 许可

[GPL-3.0](LICENSE)（GNU General Public License v3）。Copyright (c) 2026 枫桥 (zep4yrs)。

你可以自由使用、修改、分发本项目，但**基于本项目的衍生作品必须同样以 GPL-3.0 开源**——防止有人拿去闭源商用。

## 关于

见应用内 `/about` 页面（含功能全景与关键数字，均为派生值）。
