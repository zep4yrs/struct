# Changelog

## [未发布]

### 新增（2026-09-04 深夜批次 · 四模块）

- **卡片磨砂玻璃 + 3D 微悬浮**：.liquid 升级——噪点肌理并入卡片；hover 态 perspective 抬升 + rotateX 1.5° 倾斜 + 深投影（reduced-motion 降级）
- **目录页三分段去杂**：数据结构 / MySQL 课程 / SQL 实验 三分段 tab，一次专注一门；搜索仍跨段过滤
- **技能图谱轨道分区**：课程系（实线）vs 实验区（学术蓝虚线+淡底）颜色语义 + 轨道过滤器（全部/课程系/实验区）
- **SQL 工作台 + 关卡制**（/db/workbench，最大产品欠债清偿）：三栏工作台（关卡+Schema | 任务卡+编辑器 | 结果+EXPLAIN）；8 关卡三类判分器（结果集/计划关键字/库状态）；过关回写掌握度；判分纯函数 10 spec
- 底导滑块 + 拖拽滑切（drag-to-switch）+ tab 留白加宽（前批）
- 测试规模：491 单测 + 71 e2e

### 新增（v3 布局 · 全端统一移动应用范式）

- **顶栏移除，底部导航全端统一**：五 tab（首页/课程/实验/复习/我的）——桌面 ≥768px 居中悬浮胶囊，移动通栏贴底；课程内容页（/ds/_、/db/_）沉浸隐藏底导与动作簇，画布优先
- **课程目录页通讯录形态**：常驻搜索条（标题/别名实时过滤）+ 分组锚点 + 分组列表（行内掌握度条），取代侧边栏树与卡片网格
- **课程页路径线**：AlgoPage 新增「← 返回课程」+ 上一课/下一课 pager（课题单源顺序），侧栏移除后的学习路径线
- **我的 tab 聚合**：设置页顶部聚合学习进度/学习报告/章节自测/关于入口
- **全局动作簇**：搜索/主题/我的 收敛为右上浮动胶囊（课程页沉浸隐藏）；Ctrl+K 与 `/` 快捷键保留并全局生效
- 全局水合信号 `data-app-ready`（e2e 探测不再依赖具体按钮）；URL 零迁移（tab 是导航层）

### 新增（M3/M4 · 数据库课程补齐）

- **sql.js 正式入册**：`sql.js@1.14.2` 进入 dependencies，build 自动携带 dist（docs/sqljs 同源直出，生产零外部依赖；加载器保留版本锁定 CDN + SRI 作兜底）——19 个 SQL 剧本主题逐帧真实执行，「自定义 SQL」入口全站生效（e2e 由 skip 转为真实执行验证）
- **M3 全量迁移收官**：advanced-query / window-function / update / view / triggers / procedures 六页全部改为剧本引擎——SQLite 侧真实执行（窗口函数、视图、触发器为 SQLite 原生能力）；存储过程因 SQLite 不支持采用「语法演示帧」（staticOnly）；tables 表单页与 isolation/explain-plan 保留页维持现状
- **M3.6 退役清理完成**：删除 SelectEngine / DmlEngine / AdvancedQueryEngine / WindowFunctionEngine / ViewEngine / TriggerEngine / ProcedureEngine 及 sql-utils 共 8 模块 + 7 份 spec；TransactionEngine 的 SqlTable 类型统一到 algorithm/types
- **M4 过程型主题×3**（概念状态机演示，专用 Canvas 渲染器）：索引查询与回表（二级索引→主键回表全链路）、锁等待与死锁甘特图（持有/等待/回滚三态时间线 + victim 解环）、可串行化调度（冲突对识别 → 等价串行化）
- **剧本引擎健壮性**：每页独立内存库（修复 SPA 内重复访问页面时 seed 撞表导致整页装载失败的 bug）；staticOnly 语法演示模式
- **ConceptQuiz 掌握度回写**：overview / users 概念测验答对答错计入 progress（与播放器练习同一闭环，audit 遗留）
- **旁白音频覆盖剧本主题**：generate-narration 新增 21 个剧本 spec 的按帧合成（frame-<index> 键，presenterNote 驱动），AlgoPlayer 音频查找改为「帧号优先 → 步骤类型回落」；全站朗读语音统一为预录神经语音
- **输入防护**：自定义弹窗单字段 10000 字符上限（UI 层统一校验，超长禁用提交）
- **实验组教学顺序**：dbTopics 实验主题重排为「函数→CASE→分组→分页→集合→JOIN→视图→约束→索引线→并发线」认知顺序
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
