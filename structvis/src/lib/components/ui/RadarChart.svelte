<script lang="ts">
	/** 章节掌握度雷达图 — 六边形，SVG 无依赖 */
	interface Props {
		values: Record<string, number>; // 章节 → 平均掌握度 0-100
	}

	let { values }: Props = $props();

	const ORDER = ['线性结构', '树形结构', '图结构', '排序算法', '查找', 'SQL'];
	const labels: Record<string, string> = {
		线性结构: '线性',
		树形结构: '树',
		图结构: '图',
		排序算法: '排序',
		查找: '查找',
		SQL: 'SQL'
	};

	const SIZE = 240;
	const CX = SIZE / 2;
	const CY = SIZE / 2;
	const R = 88;

	function point(i: number, r: number): [number, number] {
		const angle = (Math.PI * 2 * i) / ORDER.length - Math.PI / 2;
		return [CX + Math.cos(angle) * r, CY + Math.sin(angle) * r];
	}

	const polygon = $derived(
		ORDER.map((k, i) => {
			const v = Math.max(0, Math.min(100, values[k] ?? 0));
			return point(i, (v / 100) * R);
		})
			.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1))
			.join(' ')
	);

	const grid = $derived(
		[0.25, 0.5, 0.75, 1].map((f) =>
			ORDER.map((_, i) => point(i, R * f))
				.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1))
				.join(' ')
		)
	);
</script>

<svg width="100%" viewBox="0 0 {SIZE} {SIZE}" role="img" aria-label="章节掌握度雷达图">
	{#each grid as g (g)}
		<polygon points={g} fill="none" stroke="var(--color-line-hair)" stroke-width="1" />
	{/each}
	{#each ORDER as _, i (i)}
		<line
			x1={CX}
			y1={CY}
			x2={point(i, R)[0]}
			y2={point(i, R)[1]}
			stroke="var(--color-line-hair)"
			stroke-width="1"
		/>
	{/each}
	<polygon
		points={polygon}
		fill="rgba(217, 119, 6, 0.16)"
		stroke="var(--color-accent)"
		stroke-width="2"
		stroke-linejoin="round"
	/>
	{#each ORDER as k, i (k)}
		<text
			x={point(i, R + 22)[0]}
			y={point(i, R + 22)[1]}
			text-anchor="middle"
			dominant-baseline="middle"
			class="radar-label"
		>
			{labels[k]}
		</text>
		<text
			x={point(i, R + 38)[0]}
			y={point(i, R + 38)[1]}
			text-anchor="middle"
			dominant-baseline="middle"
			class="radar-val"
		>
			{Math.round(values[k] ?? 0)}%
		</text>
	{/each}
</svg>

<style>
	.radar-label {
		font-family: var(--font-mono);
		font-size: 11px;
		fill: var(--color-ink-2);
	}

	.radar-val {
		font-family: var(--font-mono);
		font-size: 10px;
		fill: var(--color-ink-3);
	}
</style>
