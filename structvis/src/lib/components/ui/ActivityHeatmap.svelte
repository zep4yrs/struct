<script lang="ts">
	/**
	 * 学习热力图 — GitHub 风格：最近 52 周 × 7 天，颜色深浅 = 当日练习次数。
	 * 纯 CSS grid 实现，无依赖。
	 */
	interface Props {
		activity: Record<string, number>;
	}

	let { activity }: Props = $props();
	// 防御：旧数据可能缺 dailyActivity 字段，兜底为空对象
	const safeActivity = $derived(activity ?? {});

	function localDateStr(d: Date): string {
		const pad = (n: number) => String(n).padStart(2, '0');
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
	}

	const today = $derived(new Date());
	const cells = $derived.by(() => {
		const sunday = new Date(today);
		sunday.setDate(sunday.getDate() - ((sunday.getDay() + 1) % 7));
		const out: { date: string; count: number; level: number; isToday: boolean }[] = [];
		const todayStr = localDateStr(today);
		for (let w = 51; w >= 0; w--) {
			for (let d = 0; d < 7; d++) {
				const day = new Date(sunday);
				day.setDate(sunday.getDate() - w * 7 + d);
				if (day > today) continue;
				const ds = localDateStr(day);
				const count = safeActivity[ds] ?? 0;
				out.push({ date: ds, count, level: countLevel(count), isToday: ds === todayStr });
			}
		}
		return out;
	});

	function countLevel(count: number): number {
		if (count <= 0) return 0;
		if (count === 1) return 1;
		if (count <= 3) return 2;
		if (count <= 6) return 3;
		return 4;
	}

	const totalCount = $derived(Object.values(safeActivity).reduce((a, b) => a + b, 0));
	const activeDays = $derived(Object.keys(safeActivity).length);

	const MONTH_LABELS = $derived.by(() => {
		const sunday = new Date(today);
		sunday.setDate(sunday.getDate() - ((sunday.getDay() + 1) % 7));
		const labels: { x: number; text: string }[] = [];
		let lastMonth = -1;
		for (let w = 51; w >= 0; w--) {
			const day = new Date(sunday);
			day.setDate(sunday.getDate() - w * 7);
			const m = day.getMonth();
			if (m !== lastMonth) {
				lastMonth = m;
				labels.push({ x: (51 - w) * 13, text: day.getMonth() + 1 + '月' });
			}
		}
		return labels;
	});

	const LEVEL_COLORS = [
		'var(--color-subtle)',
		'rgba(45, 106, 79, 0.28)',
		'rgba(45, 106, 79, 0.5)',
		'rgba(45, 106, 79, 0.72)',
		'var(--color-success)'
	];
</script>

<div class="heatmap">
	<div class="heatmap-head">
		<span class="heatmap-total"
			>最近一年 <b>{totalCount}</b> 次练习 · <b>{activeDays}</b> 个活跃日</span
		>
	</div>
	<div class="heatmap-scroll">
		<div class="heatmap-months">
			{#each MONTH_LABELS as l (l.x)}
				<span class="heatmap-month" style="left: {l.x}px;">{l.text}</span>
			{/each}
		</div>
		<div class="heatmap-grid">
			{#each cells as c (c.date)}
				<div
					class="heatmap-cell"
					class:today={c.isToday}
					style="background: {LEVEL_COLORS[c.level]};"
					title="{c.date} · {c.count} 次练习"
				></div>
			{/each}
		</div>
	</div>
	<div class="heatmap-legend">
		<span class="heatmap-legend-label">少</span>
		{#each LEVEL_COLORS as color, i (i)}
			<span class="heatmap-legend-cell" style="background: {color};"></span>
		{/each}
		<span class="heatmap-legend-label">多</span>
	</div>
</div>

<style>
	.heatmap {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.heatmap-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.heatmap-head b {
		color: var(--color-ink);
		font-weight: 500;
	}

	.heatmap-scroll {
		overflow-x: auto;
		padding-bottom: 4px;
	}

	.heatmap-months {
		position: relative;
		height: 16px;
		margin-left: 26px;
	}

	.heatmap-month {
		position: absolute;
		top: 0;
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-ink-3);
	}

	.heatmap-grid {
		display: grid;
		grid-auto-flow: column;
		grid-template-rows: repeat(7, 11px);
		grid-auto-columns: 11px;
		gap: 2.5px;
		width: max-content;
	}

	.heatmap-cell {
		width: 11px;
		height: 11px;
		border-radius: 2px;
	}

	.heatmap-cell.today {
		outline: 1.5px solid var(--color-accent);
		outline-offset: 1px;
	}

	.heatmap-legend {
		display: flex;
		align-items: center;
		gap: 3px;
		margin-left: auto;
	}

	.heatmap-legend-label {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--color-ink-3);
		margin: 0 4px;
	}

	.heatmap-legend-cell {
		width: 11px;
		height: 11px;
		border-radius: 2px;
	}
</style>
