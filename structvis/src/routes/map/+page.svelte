<script lang="ts">
	import { progress } from '$lib/stores/progress';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/utils/motion';
	import {
		SKILL_NODES,
		SKILL_EDGES,
		SKILL_GROUP_ORDER,
		type SkillNode,
		type SkillEdge
	} from '$lib/content/skill-graph';

	const NODES: SkillNode[] = SKILL_NODES;
	const EDGES: SkillEdge[] = SKILL_EDGES;
	const GROUP_ORDER: readonly string[] = SKILL_GROUP_ORDER;

	const NODE_W = 128;
	const NODE_H = 46;
	const COL_GAP = 20;
	const ROW_GAP = 50;
	const PAD_Y = 36;

	// 行内居中布局：每组占一行，组内节点水平均布
	const layout = $derived.by(() => {
		const pos: Record<string, { x: number; y: number }> = {};
		const rowWidth = (g: string) => {
			const count = NODES.filter((n) => n.group === g).length;
			return count * NODE_W + Math.max(0, count - 1) * COL_GAP;
		};
		// 画布宽度随最宽行自适应（新课程入册无需手调），下限保证窄内容也有呼吸感
		const w = Math.max(1200, ...GROUP_ORDER.map(rowWidth));
		let y = PAD_Y;
		for (const g of GROUP_ORDER) {
			let x = (w - rowWidth(g)) / 2;
			for (const n of NODES.filter((n) => n.group === g)) {
				pos[n.id] = { x, y };
				x += NODE_W + COL_GAP;
			}
			y += NODE_H + ROW_GAP;
		}
		return { pos, w };
	});

	const W = $derived(layout.w);
	const H = $derived(GROUP_ORDER.length * (NODE_H + ROW_GAP) + PAD_Y + 24);

	function masteryOf(id: string): number {
		const node = NODES.find((n) => n.id === id);
		if (!node?.topicId) return 0;
		return $progress.topics[node.topicId]?.mastery ?? 0;
	}

	function nodeState(id: string): 'done' | 'learning' | 'todo' {
		const m = masteryOf(id);
		if (m >= 80) return 'done';
		if (m > 0) return 'learning';
		return 'todo';
	}

	function edgePoints(edge: SkillEdge): string {
		const a = layout.pos[edge.from];
		const b = layout.pos[edge.to];
		if (!a || !b) return '';
		const ax = a.x + NODE_W / 2;
		const ay = a.y + NODE_H;
		const bx = b.x + NODE_W / 2;
		const by = b.y;
		// 简单三次曲线（垂直连线带轻微弧度）
		const mx = (ax + bx) / 2;
		return (
			'M ' +
			ax +
			' ' +
			ay +
			' C ' +
			mx +
			' ' +
			(ay + 6) +
			', ' +
			mx +
			' ' +
			(by - 6) +
			', ' +
			bx +
			' ' +
			by
		);
	}
</script>

<div class="mx-auto max-w-[1600px] px-8 py-16">
	<div class="section-label mb-4" use:reveal>技能图谱 · SKILL MAP</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		知识依赖图谱
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2); max-width: 560px;" use:reveal={{ delay: 160 }}>
		每个知识点是一块基石，箭头指向它的进阶方向。已掌握的节点点亮，学习中的节点半亮——看看你走到了哪一步。
	</p>

	<div class="map-legend glass" use:reveal>
		<span class="map-legend-item"><i class="map-dot done"></i>已掌握（≥80%）</span>
		<span class="map-legend-item"><i class="map-dot learning"></i>学习中</span>
		<span class="map-legend-item"><i class="map-dot todo"></i>未开始</span>
		<span class="map-legend-item map-edge-sample">→ 前置依赖</span>
	</div>

	<div class="map-panel glass" use:reveal>
		<svg width="100%" viewBox="0 0 {W} {H}" role="img" aria-label="知识依赖图谱">
			{#each EDGES as edge (edge.from + edge.to)}
				<path
					d={edgePoints(edge)}
					fill="none"
					stroke="var(--color-line-regular)"
					stroke-width="1.2"
					opacity="0.55"
					marker-end="url(#mapArrow)"
				/>
			{/each}
			<defs>
				<marker id="mapArrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
					<path d="M0,0 L7,3.5 L0,7 Z" fill="var(--color-line-regular)" opacity="0.7" />
				</marker>
			</defs>
			{#each NODES as n (n.id)}
				<g
					class="map-node"
					class:map-done={nodeState(n.id) === 'done'}
					class:map-learning={nodeState(n.id) === 'learning'}
				>
					<a href={resolve(n.href as '/ds/quick-sort')}>
						<rect
							x={layout.pos[n.id].x}
							y={layout.pos[n.id].y}
							width={NODE_W}
							height={NODE_H}
							rx="8"
							fill="var(--color-surface)"
							stroke="var(--color-line-hair)"
						/>
						<text
							x={layout.pos[n.id].x + NODE_W / 2}
							y={layout.pos[n.id].y + NODE_H / 2 + 4}
							text-anchor="middle"
							class="map-node-text"
						>
							{n.title}
						</text>
						<title>{n.title} — {n.desc}{nodeState(n.id) === 'done' ? '（已掌握）' : ''}</title>
					</a>
				</g>
			{/each}
		</svg>
	</div>
</div>

<style>
	.map-legend {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 16px;
		padding: 10px 16px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		margin-bottom: 16px;
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.map-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.map-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
	}

	.map-dot.done {
		background: var(--color-success);
	}

	.map-dot.learning {
		background: var(--color-accent);
		opacity: 0.6;
	}

	.map-dot.todo {
		background: var(--color-line-regular);
	}

	.map-edge-sample {
		color: var(--color-ink-3);
	}

	.map-panel {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 18px 14px;
		overflow-x: auto;
	}

	.map-node {
		cursor: pointer;
		transition: opacity 150ms var(--ease-out);
	}

	.map-node rect {
		transition:
			fill 150ms var(--ease-out),
			stroke 150ms var(--ease-out),
			filter 150ms var(--ease-out);
	}

	.map-node:hover rect {
		stroke: var(--color-accent);
		filter: drop-shadow(0 2px 6px rgba(217, 119, 6, 0.25));
	}

	.map-node.map-done rect {
		fill: rgba(45, 106, 79, 0.14);
		stroke: var(--color-success);
	}

	.map-node.map-learning rect {
		fill: rgba(217, 119, 6, 0.08);
		stroke: var(--color-accent);
	}

	.map-node-text {
		font-size: 12.5px;
		fill: var(--color-ink);
		font-weight: 500;
		pointer-events: none;
	}
</style>
