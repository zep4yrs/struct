<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, HighlightType } from '$lib/engines/algorithm/types';
	import {
		precomputeBarIdentities,
		easeOutCubic
	} from './array-render-utils';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

	let canvasEl: HTMLCanvasElement | undefined;
	let ctx: CanvasRenderingContext2D | null = null;
	let dpr = 1;

	let barIdsAtStep = $derived(precomputeBarIdentities(steps));

	let canvasWidth = 600;
	let canvasHeight = 280;

	const PADDING_X = 40;
	const PADDING_TOP = 48;
	const PADDING_BOTTOM = 44;
	const BAR_GAP_RATIO = 0.35;

	// 颜色 — 编辑技术极简主义
	let colors = $state({
		bg: 'transparent',
		defaultBar: '#F3F1EC',
		defaultBorder: '#E5E2DB',
		pivot: '#9B2226',
		compare: '#1B4965',
		sorted: '#2D6A4F',
		current: '#D97706',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		baseline: '#E5E2DB',
		partitionBg: 'rgba(27, 73, 101, 0.04)',
		partitionBorder: 'rgba(27, 73, 101, 0.12)'
	});

	function resolveCSSVar(name: string): string {
		return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#999';
	}

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			bg: 'transparent',
			defaultBar: resolveCSSVar('--color-subtle'),
			defaultBorder: resolveCSSVar('--color-line-hair'),
			pivot: resolveCSSVar('--color-danger'),
			compare: resolveCSSVar('--color-academic'),
			sorted: resolveCSSVar('--color-success'),
			current: resolveCSSVar('--color-accent'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			baseline: resolveCSSVar('--color-line-hair'),
			partitionBg: 'rgba(27, 73, 101, 0.04)',
			partitionBorder: 'rgba(27, 73, 101, 0.12)'
		};
	}

	function getBarLayout(n: number) {
		const availableWidth = canvasWidth - PADDING_X * 2;
		const totalBarWidth = availableWidth / n;
		const barWidth = totalBarWidth * (1 - BAR_GAP_RATIO);
		const gap = totalBarWidth * BAR_GAP_RATIO;
		const maxHeight = canvasHeight - PADDING_TOP - PADDING_BOTTOM;
		return { barWidth, gap, maxHeight, startX: PADDING_X };
	}

	function getBarX(position: number, n: number): number {
		const { barWidth, gap, startX } = getBarLayout(n);
		return startX + position * (barWidth + gap) + gap / 2;
	}

	function getBarHeight(value: number, maxValue: number, maxHeight: number): number {
		return Math.max(6, (value / maxValue) * maxHeight);
	}

	// 获取柱子颜色状态
	function getBarState(position: number, step: AlgorithmStep): {
		fill: string;
		border: string;
		compareRing: boolean;
		valueColor: string;
	} {
		const highlights = step.highlights;
		let fill = colors.defaultBar;
		let border = colors.defaultBorder;
		let compareRing = false;
		let valueColor = colors.ink3;

		// 优先级：pivot > sorted > current > compare > 默认
		// 状态可以叠加（比如 compare 是边框环 + 保持底色）

		const hasPivot = highlights.some((h) => h.type === 'pivot' && h.indices.includes(position));
		const hasSorted = highlights.some((h) => h.type === 'sorted' && h.indices.includes(position));
		const hasCompare = highlights.some((h) => h.type === 'compare' && h.indices.includes(position));
		const hasSwap = highlights.some((h) => h.type === 'swap' && h.indices.includes(position));
		const hasPointerI = highlights.some((h) => h.type === 'pointer-i' && h.indices.includes(position));
		const hasPointerJ = highlights.some((h) => h.type === 'pointer-j' && h.indices.includes(position));

		if (hasPivot) {
			fill = colors.pivot;
			border = colors.pivot;
			valueColor = colors.pivot;
		} else if (hasSorted) {
			fill = colors.sorted;
			border = colors.sorted;
			valueColor = colors.sorted;
		} else if (hasSwap) {
			fill = colors.pivot;
			border = colors.pivot;
			valueColor = colors.pivot;
		} else if (hasPointerI && !hasCompare) {
			fill = colors.current;
			border = colors.current;
			valueColor = colors.current;
		} else if (hasPointerJ && !hasCompare) {
			fill = colors.compare;
			border = colors.compare;
			valueColor = colors.compare;
		}

		if (hasCompare && !hasPivot && !hasSorted) {
			compareRing = true;
			fill = '#E8EFF5';
			border = colors.compare;
			valueColor = colors.compare;
		}

		return { fill, border, compareRing, valueColor };
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const fromIdx = Math.floor(pos);
		const toIdx = Math.min(fromIdx + 1, steps.length - 1);
		const t = pos - fromIdx;
		const easedT = easeOutCubic(t);

		const fromStep = steps[fromIdx];
		const toStep = steps[toIdx];
		const n = fromStep.data.length;

		const maxValue = Math.max(...fromStep.data, ...toStep.data);
		const { barWidth, maxHeight } = getBarLayout(n);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// 1. 分区背景
		drawPartitionBg(fromStep, toStep, easedT, n);

		// 2. 基线
		ctx.strokeStyle = colors.baseline;
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		const baselineY = canvasHeight - PADDING_BOTTOM;
		ctx.moveTo(PADDING_X, baselineY);
		ctx.lineTo(canvasWidth - PADDING_X, baselineY);
		ctx.stroke();

		// 3. 柱子
		const fromIds = barIdsAtStep[fromIdx] || [];
		const toIds = barIdsAtStep[toIdx] || [];
		const allIds = new Set([...fromIds, ...toIds]);

		for (const barId of allIds) {
			const fromPos = fromIds.indexOf(barId);
			const toPos = toIds.indexOf(barId);
			const actualFrom = fromPos >= 0 ? fromPos : toPos;
			const actualTo = toPos >= 0 ? toPos : fromPos;

			const currentPos = actualFrom + (actualTo - actualFrom) * easedT;
			const x = getBarX(currentPos, n);

			const value = fromStep.data[actualFrom] ?? toStep.data[actualTo];
			const height = getBarHeight(value, maxValue, maxHeight);
			const y = canvasHeight - PADDING_BOTTOM - height;

			const barState = getBarState(actualTo, toStep);

			const fill = barState.fill;
			const border = barState.border;
			const valueColor = barState.valueColor;
			const compareRing = barState.compareRing;

			drawBar(x, y, barWidth, height, fill, border, compareRing);

			// 柱子底部数值
			drawBarValue(x, canvasHeight - PADDING_BOTTOM + 8, value, valueColor);

			// 索引（底部）
			drawBarIndex(x, canvasHeight - PADDING_BOTTOM + 24, Math.round(currentPos));
		}

		// 4. 指针标签（文字式，不是胶囊）
		drawPointerLabels(fromStep, toStep, easedT, n);
	}

	function drawBar(
		x: number,
		y: number,
		w: number,
		h: number,
		fill: string,
		border: string,
		compareRing: boolean
	) {
		if (!ctx) return;
		const radius = Math.min(3, w / 2);

		// 比较态的外发光环
		if (compareRing) {
			ctx.save();
			ctx.shadowColor = colors.compare;
			ctx.shadowBlur = 0;
			ctx.strokeStyle = colors.compare;
			ctx.lineWidth = 2;
			ctx.beginPath();
			const rx = x - 2;
			const ry = y - 2;
			const rw = w + 4;
			const rh = h + 4;
			const rr = radius + 2;
			ctx.moveTo(rx + rr, ry);
			ctx.lineTo(rx + rw - rr, ry);
			ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
			ctx.lineTo(rx + rw, ry + rh);
			ctx.lineTo(rx, ry + rh);
			ctx.lineTo(rx, ry + rr);
			ctx.quadraticCurveTo(rx, ry, rx + rr, ry);
			ctx.closePath();
			ctx.globalAlpha = 0.15;
			ctx.fillStyle = colors.compare;
			ctx.fill();
			ctx.globalAlpha = 1;
			ctx.restore();
		}

		ctx.fillStyle = fill;
		ctx.strokeStyle = border;
		ctx.lineWidth = 1;

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + w - radius, y);
		ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
		ctx.lineTo(x + w, y + h);
		ctx.lineTo(x, y + h);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}

	function drawBarValue(x: number, y: number, value: number, color: string) {
		if (!ctx) return;
		ctx.fillStyle = color;
		ctx.font = '500 10px var(--font-mono)';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(String(value), x + 0.5, y);
	}

	function drawBarIndex(x: number, y: number, index: number) {
		if (!ctx) return;
		ctx.fillStyle = colors.ink3;
		ctx.font = '9px var(--font-mono)';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'top';
		ctx.fillText(`[${index}]`, x + 0.5, y);
	}

	function drawPartitionBg(
		fromStep: AlgorithmStep,
		toStep: AlgorithmStep,
		t: number,
		n: number
	) {
		if (!ctx) return;

		const fromHl = fromStep.highlights.find((h) => h.type === 'partition');
		const toHl = toStep.highlights.find((h) => h.type === 'partition');

		if (!fromHl && !toHl) return;

		const fromStart = fromHl?.indices[0] ?? 0;
		const fromEnd = fromHl?.indices[fromHl.indices.length - 1] ?? n - 1;
		const toStart = toHl?.indices[0] ?? 0;
		const toEnd = toHl?.indices[toHl.indices.length - 1] ?? n - 1;

		const start = fromStart + (toStart - fromStart) * t;
		const end = fromEnd + (toEnd - fromEnd) * t;

		const startX = getBarX(start, n) - 10;
		const endX = getBarX(end, n) + getBarLayout(n).barWidth + 10;

		const y = PADDING_TOP - 6;
		const height = canvasHeight - PADDING_TOP - PADDING_BOTTOM + 12;

		ctx.fillStyle = colors.partitionBg;
		ctx.fillRect(startX, y, endX - startX, height);

		ctx.strokeStyle = colors.partitionBorder;
		ctx.lineWidth = 1;
		ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.moveTo(startX, y);
		ctx.lineTo(startX, y + height);
		ctx.moveTo(endX, y);
		ctx.lineTo(endX, y + height);
		ctx.stroke();
		ctx.setLineDash([]);
	}

	function drawPointerLabels(
		fromStep: AlgorithmStep,
		toStep: AlgorithmStep,
		t: number,
		n: number
	) {
		if (!ctx) return;

		const pointerDefs = [
			{ type: 'pivot' as HighlightType, label: '基准', dy: -18, color: colors.pivot },
			{ type: 'pointer-i' as HighlightType, label: 'i', dy: -6, color: colors.current },
			{ type: 'pointer-j' as HighlightType, label: 'j', dy: -6, color: colors.compare }
		];

		for (const { type, label, dy, color } of pointerDefs) {
			const fromHl = fromStep.highlights.find((h) => h.type === type);
			const toHl = toStep.highlights.find((h) => h.type === type);

			const fromAlpha = fromHl ? 1 : 0;
			const toAlpha = toHl ? 1 : 0;
			const alpha = fromAlpha + (toAlpha - fromAlpha) * t;

			if (alpha <= 0.01) continue;

			const fromPos = fromHl?.indices[0] ?? toHl?.indices[0] ?? 0;
			const toPos = toHl?.indices[0] ?? fromHl?.indices[0] ?? 0;
			const pos = fromPos + (toPos - fromPos) * t;

			const x = getBarX(pos, n) + getBarLayout(n).barWidth / 2;
			const y = PADDING_TOP + dy;

			ctx.globalAlpha = alpha;
			ctx.fillStyle = color;
			ctx.font = '600 10px var(--font-mono)';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';

			ctx.fillText(label, x + 0.5, y);

			ctx.globalAlpha = 1;
		}
	}

	function resizeCanvas() {
		if (!browser || !canvasEl) return;
		const container = canvasEl.parentElement;
		if (!container) return;

		dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		canvasWidth = Math.max(300, rect.width);
		canvasHeight = Math.max(200, Math.min(360, rect.height));

		canvasEl.width = canvasWidth * dpr;
		canvasEl.height = canvasHeight * dpr;
		canvasEl.style.width = `${canvasWidth}px`;
		canvasEl.style.height = `${canvasHeight}px`;

		ctx = canvasEl.getContext('2d');
		if (ctx) ctx.scale(dpr, dpr);

		updateColorsFromCSS();
		draw();
	}

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});

	onMount(() => {
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		draw();
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('resize', resizeCanvas);
	});
</script>

<div class="array-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.array-canvas-wrap {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
