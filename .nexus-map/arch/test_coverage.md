# 静态测试面

> generated_by: nexus-mapper v2
> verified_at: 2026-08-02
> provenance: 文件系统扫描 + vitest 配置阅读；未运行测试（守则5：最小执行面）

## 测试配置

- 运行器：Vitest v4（`test:unit` 脚本），node 环境，`requireAssertions: true`（强制每条测试必须有断言）
- 命令：`npm run test`（CI 一键）、`npm run test:unit`（watch）
- 引擎 spec 与引擎源码同目录（`*.spec.ts`），共 4 个 spec 文件 / 12 个测试

## 覆盖矩阵

| spec 文件 | 数量 | 覆盖核心模块 | 验证内容 |
| --- | --- | --- | --- |
| `engines/algorithm/binarytree/BinaryTreeEngine.spec.ts` | 4 | BinaryTreeEngine | 前序/中序/后序/层序四种遍历访问序列正确性 |
| `engines/algorithm/linkedlist/SinglyLinkedListEngine.spec.ts` | 3 | SinglyLinkedListEngine | 插入/删除步骤生成、data 序列、高亮 indices |
| `engines/sql/SelectEngine.spec.ts` | 4 | SelectEngine | WHERE 筛选收缩结果集、GROUP BY 聚合、SELECT 投影、ORDER BY 排序（含曾捕获的真实 bug） |
| `vitest-examples/greet.spec.ts` | 1 | 样板 | vitest 环境自检（历史样板） |

## 证据缺口

- **QuickSortEngine 无测试**：Lomuto 分区/指针关键帧逻辑未被测试覆盖（实现较早，测试体系晚于它建立）
- **渲染器无测试**：4 个 Canvas 渲染器（布局/高亮绘制）无测试，也无 visual regression 基建；Canvas 在 node 环境不可测，属计划外
- **组件层无测试**：AlgoPlayer/ControlBar/PracticePanel/页面（示例/自定义切换、键盘控制）无组件测试
- **stores 无测试**：progress/settings/persistent 的 localStorage 逻辑无测试
- **实际运行验证**：`npm run check`（svelte-check 0 errors）、`npm run build`（adapter-static 全量预渲染成功）在开发周期内通过；lint 仅对改动文件格式化，`prettier --check` 全量仍有历史欠账
