<script lang="ts">
	import { onDestroy } from 'svelte';
	import { QuickSortEngine } from '$lib/engines/algorithm/quicksort/QuickSortEngine';
	import { MergeSortEngine } from '$lib/engines/algorithm/basicsort/MergeSortEngine';
	import { BubbleSortEngine } from '$lib/engines/algorithm/basicsort/BubbleSortEngine';
	import { SelectionSortEngine } from '$lib/engines/algorithm/basicsort/SelectionSortEngine';
	import { InsertionSortEngine } from '$lib/engines/algorithm/basicsort/InsertionSortEngine';
	import { HeapSortEngine } from '$lib/engines/algorithm/basicsort/HeapSortEngine';
	import { ShellSortEngine } from '$lib/engines/algorithm/basicsort/ShellSortEngine';
	import { RadixSortEngine } from '$lib/engines/algorithm/basicsort/RadixSortEngine';
	import RendererSwitch from '$lib/components/player/RendererSwitch.svelte';
	import { STEP_DURATIONS } from '$lib/components/player/TimelineController';
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
		},
		{
			id: 'heap-sort',
			name: '堆排序',
			complexity: 'O(n log n)',
			color: '#6b21a8',
			make: () => new HeapSortEngine()
		},
		{
			id: 'shell-sort',
			name: '希尔排序',
			complexity: 'O(n^1.3)',
			color: '#0e7490',
			make: () => new ShellSortEngine()
		},
		{
			id: 'radix-sort',
			name: '基数排序',
			complexity: 'O(d·n)',
			color: '#be185d',
			make: () => new RadixSortEngine()
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

	let dataSize = $state(8); // 规模滑块（元素数量）
	let data = $state<number[]>(randomData(8));
	// data 变化（换数据/换长度）时自动重建全部跑道
	const racers = $derived(buildRacers(data));

	// === 真竞速：每引擎独立时间线（每步按真实类型时长，与播放器完全一致） ===
	let elapsedMs = $state(0); // 比赛进行时间（逻辑时间，speed 作用于推进速率）
	let playing = $state(false);
	let speed = $state(1);
	let raf = 0;
	let lastFrameTs = $state(0);

	function resetRun() {
		playing = false;
		if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
		elapsedMs = 0;
	}

	function regenerate() {
		resetRun();
		data = randomData(dataSize);
	}

	function onSizeChange() {
		// 滑块变化：按新规模重新生成数据
		resetRun();
		data = randomData(dataSize);
	}

	/** 每步实际时长（ms）：规模越大单步越快，总时长稳定在 ~45s，避免大数组跑太久 */
	const maxStepsAll = $derived.by(() => {
		let m = 1;
		for (const r of racers) m = Math.max(m, r.engine.steps.length);
		return m;
	});
	const perStepMs = $derived(Math.min(400, Math.max(20, Math.round(45000 / maxStepsAll))));

	/** 引擎总时长（ms）= 各步骤按类型时长的累加 × 节奏缩放，与播放器时间线一致 */
	function totalDurMs(r: Racer): number {
		let sum = 0;
		for (const s of r.engine.steps)
			sum += (STEP_DURATIONS[s.type] || STEP_DURATIONS.default) * 1000;
		return Math.max(sum * (perStepMs / 400), 1);
	}

	/** 引擎 i 的独立进度 0..1（到达 1 即冲线完成） */
	function raceProgress(r: Racer): number {
		return Math.min(1, elapsedMs / totalDurMs(r));
	}

	function togglePlay() {
		if (allFinished) {
			resetRun();
		}
		playing = !playing;
		if (playing) {
			lastFrameTs = performance.now();
			tick();
		} else if (typeof cancelAnimationFrame !== 'undefined') {
			cancelAnimationFrame(raf);
		}
	}

	function tick() {
		const now = performance.now();
		const dt = now - lastFrameTs;
		lastFrameTs = now;
		elapsedMs += dt * speed;
		if (!allFinished) {
			raf = requestAnimationFrame(tick);
		} else {
			playing = false;
		}
	}

	onDestroy(() => {
		// SSR 销毁时无 cancelAnimationFrame（Node 环境），守卫跳过
		if (typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(raf);
	});

	// === 每引擎统计 ===
	/** 渲染播放位置（浮点，渲染器在相邻步骤间插值 → 平滑动画） */
	function posOf(r: Racer): number {
		const n = r.engine.steps.length;
		if (n <= 1) return 0;
		return Math.min(n - 1, raceProgress(r) * (n - 1));
	}

	/** 当前到达的整数步骤（统计用） */
	function stepOf(r: Racer): number {
		return Math.floor(posOf(r));
	}

	/** 引擎是否已冲线（完成） */
	function isDone(r: Racer): boolean {
		return raceProgress(r) >= 1;
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

	const allFinished = $derived(racers.every(isDone));
	// 冲线顺序：按各自真实总时长，第一个完成的是冠军
	const finishOrder = $derived.by(() => {
		return [...racers].map((r) => ({ r, ms: totalDurMs(r) })).sort((a, b) => a.ms - b.ms);
	});
	const winner = $derived.by(() => {
		if (!allFinished) return null;
		return finishOrder[0]?.r ?? null;
	});

	// 显示比赛用时（秒）
	const raceSeconds = $derived(elapsedMs / 1000);

	// === 复杂度曲线：x=比赛时间(秒) y=累计操作数（各引擎同尺度） ===
	const CHART_W = 720;
	const CHART_H = 220;
	const PAD = { l: 40, r: 12, t: 16, b: 28 };
	// 横轴最大值：最长引擎的完成时间（秒）
	const maxTimeSec = $derived.by(() => {
		let m = 1;
		for (const r of racers) m = Math.max(m, totalDurMs(r) / 1000);
		return Math.ceil(m);
	});
	const maxOpsAll = $derived.by(() => {
		let m = 1;
		for (const r of racers) m = Math.max(m, totalOps(r));
		return m;
	});

	/** 曲线只画到当前已完成的步骤——随比赛实时生长，完成后才是完整实测曲线 */
	function curvePoints(r: Racer): string {
		const n = r.engine.steps.length;
		if (n <= 1) return '';
		const upto = Math.min(n - 1, stepOf(r));
		const iw = CHART_W - PAD.l - PAD.r;
		const ih = CHART_H - PAD.t - PAD.b;
		let acc = 0;
		let tAcc = 0;
		const pts: string[] = [];
		for (let i = 0; i <= upto; i++) {
			const t = r.engine.steps[i]?.type;
			if (
				t === 'compare' ||
				t === 'swap' ||
				t === 'pivot-select' ||
				t === 'partition-start' ||
				t === 'partition-end'
			)
				acc += 1;
			// x = 该步完成时的比赛时间（按步骤类型时长累计，与播放器一致）
			tAcc += (STEP_DURATIONS[t] || STEP_DURATIONS.default) * 1000;
			const x = PAD.l + (tAcc / 1000 / maxTimeSec) * iw;
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
		同一份乱序数组，五个排序算法同时开跑。每步节奏相同——步数少的先冲线。看谁先跑完，复杂度一目了然。
	</p>

	<!-- 控制条 -->
	<div class="race-controls glass" use:reveal>
		<button class="btn btn-accent" onclick={togglePlay}
			>{playing ? '⏸ 暂停' : allFinished ? '↻ 重跑' : '▶ 开跑'}</button
		>
		<button class="btn btn-ghost" onclick={regenerate}>换一组数据</button>
		<div class="race-size">
			<span class="race-speed-label">规模</span>
			<input
				type="range"
				min="6"
				max="64"
				step="2"
				bind:value={dataSize}
				oninput={onSizeChange}
				aria-label="数据规模"
			/>
			<span class="race-size-num">{dataSize} 个</span>
		</div>
		<div class="race-speed">
			<span class="race-speed-label">速度</span>
			{#each [1, 2, 4] as s (s)}
				<button class="race-speed-btn" class:on={speed === s} onclick={() => (speed = s)}
					>{s}×</button
				>
			{/each}
		</div>
		<div class="race-timer" aria-live="polite">
			<span class="race-timer-num">{raceSeconds.toFixed(1)}</span>
			<span class="race-timer-unit">秒</span>
			{#if allFinished}
				<span class="race-timer-done">比赛结束</span>
			{/if}
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
					{#if isDone(r)}
						<span class="race-crown">{winner?.id === r.id ? '🏆 冠军' : '✓ 完成'}</span>
					{/if}
				</div>
				<div class="race-canvas">
					<RendererSwitch engine={r.engine} playbackPos={posOf(r)} />
					{#if !isDone(r) && playing}
						<div class="race-lane-progress" style="width: {raceProgress(r) * 100}%;"></div>
					{/if}
				</div>
				<div class="race-lane-stats">
					<span class="race-stat">步数 <b>{r.engine.steps.length}</b></span>
					<span class="race-stat">操作 <b>{opCount(r, stepOf(r))}</b> / {totalOps(r)}</span>
					<span class="race-stat">用时 <b>{(totalDurMs(r) / 1000).toFixed(1)}s</b></span>
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
				>0s</text
			>
			<text x={CHART_W - PAD.r} y={CHART_H - PAD.b + 18} text-anchor="end" class="race-chart-label"
				>{maxTimeSec}s</text
			>
			<text x={PAD.l} y={PAD.t - 6} class="race-chart-label">操作数</text>
			<text
				x={CHART_W - PAD.r}
				y={CHART_H - PAD.b + 18}
				text-anchor="end"
				class="race-chart-label"
				transform="translate(-40 0)">时间 →</text
			>
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
		{#if allFinished && winner}
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

	.race-size {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: 4px;
	}

	.race-size input[type='range'] {
		width: 120px;
		accent-color: var(--color-accent);
	}

	.race-size-num {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-ink-2);
		min-width: 40px;
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

	.race-timer {
		display: flex;
		align-items: baseline;
		gap: 6px;
		margin-left: auto;
		font-family: var(--font-mono);
	}

	.race-timer-num {
		font-size: 22px;
		font-weight: 500;
		color: var(--color-ink);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.race-timer-unit {
		font-size: 11px;
		color: var(--color-ink-3);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.race-timer-done {
		font-size: 11px;
		color: var(--color-success);
		font-weight: 500;
	}

	.race-lane-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 3px;
		background: var(--color-accent);
		opacity: 0.7;
		transition: width 80ms linear;
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
		position: relative;
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
