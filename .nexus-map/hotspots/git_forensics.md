# Git 热点与耦合分析 — Git Forensics

> generated_by: nexus-mapper v2
> verified_at: 2026-08-01
> provenance: 降级探测 — 仓库 `.git` 存在但 master 分支无任何 commit，git_detective.py 无法执行

## 结论：热点分析跳过

```
[ERROR] git -C <repo> log --since=90 days ago --name-only
fatal: your current branch 'master' does not have any commits yet
```

- 仓库是新建的（`git init` 后从未 commit），没有任何历史
- 因此：无 hotspots、无 coupling_pairs、无作者/提交频率数据
- 后续 commit 积累后（建议至少 20+ commits），重新运行：

```bash
python <skill>/scripts/git_detective.py <repo> --days 90 > .nexus-map/raw/git_stats.json
```

## 无 git 数据时的替代风险提示（基于 AST 静态判断）

以下内容**不是** git 分析结论，仅作为无热点数据时的工程直觉补充：

- **修改频率预期最高的文件**：`QuickSortEngine.ts`（371 行，步进生成逻辑最复杂）、`AlgoPlayer.svelte`（341 行，timeline 控制）、`array-render-utils.ts`（208 行）——若后续 git 热点出现偏离，值得质疑"核心系统"假设
- **强耦合候选对**：QuickSortEngine ↔ types（接口变更必然波及）；AlgoPlayer ↔ ArrayRenderer（renderType 分支扩展时必然共变）——扩展新渲染器（tree/graph）时这两个文件是主要变更面

## 提交建议（对齐文档 §7.3 Conventional Commits）

仓库尚无首次提交。首次提交建议按逻辑分层：
1. `chore: init structvis sveltekit scaffold`（脚手架部分）
2. `feat: quicksort stepwise engine + player`（引擎+播放器）
3. `feat: array renderer with tween animation`
4. `feat: layout, navigation and design tokens`
5. `test: vitest scaffold`

## 证据缺口

- 无任何 commit 数据：Evolution 维度（热点、耦合对、变更风险）整体缺失，本文件的后续部分仅剩静态推断
