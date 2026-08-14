<script lang="ts">
	import { onDestroy } from 'svelte';
	import { QuickSortEngine } from '$lib/engines/algorithm/quicksort/QuickSortEngine';
	import { MergeSortEngine } from '$lib/engines/algorithm/basicsort/MergeSortEngine';
	import { BubbleSortEngine } from '$lib/engines/algorithm/basicsort/BubbleSortEngine';
	import { SelectionSortEngine } from '$lib/engines/algorithm/basicsort/SelectionSortEngine';
	import { InsertionSortEngine } from '$lib/engines/algorithm/basicsort/InsertionSortEngine';
	import RendererSwitch from '$lib/components/player/RendererSwitch.svelte';
	import type { AlgorithmEngine } from '$lib/engines/algorithm/types';
	import { reveal } from '$lib/utils/motion';

	interface Racer {
		id: string;
		name: string;
		complexity: string; // O(n²) / O(n log n)
		color: string; // 跑道主题色
		engine: AlgorithmEngine<unknown>;
	}

	const ENGINE_FACTORIES = [
		{
			id: 'quick-sort',
			name: '快速排序',
			complexity: 'O(n log n)',
			color: 'var(--color-accent)',
			make: () => new QuickSortEngine()
		},
		{
			id: 'merge-sort',
			name: '归并排序',
			complexity: 'O(n log n)',
			color: 'var(--color-academic)',
			make: () => new MergeSortEngine()
		},
		{
			id: 'bubble-sort',
			name: '冒泡排序',
			complexity: 'O(n²)',
			color: '#9b2226',
			make: () => new BubbleSortEngine()
		},
		{
			id: 'selection-sort',
			name: '选择排序',
			complexity: 'O(n²)',
			color: '#2d6a4f',
			make: () => new SelectionSortEngine()
		},
		{
			id: 'insertion-sort',
			name: '插入排序',
			complexity: 'O(n²)',
			color: '#b8860b',
			make: () => new InsertionSortEngine()
		}
	] as const;

	function randomData(size = 12): number[] {
		// 随机打乱 1..size，保证互异且无序
		const arr = Array.from({ length: size }, (_, i) => i + 1);
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function buildRacers(data: number[]): Racer[] {
		return ENGINE_FACTORIES.map((f) => {
			const e = f.make();
			e.init([...data]);
			return { id: f.id, name: f.name, complexity: f.complexity, color: f.color, engine: e };
		});
	}

	let data = $state<number[]>(randomData(12));
	// data 变化（换数据/换长度）时自动重建全部跑道
	const racers = $derived(buildRacers(data));

	let progress = $state(0); // 0..1 归一化联播进度
	let playing = $state(false);
	let speed = $state(1);
	let raf = 0;
	let startTime = $state(0);

	function resetRun() {
		playing = false;
		cancelAnimationFrame(raf);
		progress = 0;
		startTime = 0;
	}

	function regenerate() {
		resetRun();
		data = randomData(data.length);
	}

	function newData() {
		// 随机换长度 8~16
		const size = 8 + Math.floor(Math.random() * 9);
		resetRun();
		data = randomData(size);
	}

	function togglePlay() {
		if (progress >= 1) {
			progress = 0;
			startTime = 0;
		}
		playing = !playing;
		if (playing) {
			startTime = performance.now() - (startTime ? progress * 6000 * (1 / speed) : 0);
			tick();
		} else {
			cancelAnimationFrame(raf);
		}
	}

	function tick() {
		const total = 6000; // 默认 6 秒跑完全程
		const elapsed = (performance.now() - startTime) * speed;
		progress = Math.min(1, elapsed / total);
		if (progress >= 1) {
			playing = false;
			return;
		}
		raf = requestAnimationFrame(tick);
	}

	onDestroy(() => {
		// SSR 销毁时无 cancelAnimationFrame（Node 环境），守卫跳过
		if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
	});

	// === 每引擎统计 ===
	function posOf(r: Racer): number {
		const n = r.engine.steps.length;
		if (n <= 1) return 0;
		return Math.min(n - 1, Math.floor(progress * (n - 1)));
	}

	function opCount(r: Racer, upTo: number): number {
		let c = 0;
		for (let i = 0; i <= upTo && i < r.engine.steps.length; i++) {
			const t = r.engine.steps[i]?.type;
			if (
				t === 'compare' ||
				t === 'swap' ||
				t === 'pivot-select' ||
				t === 'partition-start' ||
				t === 'partition-end'
			)
				c += 1;
		}
		return c;
	}

	function totalOps(r: Racer): number {
		return r.engine.steps.filter(
			(s) =>
				s.type === 'compare' ||
				s.type === 'swap' ||
				s.type === 'pivot-select' ||
				s.type === 'partition-start' ||
				s.type === 'partition-end'
		).length;
	}

	const finished = $derived(progress >= 1);
	// 冠军：总操作数最少（同输入、同速度 → 操作数即工作量）
	const winner = $derived.by(() => {
		if (!finished) return null;
		let best: Racer | null = null;
		let bestOps = Infinity;
		for (const r of racers) {
			const ops = totalOps(r);
			if (ops < bestOps) {
				bestOps = ops;
				best = r;
			}
		}
		return best;
	});

	// === 复杂度曲线：x=进度(0..100) y=累计操作数（各引擎同尺度） ===
	const CHART_W = 720;
	const CHART_H = 220;
	const PAD = { l: 40, r: 12, t: 16, b: 28 };
	const maxOpsAll = $derived.by(() => {
		let m = 1;
		for (const r of racers) m = Math.max(m, totalOps(r));
		return m;
	});

	function curvePoints(r: Racer): string {
		const n = r.engine.steps.length;
		if (n <= 1) return '';
		const iw = CHART_W - PAD.l - PAD.r;
		const ih = CHART_H - PAD.t - PAD.b;
		let acc = 0;
		const pts: string[] = [];
		for (let i = 0; i < n; i++) {
			const t = r.engine.steps[i]?.type;
			if (
				t === 'compare' ||
				t === 'swap' ||
				t === 'pivot-select' ||
				t === 'partition-start' ||
				t === 'partition-end'
			)
				acc += 1;
			const x = PAD.l + (i / (n - 1)) * iw;
			const y = PAD.t + ih - (acc / maxOpsAll) * ih;
			pts.push(x.toFixed(1) + ',' + y.toFixed(1));
		}
		return pts.join(' ');
	}

	// 理论参考曲线（归一化到图内）：x² 与 x·log₂(x+1)
	function theoryCurve(kind: 'quad' | 'nlog'): string {
		const iw = CHART_W - PAD.l - PAD.r;
		const ih = CHART_H - PAD.t - PAD.b;
		const S = 100;
		const pts: string[] = [];
		for (let i = 0; i <= S; i++) {
			const u = i / S;
			let v: number;
			if (kind === 'quad') v = u * u;
			else {
				v = u <= 0 ? 0 : u * Math.log2(u + 1);
				v /= Math.log2(2); // 归一化到 1
			}
			const x = PAD.l + u * iw;
			const y = PAD.t + ih - v * ih * 0.92 - ih * 0.04;
			pts.push(x.toFixed(1) + ',' + y.toFixed(1));
		}
		return pts.join(' ');
	}
</script>

<div class="mx-auto max-w-6xl p-8">
	<div class="section-label mb-4" use:reveal>竞速实验室 · RACE LAB</div>
	<h1
		class="mb-2 font-display text-5xl font-medium"
		style="letter-spacing: -0.03em;"
		use:reveal={{ delay: 90 }}
	>
		排序算法竞速
	</h1>
	<p class="mb-8" style="color: var(--color-ink-2); max-width: 560px;" use:reveal={{ delay: 160 }}>
		同一份乱序数组，五个排序算法同时开跑。进度同步、输入相同——比的就是谁的「操作数」更少。复杂度不是背的，是看出来的。
	</p>

	<!-- 控制条 -->
	<div class="race-controls glass" use:reveal>
		<button class="btn btn-accent" onclick={togglePlay}
			>{playing ? '⏸ 暂停' : progress >= 1 ? '↻ 重跑' : '▶ 开跑'}</button
		>
		<button class="btn btn-ghost" onclick={regenerate}>换一组数据</button>
		<button class="btn btn-ghost" onclick={newData}>随机长度</button>
		<div class="race-speed">
			<span class="race-speed-label">速度</span>
			{#each [0.5, 1, 2] as s (s)}
				<button class="race-speed-btn" class:on={speed === s} onclick={() => (speed = s)}
					>{s}×</button
				>
			{/each}
		</div>
		<div class="race-progress">
			<div class="race-progress-fill" style="width: {progress * 100}%;"></div>
		</div>
	</div>

	<!-- 跑道 -->
	<div class="race-grid">
		{#each racers as r (r.id)}
			<div class="race-lane glass" use:reveal>
				<div class="race-lane-head">
					<div class="race-lane-title">
						<span class="race-lane-dot" style="background: {r.color};"></span>
						<span class="race-lane-name">{r.name}</span>
						<span class="tag" style="border-color: {r.color}; color: {r.color};"
							>{r.complexity}</span
						>
					</div>
					{#if finished && winner?.id === r.id}
						<span class="race-crown">🏆 冠军</span>
					{/if}
				</div>
				<div class="race-canvas">
					<RendererSwitch engine={r.engine} playbackPos={posOf(r)} />
				</div>
				<div class="race-lane-stats">
					<span class="race-stat">步数 <b>{r.engine.steps.length}</b></span>
					<span class="race-stat">操作 <b>{opCount(r, posOf(r))}</b> / {totalOps(r)}</span>
					<span class="race-stat"
						>进度 <b>{Math.round((posOf(r) / Math.max(1, r.engine.steps.length - 1)) * 100)}%</b
						></span
					>
				</div>
			</div>
		{/each}
	</div>

	<!-- 复杂度曲线 -->
	<div class="race-chart glass" use:reveal>
		<div class="chapter-head">
			<div class="section-label">复杂度实战曲线</div>
			<span class="chapter-count">实测操作数 · 输入 {data.length} 个元素</span>
		</div>
		<svg
			width="100%"
			viewBox="0 0 {CHART_W} {CHART_H}"
			role="img"
			aria-label="各算法实测操作数随进度变化曲线"
		>
			{#each racers as r (r.id)}
				<polyline
					points={curvePoints(r)}
					fill="none"
					stroke={r.color}
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					opacity="0.9"
				/>
			{/each}
			<polyline
				points={theoryCurve('nlog')}
				fill="none"
				stroke="var(--color-ink-3)"
				stroke-width="1.5"
				stroke-dasharray="4 4"
				opacity="0.5"
			/>
			<polyline
				points={theoryCurve('quad')}
				fill="none"
				stroke="var(--color-ink-3)"
				stroke-width="1.5"
				stroke-dasharray="2 4"
				opacity="0.5"
			/>
			<!-- 轴线 -->
			<line
				x1={PAD.l}
				y1={CHART_H - PAD.b}
				x2={CHART_W - PAD.r}
				y2={CHART_H - PAD.b}
				stroke="var(--color-line-regular)"
			/>
			<line
				x1={PAD.l}
				y1={PAD.t}
				x2={PAD.l}
				y2={CHART_H - PAD.b}
				stroke="var(--color-line-regular)"
			/>
			<text x={PAD.l - 6} y={CHART_H - PAD.b + 18} text-anchor="end" class="race-chart-label"
				>0%</text
			>
			<text x={CHART_W - PAD.r} y={CHART_H - PAD.b + 18} text-anchor="end" class="race-chart-label"
				>100%</text
			>
			<text x={PAD.l} y={PAD.t - 6} class="race-chart-label">操作数</text>
		</svg>
		<div class="race-legend">
			{#each racers as r (r.id)}
				<span class="race-legend-item"><i style="background: {r.color};"></i>{r.name}</span>
			{/each}
			<span class="race-legend-item"
				><i style="background: var(--color-ink-3); border-top: 1.5px dashed;"></i>理论 O(n log n)</span
			>
			<span class="race-legend-item"
				><i style="background: var(--color-ink-3); border-top: 1.5px dotted;"></i>理论 O(n²)</span
			>
		</div>
		{#if finished && winner}
			<div class="race-result" use:reveal>
				🏆 <b>{winner.name}</b> 以 {totalOps(winner)} 次操作夺冠（{winner.complexity}）。 同输入下
				O(n²) 的算法操作数明显多于 O(n log n)——这就是复杂度的真实含义。
			</div>
		{/if}
	</div>
</div>

<style>
	.race-controls {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 10px;
		padding: 14px 18px;
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		margin-bottom: 20px;
	}

	.race-speed {
		display: flex;
		align-items: center;
		gap: 4px;
		margin-left: 4px;
	}

	.race-speed-label {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-right: 4px;
	}

	.race-speed-btn {
		padding: 3px 10px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-2);
		background: transparent;
		border: 1px solid var(--color-line-regular);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition:
			border-color 120ms var(--ease-out),
			color 120ms var(--ease-out);
	}

	.race-speed-btn:hover {
		border-color: var(--color-ink);
		color: var(--color-ink);
	}

	.race-speed-btn.on {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.race-progress {
		flex: 1;
		min-width: 120px;
		height: 4px;
		background: var(--color-subtle);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.race-progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width 60ms linear;
	}

	.race-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 14px;
		margin-bottom: 20px;
	}

	.race-lane {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.race-lane-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.race-lane-title {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.race-lane-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.race-lane-name {
		font-family: var(--font-display);
		font-size: 15px;
		font-weight: 500;
		color: var(--color-ink);
		white-space: nowrap;
	}

	.race-crown {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-accent);
		animation: crown-pop 400ms var(--ease-out);
	}

	@keyframes crown-pop {
		from {
			transform: scale(0.6);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.race-canvas {
		height: 110px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		background: var(--color-subtle);
		overflow: hidden;
	}

	.race-lane-stats {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.race-stat b {
		color: var(--color-ink);
		font-weight: 500;
	}

	.race-chart {
		border: 1px solid var(--color-line-hair);
		border-radius: var(--radius-md);
		padding: 18px 20px;
	}

	.race-chart svg {
		display: block;
	}

	.race-chart-label {
		font-family: var(--font-mono);
		font-size: 10px;
		fill: var(--color-ink-3);
	}

	.race-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 10px;
		font-size: 12px;
		color: var(--color-ink-2);
	}

	.race-legend-item {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.race-legend-item i {
		width: 14px;
		height: 3px;
		border-radius: 2px;
		display: inline-block;
	}

	.race-result {
		margin-top: 12px;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		background: rgba(217, 119, 6, 0.08);
		border: 1px solid rgba(217, 119, 6, 0.3);
		color: var(--color-ink);
		font-size: 13px;
		line-height: 1.7;
	}
</style>
