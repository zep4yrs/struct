# StructVis 全仓库代码审查报告

> **✅ 修复状态（2026-08）：全部 38 个问题已修复并验收通过**（详见 `REVIEW_ISSUES.md` 对勾清单）
> 验收：`npm run check` 0 errors / 单测 395/395 / 构建成功 / E2E 30/30。
> 主要变更：AlgoPage×29 页、RendererSwitch、ConceptQuiz、Canvas 生命周期收敛（watchCanvasSize+ResizeObserver）、
> 导航/面包屑 topics.ts 单源化、ProcedureEngine 安全求值器、设置项生效、H1 崩溃修复、localStorage 版本化、CI 加 E2E。

> 审查范围：`structvis/` 全部源码（149 个文件：31 页 / 29 引擎 / 12 渲染器 / 4 store / 38 spec）+ 配置文件 + CI + 文档 + 构建产物
> 审查方式：全局静态扫描（any/断言/注入面/localStorage/监听器）+ 核心文件逐行精读 + 2 个并行子代理深审引擎层/渲染器层/页面层/测试/文档 + `npm audit` 依赖审计 + 构建产物（docs/）体积与代码分割核对
> 行号以审查时工作区为准

## 一、总体评价

**整体质量：优秀（可发布水准），但有 2 个真实功能缺陷与 1 处代码执行注入面需要立即处理。**

这是一份罕见的"干净"代码库：全仓库 **0 处 `any` / `as any` / `@ts-ignore` / TODO / console.log / innerHTML / eval**；TypeScript strict 全程开启且 `svelte-check` 0 errors；392 个单元测试全部实质断言（`requireAssertions` 强制）；31 个页面无占位页；引擎层（AlgorithmEngine 契约）与渲染器层（renderType 插件化）边界清晰、无反向依赖；SSR 安全（所有 DOM 操作均 `browser` 守卫）；事件监听/GSAP timeline/MutationObserver 全部成对清理，**未发现资源泄漏**；SQL 求值器为手写解析（无 eval），主题 token 体系规范。

主要短板集中在三处：**① 功能层 2 个缺陷**（建表页可复现白屏崩溃、设置页两项设置无效）暴露了 e2e 覆盖缺口；**② 系统级重复已到重构临界**（15 个页面共享同一份样式样板、12 个渲染器重复 ~500 行生命周期样板、课程导航数据三处硬编码且已漂移）；**③ 文档滞后于代码**（子目录 README 还是脚手架模板、规划文档停在 v0.1 且含已修复 bug 的错误建议）。

## 二、高优先级问题（必须修复）

- **[structvis/src/routes/db/tables/+page.svelte:44 + :62] 自定义解析成功后切回「示例」必然白屏崩溃**
  `applyCustom()` 成功路径执行 `selectedPreset = -1`（:62），而 `displaySql = $derived(showCustom ? customSql : PRESETS[selectedPreset].sql)`（:44）在用户点「示例」按钮（`showCustom=false`）时访问 `PRESETS[-1].sql` → `undefined.sql` TypeError，整页崩溃。
  *影响*：核心页最常见交互路径（自定义建表 → 看示例）直接白屏；该页 e2e 零覆盖所以未被发现。
  *建议*：`applyCustom` 成功后重置 `selectedPreset = 0`（或 `PRESETS[selectedPreset]?.sql ?? ''` 守卫），并补一条 e2e 回归。

- **[structvis/src/routes/settings/+page.svelte:4-11 ↔ AlgoPlayer.svelte:66 / PracticePanel.svelte:131] 设置页「动画速度」「显示提示」两项设置无效（只写不读）**
  全仓库 grep 确认 `animationSpeed` / `showHints` 仅 settings 页写入；AlgoPlayer 的 `speed` 硬编码 `$state(1)`，PracticePanel 的提示按钮只看 `question.hint`。用户调了设置但播放器行为不变。
  *影响*：已上线功能名不副实；E2E 只断言设置页渲染与主题切换，未验证这两项生效。
  *建议*：AlgoPlayer 初始 `speed = $state($settings.animationSpeed)` 并监听变化；PracticePanel 读 `$settings.showHints` 决定默认展开；补单测/E2E 断言。

- **[structvis/src/lib/engines/sql/ProcedureEngine.ts:447] `new Function` 动态执行用户输入的表达式（全仓库唯一代码执行注入面）**
  `_evalExpr` 把存储过程表达式中的变量名替换为值后 `new Function(`return ${replaced}`)()` 执行。用户可在自定义存储过程写入 `SET a = '");恶意代码//'` 类输入，经变量替换拼接后任意 JS 被执行（self-XSS）。
  *影响*：静态站无服务端、无跨用户数据，但用户可能粘贴他人分享的 SQL 片段；作为教学工具应零容忍代码执行。
  *建议*：替换为只支持 `+ - * / ( )`、数字与变量查表的迷你表达式求值器（无函数调用、无字符串拼接执行），或至少白名单字符集 + 拒绝非数字 token。

- **[structvis/src/lib/visualization/graph/GraphRenderer.svelte:60 ↔ src/lib/styles/app.css] `--color-success-deep` token 缺失，图/KMP 渲染器「done 态」节点渲染为灰色 #999**
  GraphRenderer/KmpRenderer 读取 `--color-success-deep`，但 app.css 从未定义；`resolveCSSVar` 缺省返回字符串 `'#999'`（truthy），导致 `|| resolveCSSVar('--color-success')` 兜底永不触发。测试注入的 token 表（test-setup.ts）同样缺此变量，故未被测试捕获。
  *影响*：Dijkstra 确定顶点、MST 已选节点、KMP 命中态等"完成"语义的深绿（设计值 #1F4D38）实际显示为灰色，明暗主题皆如此，教学高亮语义受损。
  *建议*：在 app.css 的 `:root` 与 `.dark` 补 `--color-success-deep`（浅色 #1F4D38 / 深色提亮），并加入 test-setup.ts 注入表。

- **[structvis/src/lib/content/topics.ts:150-231 + Sidebar.svelte:72-105] 触发器、存储过程两个已实现页面不可达（内容孤岛）**
  `db/triggers`、`db/procedures` 页面与 TriggerEngine/ProcedureEngine（各 11/12 条单测）均已实现，但 dbTopics 与侧栏均无入口，全站搜索（数据源同样来自 topics.ts）也搜不到；progress 页被迫用 `EXTRA_TOPICS` 硬编码补名称（progress/+page.svelte:14-16）。
  *影响*：已上线内容用户无法发现，目录数字与事实不符。
  *建议*：加入 dbTopics + Sidebar + 搜索索引；并顺手删掉 progress 页的 EXTRA_TOPICS 变通。

- **[structvis/src/routes/db/sql/+page.svelte:57 ↔ topics.ts:141] `topicId` 不一致：SQL 课进度"写进黑洞"**
  页面用 `topicId="sql-select"`，目录数据用 `topicId: 'sql'`。TopicGrid/progress 按 `sql` 读，SQL 页答题掌握度写入 `sql-select` → 目录进度条与进度页统计永远看不到 SQL 课的数据。
  *建议*：统一为 `sql`（或反向），并加一条"topicId 与 topics.ts 一致"的契约测试（demoScript.spec.ts 已有类似先例）。

## 三、中优先级问题（建议修复）

- **[progress.ts:155-160] 连续学习天数用 UTC 日期，东八区跨午夜断档**
  `new Date().toISOString().slice(0,10)` 是 UTC 日。00:00–08:00（本地）学习的记录会被记到前一天，两天同一时刻学习可能被判定为"断开"重置 streak。目标用户为中国学生，影响真实。
  *建议*：用本地日期（`getFullYear/getMonth/getDate` 拼接）。

- **[parseInput.ts:15-16] `parseInt` 宽松解析：`"12abc"→12`、`"1.5"→1`、`"0x1F"→0` 静默截断**
  自定义输入框里的错误数字被悄悄"修正"，用户得不到反馈，排序结果与预期不符时困惑。
  *建议*：`/^-?\d+$/` 先行校验或 `Number(s)` + 整数检查后再 `throw Error`。

- **[AlgoPlayer.svelte:1318 行] 播放器单文件过大 + 渲染器分发块重复两份（:441-467 / :652-677）+ 投影时双渲染器实例并存**
  投影开启时主区与投影区两个渲染器实例同时存活：每帧 2× 全量重绘 + 2× MutationObserver + 2× resize 监听。nexus-map 已连续两轮标注此文件为最高复杂度点。
  *建议*：抽 `RendererSwitch.svelte`（${engine.renderType} 分发），投影时隐藏/卸载主区实例；长期拆分 timeline 构建与练习逻辑。

- **[AppLayout.svelte:28-53 + Sidebar.svelte:25-105 + topics.ts] 课程导航数据三处硬编码且已漂移**
  getCrumb 20+ 个 if 分支 + `[current]...[/current]` 字符串协议；侧栏分组、目录、面包屑三份独立数据，新增一课要改 3-4 个文件（triggers/procedures 只存在于面包屑就是漂移证据）。
  *建议*：topics.ts 单源化（含分组/面包屑/搜索索引），Sidebar 与 AppLayout 由它派生。

- **[15 个 ds 播放器页 + db 页] 页面样式样板与 quiz 逻辑大面积复制**
  15 个 ds 页共享逐字节相同的 ~1097B `<style>` 块；db/overview 与 db/users 的 QuizItem/判题状态/pick 逻辑整块重复（各 ~100 行）。
  *建议*：抽 `AlgoPage` / `PageHeader` / `ConceptQuiz` 公共组件。

- **[12 个渲染器] ~500 行生命周期样板重复 + 只监听 window.resize 无 ResizeObserver**
  resizeCanvas+$effect+onMount+onDestroy+updateColorsFromCSS 在 12 个文件几乎逐字相同；侧栏折叠、移动端键盘弹出等容器尺寸变化不触发重绘（位图与 CSS 尺寸脱节 → 模糊/留白）。
  *建议*：抽共享 `CanvasHost`（统一 DPR/ResizeObserver 节流/主题监听/清理），预计净减 400+ 行。

- **[5 个基础渲染器 14 处] `ctx.font = '... var(--font-mono)'`：Canvas 2D 不解析 CSS 变量，字体声明整条失效**
  ArrayRenderer:276/285/356、TreeRenderer:174、LinkedRenderer:101/165/199/221、StackRenderer:84/99、SqlTableRenderer:62/90/112/146。字号/字重/字体族全部静默回退默认 10px sans-serif（不止字体族丢失）；而 Er/BTree/Graph/KMP/Huffman/Hashtable 6 个渲染器用字面量字体栈，两派不一致。
  *建议*：统一字面量字体栈常量，或 `resolveCSSVar('--font-mono')` 取 family 后拼装，收进共享 utils。

- **[SearchDialog.svelte] 模态 a11y 与交互缺陷**
  ① `aria-modal="true"` 但无焦点陷阱，Tab 可逃逸到背景（:85）；② 关闭后焦点不归还触发按钮（:40-44）；③ 结果收缩后 `selected` 越界 → Enter 静默失效（:73）；④ 无 `aria-activedescendant`，方向键选择读屏不可感知（:119-121）；⑤ `go()` 用 `window.location.href` 全页刷新而非 `goto()`（:40-41）。
  *建议*：焦点圈定 + 归还、`selected` 夹取、aria-activedescendant、改 goto()。

- **[AlgoPlayer.svelte:367-373] 投影模式按 Esc 需要两次**
  浏览器全屏下第一次 Esc 被浏览器消费（退出全屏），页面收不到 keydown，`projector` 状态不同步，需再按一次才退出投影层。
  *建议*：监听 `fullscreenchange`，退出全屏时同步 `projector = false`。

- **[.github/workflows/deploy.yml] CI 不跑 E2E；e2e 覆盖集中在一条链路**
  CI 只有 check + 单测 + build；27 条 e2e 仅在本地运行。且 e2e 只访问 13/31 个 URL——ds 19 页 16 页零覆盖，db 侧 tables/er/index/normalize/update/triggers/procedures 零覆盖（建表页崩溃因此漏网）。`waitForTimeout(1300)` 固定等待与 STEP_DURATIONS 耦合（e2e/app.spec.ts:30-31）。
  *建议*：CI 增加 e2e job（含 `npx playwright install --with-deps`）；优先补 tables/sql/graph-storage 三条用例；固定 sleep 改 `expect.poll`。

- **[structvis/README.md（全文件）] 子目录 README 是未替换的 sv 脚手架模板；根 README 与 about 页部分过期**
  ① structvis/README.md 内容与项目零关联；② 根 README.md:47 渲染器列表停留在 array/tree/linkedlist/sql-table/pseudocode（缺 graph/kmp/huffman/hashtable/er/btree/stack/queue）；③ about/+page.svelte:72 与根 README:57 写「数据库 9 课」但列出 11 项；④ StructVis-长期开发文档.md 状态停在 v0.1、:287-305 动画时长表与 AlgoPlayer.svelte:110 实际值（0.8-1.5s）不符、:322 建议的 `tweenTo(步骤序数)` 正是 AlgoPlayer.svelte:120-124 注释警告已修复的坑、:653-656 部署写 build/+main 实际 docs/+master；⑤ N08-UI-Design.md 无"已过时"标注。
  *建议*：删除/替换 structvis/README.md；同步计数与状态；给长期文档加修订日期与"以代码为准"声明。

- **[页面层] try/catch 错误处理策略不统一**：仅 db/tables/+page.svelte:59 有页面级 try/catch，其余 30 页全部依赖 AlgoPlayer.svelte:85-89 内部兜底；引擎 init 抛错（如非法默认数据）时无页面级约定，未来新页面绕过 AlgoPlayer 直接 init 会裸抛。建议在 AlgoPlayer/引擎工厂层统一"init 抛错 → 页面显示错误"模式，并写进贡献指南。
- **[src/test/canvas-mock.ts:27] 记录式 canvas 断言的有效性边界**：只记录调用 + 颜色快照，`measureText` 固定返回 len*7——能验证"画了什么文本、什么颜色"，无法验证布局（重叠/出界/位置）。颜色断言真实有效，但渲染器布局 bug 会漏网。建议选 1-2 个渲染器补尺寸/坐标断言（如 bar x/y 单调性），golden 截图可暂缓。
- **[persistent.ts:24] localStorage 反序列化 `as T` 无 schema 校验与版本迁移**
  未来 ProgressData/Settings 结构变更（加字段/改字段类型）后，旧版本数据会以残缺形态进入运行时，可能出现 `undefined` 访问崩溃，且静默无提示。
  *建议*：加 `STORAGE_VERSION` 字段与按版本的 migrate 函数；读取时校验关键字段存在性。

- **[依赖审计] npm audit：1 high + 3 low，全部在 dev 链，无 critical/moderate**
  high：nanoid 3.3.16 <3.3.18（GHSA-2v37-7h3g-55p8，仅自定义生成器 size=0 死循环，静态站不可达）；low：cookie 0.6.0 <0.7.0 经 @sveltejs/kit 2.70.2（服务端 cookie 解析缺陷，本应用无服务器，kit 升级 ≥2.71 即解）。另 `animejs` 在 devDependencies 全源码零引用（遗留）。
  *建议*：`npm i -D @sveltejs/kit@^2.71` + nanoid 升级（或 `npm audit fix`）；移除 animejs。

## 四、低优先级问题（可选优化）

- **[ArrayRenderer.svelte:140,43-44 / SqlTableRenderer.svelte:139] 硬编码亮色值不随主题联动**：compare 底色 #E8EFF5、partition 半透明蓝、行高亮 rgba(217,119,6,.12) 在暗色主题下对比度差。应收进 colors 状态走主题解析。
- **[ArrayRenderer.svelte:161] `Math.max(...data)` spread**：空数组 → -Infinity（被 Math.max(6,…) 兜住）；大数据量有栈风险。建议 reduce 或每步缓存 maxValue。
- **[TreeRenderer:123 / GraphRenderer:196 / HuffmanRenderer:119] 每帧重算布局**：与播放位置无关的布局在每帧全量重绘时重复递归计算（Huffman 每帧还调 3 次 stepHighlights）。建议按 floor(playbackPos) 做 `$derived` 缓存。
- **[KmpRenderer.svelte:106] `↑ i` 指针无文本边界校验**：异常帧时指针文字画到画布外；建议与 `↑ j` 一致加 inBounds 守卫。
- **[SqlTableRenderer.svelte:73 / HashtableRenderer.svelte:157] 防御缺口**：columns 空数组除零得 Infinity；slots[i] 为 undefined 时画出 "undefined"。建议 `== null` 兜底。
- **[StackRenderer.svelte:140] `mode` prop 未被 effect 追踪**：当前靠 {#key} 重挂载掩盖，运行中切 stack/queue 会白屏（潜伏缺陷）。
- **[ControlBar.svelte:129] 进度条 role="slider" 无键盘操作；`disabled` 只挡键盘不拦鼠标拖拽**：a11y 与语义不一致。
- **[AlgoPlayer.svelte 弹窗 / PracticePanel] 无焦点陷阱与初始焦点**：aria-modal 声明与键盘行为不一致（SearchDialog 有 focus 到 input，播放器弹窗没有）。
- **[app.html:9-13] Google Fonts 外链**：目标用户在中国大陆，fonts.googleapis.com 不可达/慢 → 字体回退且渲染阻塞；另有隐私外泄。建议自托管 woff2 或退系统字体栈。`<meta name="text-scale">` 为非标准标签可删。
- **[.npmrc] `engine-strict=true` 但 package.json 无 `engines` 字段**：配置无效；加 `"engines": {"node": ">=20"}` 或删除。
- **[routes/layout.css] 未使用模板遗留**（0 引用，与 app.css 重复 @import tailwindcss），可删。
- **[topics.ts] `planned` 字段无实际条目**（死字段）；TopicGrid.svelte:61 的 `:hover:not([aria-disabled='true'])` 引用了从不设置的属性。
- **[ds/quick-sort/+page.ts] `ssr=false` 仅此一页**：与其他 30 页不一致，预渲染为空壳，疑为历史遗留，需确认是否有真实原因。
- **[测试计数漂移] AGENTS.md 写 392/38、nexus 写 364/36、实测 366/38**；`src/lib/vitest-examples/greet.spec.ts` 样板遗留未删。
- **[app.css:99-109] `body::before` 纸纹 overlay z-index:1000** 覆盖在所有弹窗（z 60-80）之上（pointer-events:none 不影响交互，但视觉上弹窗蒙在纸纹下）。
- **[LICENSE © 2025 vs 页面 © 2026]** 年份不一致，统一署名。
- **[db/tables/+page.svelte:117] 多行 SQL 预设塞进单行 `<input type="text">`**：换 `<textarea>`。

## 五、总结与最佳实践建议

**修复顺序建议**：H1 白屏崩溃与 H2 设置失效（各半小时）→ H4 注入面（半天，换求值器）→ H3 token、H5/H6 导航与 topicId（半天）→ 补 e2e（tables/sql/graph-storage 三条）并把 e2e 放进 CI → 再启动系统性重构。

**整体提升方向**：
1. **单源化课程数据**：topics.ts 成为目录/侧栏/面包屑/搜索的唯一数据源（含分组、面包屑、topicId 契约测试），消灭三处漂移与内容孤岛；
2. **抽公共组件**：AlgoPage/PageHeader/ConceptQuiz/RendererSwitch/CanvasHost 五件套，预计净减 1500+ 重复行，并顺带解决 canvas font、ResizeObserver、每帧重绘调度三个系统性问题；
3. **测试投入转向 e2e 面**：单元测试已达 366 条且质量高，当前最薄弱的是 e2e 覆盖（31 页只测 13 个 URL）与 CI 缺失，一次 PR 就漏掉两个功能缺陷，成本比单测大得多；
4. **文档与代码同步机制**：给 StructVis-长期开发文档.md 加"最后验证日期+以代码为准"头，删除脚手架 README，课程计数统一由 topics.ts 派生（页面用 `{dsTopics.length}` 已示范）；
5. **安全基线**：把"引擎输入解析必须走 parseInput 白名单校验、禁止 new Function/eval"写进贡献指南；localStorage 加版本迁移；
6. **依赖卫生**：升级 kit ≥2.71 清 cookie advisory、移除 animejs 遗留依赖、补 engines 字段。