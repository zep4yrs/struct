# 系统间依赖关系

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: TypeScript import 由 AST 支撑；Svelte 组件依赖 inferred from manual inspection（svelte 无结构查询，module-only 覆盖）；inferred 边已标注

## Mermaid 依赖图

```mermaid
graph TD
    R[页面层 routes/] --> P[播放器 player/]
    R --> E[引擎层 engines/]
    R --> L[布局与状态 layout+stores]
    P --> E
    P --> V[渲染器层 visualization/]
    P --> L
    V --> L
    E --> T[types.ts 契约]
```

## 关键依赖事实

| 关系 | 方向 | 证据 |
| --- | --- | --- |
| 引擎契约 | E → types.ts | 4 引擎均实现 `AlgorithmEngine`（AST 4 个 Class 节点，均位于 engines/） |
| 播放器 → 引擎 | P → E | AlgoPlayer props 类型 `AlgorithmEngine<unknown>`，页面创建引擎实例传入 |
| 播放器 → 渲染器 | P → V | AlgoPlayer 模板按 `engine.renderType` 4 分支分发（inferred，Svelte 模板） |
| 渲染器 → token | V → app.css | 渲染器经 `resolveCSSVar`/`watchThemeChange` 读主题 token（inferred，import 在 visualization-utils） |
| 播放器 → 进度 | P → progress store | `updateTopicMastery`/`addMistake` 由 PracticePanel 答题触发 |
| 布局 → 设置 | L → settings store | TopBar toggleTheme；+layout.svelte `$effect` 同步 `<html class="dark">` |
| 页面 → 播放器 | R → P | 各播放器页 `import AlgoPlayer` + `<AlgoPlayer {engine} ...>` |

## 分层方向（无反向违规）

- 引擎层不 import 渲染器/播放器/页面（纯数据生成）→ 引擎可独立测试
- 渲染器只读 engine.steps + CSS token，不触碰 store/路由
- 页面是组装器：创建引擎、传入播放器、维护数据面板状态

## inferred 标注

- 所有 Svelte 组件间 `depends_on` 边为 manual inspection（svelte 无 AST import 边）
- `animejs`（devDependencies）无源码引用，推断为遗留依赖，不影响依赖图

## 风险提示

- `types.ts`（AlgorithmStep/AlgorithmEngine）是全局契约，改动影响所有引擎 + 播放器 + 渲染器（影响半径最大）
- `app.css` token 被全部 4 个渲染器 + 布局引用，重命名 token 需同步 visualization-utils
