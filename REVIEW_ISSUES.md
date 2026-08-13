# StructVis 代码审查问题清单（修复跟踪）

> 来源：`CODE_REVIEW_REPORT.md`（全仓库审查报告）
> 用法：修复一个问题，把该条前面的 `[ ]` 改为 `[x]` 即可打勾。建议按 高→中→低 顺序修复。
> 行号以审查时工作区为准；修完若行号漂移，以文件当前内容为准。

## 迭代改进（2026-08 第二批，全部完成 ✅）

- [x] **I1 E2E 覆盖补全**：er/index/normalize/update 四页冒烟 + 数据更新页练习弹题（非冒泡页链路）；settleTween 固定 sleep → 轮询 AlgoPlayer 新增的 data-tween-busy 信号（与动画时长彻底解耦）
- [x] **I2 渲染器截图回归**：3 条 toHaveScreenshot 基线（quick-sort/graph-traversal/binary-tree），maxDiffPixelRatio 0.05；基线在 e2e/app.spec.ts-snapshots/（注：CI Linux 首次运行需用 --update-snapshots 生成 linux 基线后提交）
- [x] **I3 token 契约测试**（src/lib/styles/app-css.spec.ts）：resolveCSSVar 引用 ⊆ app.css @theme + .dark 定义、且已注入 test-setup.ts——防 H4 类静默回退复发
- [x] **I4 学习进度备份**：进度页「数据备份」卡片（空状态也可导入恢复）；exportProgress/importProgress 支持版本信封 + 旧版裸数据兼容 + 非法数据拒绝；单测 4 条 + e2e 1 条（导出下载 + 导入恢复）

## 迭代改进（2026-08 第三批 · v1.2 中期重构，全部完成 ✅）

- [x] **D token 硬编码清零**：新增 --color-scrim（4 处弹窗/抽屉遮罩统一）；9 个渲染器 19 处反白文字 #FAF9F6 → colors.inkInverse（--color-ink-inverse token，暗色下对比度正确）
- [x] **C EngineBase 抽象**：src/lib/engines/algorithm/EngineBase.ts；29 个引擎全部 extends EngineBase，删除 steps/playbackPos/totalSteps/_stepId/getCurrentStep/getProgress/setProgress/reset 样板；setProgress 统一夹取（301 条引擎测试全过）
- [x] **B CanvasHost 组件化**：src/lib/visualization/CanvasHost.svelte（resize/ResizeObserver/主题监听/DPR 统一管理，回调注入模式）；11 个渲染器样板收敛，每个渲染器约 -45 行
- [x] **A AlgoPlayer 拆分**：TimelineController.ts（GSAP timeline/步骤→秒数换算/tweenTo 语义/busy 信号）与 PracticeController.ts（出题判题/错题落库）独立成可单测模块；AlgoPlayer 约 -120 行，SSR 卸载守卫修复

## 进度统计

- [x] **高优先级（P0）**：6 / 6 完成 ✅（2026-08 修复轮）
- [x] **中优先级（P1）**：15 / 15 完成 ✅（2026-08 修复轮）
- [x] **低优先级（P2）**：17 / 17 完成 ✅（2026-08 修复轮）

---

## 高优先级（P0）— 必须修复：功能 / 安全 / 视觉缺陷

- [x] **H1 建表页自定义后切回「示例」白屏崩溃**
  - 位置：`src/routes/db/tables/+page.svelte:44,62`
  - 问题：`applyCustom()` 成功后 `selectedPreset = -1`，`displaySql`（`PRESETS[selectedPreset].sql`）在 `showCustom=false` 时越界抛 TypeError。
  - 修复：① applyCustom 成功后重置 `selectedPreset = 0`；② `PRESETS[selectedPreset]?.sql ?? ''` 守卫；③ 补 e2e 回归（自定义→示例）。
- [x] **H2 设置页「动画速度」「显示提示」两项设置无效（只写不读）**
  - 位置：`src/routes/settings/+page.svelte:4-11` ↔ `src/lib/components/player/AlgoPlayer.svelte:66` / `PracticePanel.svelte:131`
  - 问题：`animationSpeed`/`showHints` 仅 settings 页写入，AlgoPlayer speed 硬编码 `$state(1)`，PracticePanel 提示只看 `question.hint`。
  - 修复：AlgoPlayer 初始 `speed = $state($settings.animationSpeed)` 并监听变化；PracticePanel 读 `$settings.showHints`；补单测/E2E 断言。
- [x] **H3 ProcedureEngine 用 `new Function` 动态执行用户表达式（唯一代码执行注入面）**
  - 位置：`src/lib/engines/sql/ProcedureEngine.ts:447`
  - 问题：变量替换后 `new Function(`return ${replaced}`)()`，用户 SQL 可构造任意 JS 执行（self-XSS）。
  - 修复：替换为仅支持 `+ - * / ( )`、数字与变量查表的迷你表达式求值器。
- [x] **H4 `--color-success-deep` token 缺失，图/KMP 渲染器 done 态渲染为灰色**
  - 位置：`src/lib/styles/app.css`（缺定义）↔ `GraphRenderer.svelte:60` / `KmpRenderer.svelte:49`
  - 问题：`resolveCSSVar` 缺省返回 `'#999'`（truthy），`||` 兜底永不生效。
  - 修复：`:root` 与 `.dark` 补 `--color-success-deep`（浅色 #1F4D38 / 深色提亮）；同步加入 `src/test-setup.ts` 注入表。
- [x] **H5 触发器 / 存储过程两个已实现页面不可达（内容孤岛）**
  - 位置：`src/lib/content/topics.ts:150-231` / `src/lib/components/layout/Sidebar.svelte:72-105`
  - 问题：dbTopics 与侧栏均无 `/db/triggers`、`/db/procedures` 入口，搜索也搜不到；progress 页靠 `EXTRA_TOPICS`（progress/+page.svelte:14-16）变通。
  - 修复：加入 dbTopics + Sidebar + 搜索索引；删除 EXTRA_TOPICS 变通。
- [x] **H6 /db/sql 页 topicId 与目录不一致，SQL 课进度丢失**
  - 位置：`src/routes/db/sql/+page.svelte:57`（`sql-select`）↔ `src/lib/content/topics.ts:141`（`sql`）
  - 问题：进度写入 `sql-select`，目录/进度页按 `sql` 读取。
  - 修复：统一为 `sql`；加"topicId 与 topics.ts 一致"契约测试（参考 demoScript.spec.ts 先例）。

## 中优先级（P1）— 建议修复：可维护性 / 体验 / 可靠性

- [x] **M1 连续学习天数用 UTC 日期，东八区跨午夜断档**
  - 位置：`src/lib/stores/progress.ts:155-160`
  - 修复：用本地日期（getFullYear/getMonth/getDate）替代 `toISOString()`。
- [x] **M2 `parseInt` 宽松解析静默截断错误输入**
  - 位置：`src/lib/engines/algorithm/parseInput.ts:15-16`
  - 问题：`"12abc"→12`、`"1.5"→1`、`"0x1F"→0`。
  - 修复：`/^-?\d+$/` 校验或 Number + 整数检查后抛错。
- [x] **M3 AlgoPlayer 单文件 1318 行 + 渲染器分发块重复两份 + 投影时双渲染器实例并存**
  - 位置：`src/lib/components/player/AlgoPlayer.svelte:441-467 / 652-677`
  - 修复：抽 `RendererSwitch.svelte`；投影时隐藏/卸载主区渲染器实例（双份重绘/监听）。
- [x] **M4 课程导航数据三处硬编码且已漂移**
  - 位置：`AppLayout.svelte:28-53`（getCrumb 20+ 分支 + `[current]` 字符串协议）/ `Sidebar.svelte:25-105` / `topics.ts`
  - 修复：topics.ts 单源化（含分组/面包屑），Sidebar 与 AppLayout 派生。
- [x] **M5 页面样式样板与 quiz 逻辑大面积复制**
  - 位置：15 个 ds 播放器页共享 1097B `<style>` 块；`db/overview/+page.svelte:2-59` 与 `db/users/+page.svelte:2-60` quiz 逻辑整块重复
  - 修复：抽 `AlgoPage` / `PageHeader` / `ConceptQuiz.svelte`。
- [x] **M6 12 个渲染器重复 ~500 行生命周期样板 + 缺 ResizeObserver**
  - 位置：各渲染器 `resizeCanvas`/`$effect`/`onMount`/`onDestroy`/`updateColorsFromCSS`（如 ArrayRenderer.svelte:366-410）
  - 修复：抽共享 `CanvasHost`（统一 DPR/ResizeObserver 节流/主题监听/清理），预计净减 400+ 行。
- [x] **M7 5 个基础渲染器 14 处 `ctx.font = '... var(--font-mono)'` 静默回退**
  - 位置：ArrayRenderer:276/285/356、TreeRenderer:174、LinkedRenderer:101/165/199/221、StackRenderer:84/99、SqlTableRenderer:62/90/112/146
  - 修复：统一字面量字体栈常量或 resolveCSSVar 拼装，收进共享 utils。
- [x] **M8 SearchDialog 模态 a11y 与交互缺陷**
  - 位置：`src/lib/components/layout/SearchDialog.svelte:40-44,73,85,119-121`
  - 问题：无焦点陷阱、关闭不归还焦点、`selected` 越界 Enter 失效、缺 `aria-activedescendant`；`go()` 用 `window.location.href` 全页刷新。
  - 修复：焦点圈定+归还、selected 夹取、aria-activedescendant、改 `goto()`。
- [x] **M9 投影模式按 Esc 需按两次**
  - 位置：`AlgoPlayer.svelte:367-373`
  - 修复：监听 `fullscreenchange`，退出全屏时同步 `projector = false`。
- [x] **M10 CI 不跑 E2E；e2e 覆盖缺口 + 固定 sleep 等待**
  - 位置：`.github/workflows/deploy.yml`；`e2e/app.spec.ts:30-31,404`
  - 问题：27 条 e2e 只访问 13/31 个 URL（tables/sql/graph-storage 等零覆盖）；`waitForTimeout(1300)` 与 STEP_DURATIONS 耦合。
  - 修复：CI 加 e2e job；优先补 tables/sql/graph-storage 三条用例；sleep 改 `expect.poll`。
- [x] **M11 文档漂移（README / 长期文档 / 过时设计稿）**
  - 位置：`structvis/README.md`（sv 模板未替换）；根 `README.md:47,57`；`about/+page.svelte:72`（9 vs 11 课）；`StructVis-长期开发文档.md`（v0.1 状态、时长表不符、:322 tweenTo 建议会复现已修 bug、部署段落写 build/+main）；`N08-UI-Design.md`（无过时标注）
  - 修复：删除/替换子目录 README；同步计数；长期文档加"以代码为准"声明与修订日期；N08 设计稿已随 2026-08 文档清理删除。
- [x] **M12 localStorage 反序列化无 schema 校验与版本迁移**
  - 位置：`src/lib/stores/persistent.ts:24`
  - 修复：加 `STORAGE_VERSION` 与按版本 migrate 函数。
- [x] **M13 依赖审计残留（1 high + 3 low，全在 dev 链）+ animejs 遗留**
  - 位置：`structvis/package.json`
  - 问题：nanoid 3.3.16 <3.3.18（high，静态站不可达）；cookie 0.6.0 经 @sveltejs/kit 2.70.2（low）；`animejs` 零引用遗留。
  - 修复：升级 kit ≥2.71（清 cookie）、nanoid ≥3.3.18；`npm uninstall -D animejs`。
- [x] **M14 页面层 try/catch 策略不统一**
  - 位置：页面层仅 `db/tables/+page.svelte:59` + `AlgoPlayer.svelte:85-89` 两处兜底
  - 修复：在 AlgoPlayer/引擎工厂层统一"init 抛错 → 页面显示错误"模式，写进贡献指南。
- [x] **M15 canvas-mock 记录式断言验证不了布局**
  - 位置：`src/test/canvas-mock.ts:27`
  - 修复：选 1-2 个渲染器补尺寸/坐标断言（如 bar x/y 单调性）。

## 低优先级（P2）— 可选优化

- [x] **L1 渲染器硬编码亮色值不随主题联动**
  - 位置：ArrayRenderer.svelte:140,43-44、SqlTableRenderer.svelte:139
  - 修复：收进 `colors` 状态走主题解析。
- [x] **L2 `Math.max(...data)` spread**
  - 位置：ArrayRenderer.svelte:161
  - 修复：reduce 或每步缓存 maxValue。
- [x] **L3 每帧重算布局未按 step 缓存**
  - 位置：TreeRenderer:123、GraphRenderer:196、HuffmanRenderer:119（每帧 3 次 stepHighlights）
  - 修复：按 floor(playbackPos) 做 `$derived` 缓存。
- [x] **L4 KmpRenderer `↑ i` 指针无文本边界校验**
  - 位置：KmpRenderer.svelte:106
- [x] **L5 SqlTableRenderer 列数除零 / HashtableRenderer slots[i] undefined**
  - 位置：SqlTableRenderer.svelte:73、HashtableRenderer.svelte:157
- [x] **L6 StackRenderer `mode` prop 未被 effect 追踪（潜伏缺陷）**
  - 位置：StackRenderer.svelte:140
- [x] **L7 ControlBar 进度条 role="slider" 无键盘操作；disabled 不拦鼠标拖拽**
  - 位置：ControlBar.svelte:129
- [x] **L8 播放器弹窗 / PracticePanel 无焦点陷阱与初始焦点**
  - 位置：AlgoPlayer.svelte 弹窗、PracticePanel.svelte
- [x] **L9 Google Fonts 外链（中国大陆不可达 + 渲染阻塞 + 隐私）**
  - 位置：`src/app.html:9-13`
  - 修复：自托管 woff2 或系统字体栈；删非标准 `<meta name="text-scale">`。
- [x] **L10 `.npmrc engine-strict` 无 `engines` 字段（配置无效）**
  - 位置：`structvis/.npmrc` / `package.json`
  - 修复：加 `"engines": {"node": ">=20"}` 或删除。
- [x] **L11 `routes/layout.css` 未使用模板遗留**
  - 位置：`src/routes/layout.css`（0 引用，重复 @import tailwindcss）
- [x] **L12 topics.ts `planned` 死字段 + TopicGrid `aria-disabled` 死选择器**
  - 位置：`src/lib/content/topics.ts`、`TopicGrid.svelte:61`
- [x] **L13 quick-sort 页 `ssr=false` 与其他 30 页不一致**
  - 位置：`src/routes/ds/quick-sort/+page.ts`（疑为历史遗留，需确认原因）
- [x] **L14 测试计数漂移 + greet.spec 样板遗留**
  - 位置：AGENTS.md（392/38）vs .nexus-map（364/36）vs 实测（366/38）；`src/lib/vitest-examples/greet.spec.ts`
- [x] **L15 `body::before` 纸纹 z-index:1000 覆盖所有弹窗**
  - 位置：`src/lib/styles/app.css:99-109`
- [x] **L16 LICENSE 年份/署名不一致**
  - 位置：根 LICENSE（© 2025 StructVis）vs 页面（© 2026 zep4yrs）；structvis/ 内无 LICENSE
- [x] **L17 db/tables 多行 SQL 预设塞进单行 input**
  - 位置：`db/tables/+page.svelte:117`，换 `<textarea>`