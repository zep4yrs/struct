# 静态测试面 — Test Coverage

> generated_by: nexus-mapper v2
> verified_at: 2026-08-01
> provenance: 静态分析（未执行任何测试命令）；测试配置来自 vite.config.ts 与文件树

## 测试基础设施（已就绪）

- **框架**：Vitest 4（`vitest/config` 引入），配置在 `structvis/vite.config.ts` 的 `test` 段
- **环境**：`server` project，`environment: 'node'`，include `src/**/*.{test,spec}.{js,ts}`，排除 `src/**/*.svelte.{test,spec}.{js,ts}`
- **断言纪律**：`expect: { requireAssertions: true }` — 禁止无断言的空测试
- **命令**：`npm run test`（`vitest --run` 单次执行）、`npm run test:unit`（watch）

## 实际测试文件

| 文件 | 内容 | 覆盖对象 |
|------|------|---------|
| `src/lib/vitest-examples/greet.spec.ts` | `greet()` 断言 | 纯样板函数，**不覆盖任何业务代码** |

## 核心模块测试覆盖情况（全部缺失）

| 核心模块 | 可测性评估 | 状态 |
|---------|-----------|------|
| `QuickSortEngine`（步进序列生成） | 高：纯逻辑、无 DOM，可直接断言 steps 序列/highlights/pseudocodeLine | **无测试** |
| `types.ts`（契约） | 类型层，无需运行时测试 | — |
| `array-render-utils`（身份追踪/插值） | 高：纯函数（precomputeBarIdentities 等） | **无测试** |
| `stores/persistent.ts`（localStorage 封装） | 中：需 mock `$app/environment` 与 localStorage | **无测试** |
| `stores/progress.ts`（掌握度/streak 逻辑） | 高：纯逻辑（updateStreak 边界：同日/连续/中断/首日） | **无测试** |
| `AlgoPlayer`/`ControlBar`（GSAP timeline） | 低~中：依赖 GSAP 与 Svelte 运行时，svelte 测试被排除在 include 之外 | **无测试** |

## 证据缺口

1. 未运行任何测试（守则5：最小执行面，不执行目标仓库脚本）；上述"无测试"为文件树/import 静态判断
2. 测试 include 规则排除 `.svelte.{test,spec}.{js,ts}`，意味着 Svelte 组件目前没有可运行的测试通道（如需要组件测试，需调整 vite.config.ts 添加 browser/jsdom project）
3. `vitest-examples/` 目录本身是脚手架样板，后续应替换为真实业务测试（如 QuickSortEngine 步进序列测试）

## 建议的测试优先级（v0.1）

1. `QuickSortEngine` 序列正确性（对固定输入断言：步骤数、最终有序、pivot 归位时机）
2. `progress.ts` streak/掌握度边界
3. `array-render-utils` 身份追踪（交换步骤的柱子映射）
