# Changelog

## [未发布]

### 新增（M3/M4 · 数据库课程补齐）

- **M3.1 高流量页迁移**：sql / join / left-join / group-by / subquery 五页改为剧本引擎，教学语义沿用原教材数据；退役删除 JoinEngine / LeftJoinEngine / GroupByEngine / SubQueryEngine；ScriptEngine 支持自定义 SQL 单帧真实执行（仅 sql.js 活跃时开放）
- **M4 过程型主题×3**（概念状态机演示，专用 Canvas 渲染器）：索引查询与回表（二级索引→主键回表全链路）、锁等待与死锁甘特图（持有/等待/回滚三态时间线 + victim 解环）、可串行化调度（冲突对识别 → 等价串行化）
- **M5.1**：counting-sort 孤儿路由入册；单源一致性治理（图谱/章节/别名/面包屑守卫 + 修复 9 处既有漂移）
- **防漂移闭环**：scripts/check-docs.mjs 接入 npm run lint——README 课题/页面数字与源码不一致时直接红

### 修复（audit 收尾）

- audit-8：自定义弹窗空字段禁用「应用」（原提交后才报错）；IsolationEngine 空 customConfig 导致的空弹窗按钮移除
- audit-5：键盘控制「模式分治」语义以注释固化（ControlBar 普通模式 / AlgoPlayer 投影模式，无重复响应）
- M3.6：保留者 IsolationEngine 补特征 spec（原为零测试）

### 新增（M2 · SQL 剧本站）

- **M2.0 骨架**：`ScriptEngine` 剧本引擎（帧 = SQL + 文案 + 行标签标注，伪代码面板随播放头展示本帧 SQL 与逻辑阶段）+ `sql-executor` 可选依赖加载器——安装 sql.js 并执行 `node scripts/setup-sqljs.mjs` 后逐帧真实执行；未安装时回落帧内静态演示数据（单测校验），页面功能完整
- **M2.3 集合运算**（/db/union-set）：UNION 并 / INTERSECT 交 / EXCEPT 差三结果对照 + 计数小结，行标签标注来源（仅Python/共有/仅C班）；sql-table 渲染器新增行标签徽标
- M2.13 e2e 剧本冒烟规格（db-scripts.spec.ts，新主题登记一行即可）

### 新增（产品）

- **首页开屏动画**：SVG 吸附拼装 + 物理变形 + 爆炸退场，Web Audio 合成音效（零音频资源）；设置开关 + 回访门控（仅首访播放）
- **首页功能全景（M1）**：01 区 4→6 卡（新增每日一题 / 全局搜索）、02 区 4→5 入口（学习进度置首）、新增 04 区「上课时」体验三卡、课程卡知识点动态徽标、Hero 副标语加入 SQL 表述
- **移动端**：全局底部导航栏（课程/进度/自测/竞速/图谱，<768px，安全区适配）；播放器移动端适配（M0）——控制条窄屏双行重排（修复 532→309px 溢出）、44px 触控热区、「⋯」更多抽屉（重置/朗读/帮助）、底部导航避让
- **竞速实验室**：经典 / 娱乐分组本地切换按钮；技能图谱容器与节点尺寸优化

### 变更（工程）

- **GSAP 归零**：TimelineController 迁移至 anime.js v4 Timeline + 显式泵循环（自管 setInterval seek，headless 可靠）；motion.ts 迁移官方 splitText / Scope 统一 reduced-motion；运行时依赖仅剩 animejs + three
- 测试：单测 498 条 / 48 条 E2E（新增 mobile.spec 移动端断言）

### 修复

- **内容单源一致性治理（Story 5 / audit-6）**：新增 content.spec.ts 守卫——图谱节点 topicId/href 与课题表强一致、章节全量覆盖、别名表无孤儿、面包屑含完整标题。据此修复既有漂移：图谱 advanced-query/update 节点的 topicId 与页面真实值（sql-advanced/dml）不符导致掌握度永不点亮；Trie（串与数组）与 N 皇后（回溯算法）分组不在 DS_GROUP_ORDER 内，侧边栏/图谱/章节三处不可见；9 个课题面包屑使用短名与标题不一致

## [2.0.0] — 2026-08

### 新增（产品）

- **练习题型升级**：新增三类交互题型——填空（fill-array）、拖指针（drag-pointer，数组格子点选）、补全代码（fill-code，代码行选择）；冒泡/快排/二叉树/二分查找四个核心主题已接入新题
- **讲授剧本外部化**：播放器头部「剧本」菜单——导出当前讲解词为 JSON、导入自定义剧本（按引擎名本地持久化）、一键恢复默认；未覆盖步骤类型自动回落到步骤描述
- **移动端体验**：竖屏布局重排（画布 62vh 优先 + 伪代码横向滚动）；投影模式窄屏紧凑布局（无全屏 API 时覆盖层即全屏）
- **SQL 教学扩展**：新增「窗口函数」（ROW_NUMBER/RANK/SUM OVER 分区排序逐步演示）与「执行计划与索引选择」（全表扫描 vs 索引查找代价对比）两个主题

### 工程

- 版本号 2.0.0；新增 CHANGELOG；CI 增加 lint 检查（prettier + eslint）
- 测试：单测 419 条 / 38→42 条 E2E（含剧本导入、移动端布局、SQL 新页）

## [1.0.0] — 2026-07（历史基线）

- 数据结构 19 课 + 数据库 13 课全部上线；演示/练习/投影三模式；进度与错题本（本地存储）
- 审查修复 38 项 + 迭代改进（E2E 扩面、截图回归、token 契约测试、进度备份）
- v1.2 重构：EngineBase / CanvasHost / TimelineController / PracticeController
