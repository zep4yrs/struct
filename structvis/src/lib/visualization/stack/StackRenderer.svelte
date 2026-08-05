<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, watchThemeChange } from '../visualization-utils';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
		mode: 'stack' | 'queue';
	}

	let { steps, playbackPos, mode }: Props = $props();

	let canvasEl: HTMLCanvasElement | undefined;
	let ctx: CanvasRenderingContext2D | null = null;
	let dpr = 1;
	let unwatchTheme: (() => void) | undefined;

	let canvasWidth = 600;
	let canvasHeight = 320;

	const BLOCK_W = 84;
	const BLOCK_H = 36;
	const GAP = 6;
	const PAD = 16;
	const MAX_VISIBLE = 6;

	let colors = $state({
		node: '#FFFFFF',
		nodeBorder: '#D4D0C8',
		ink: '#1A1A1A',
		ink3: '#9A9A9A',
		current: '#D97706',
		compare: '#1B4965',
		pivot: '#9B2226',
		hover: '#F3F1EC'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			node: resolveCSSVar('--color-surface'),
			nodeBorder: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			compare: resolveCSSVar('--color-academic'),
			pivot: resolveCSSVar('--color-danger'),
			hover: resolveCSSVar('--color-subtle')
		};
	}

	function getHighlights(step: AlgorithmStep): {
		current: Set<number>;
		compare: Set<number>;
		pivot: Set<number>;
	} {
		const current = new Set(step.highlights.find((h) => h.type === 'current')?.indices ?? []);
		const compare = new Set(step.highlights.find((h) => h.type === 'compare')?.indices ?? []);
		const pivot = new Set(step.highlights.find((h) => h.type === 'pivot')?.indices ?? []);
		return { current, compare, pivot };
	}

	function drawBlock(
		x: number,
		y: number,
		value: number | string,
		state: { fill: string; border: string; text: string; lineWidth: number; dashed?: boolean }
	) {
		if (!ctx) return;
		const r = 6;
		ctx.beginPath();
		ctx.roundRect(x, y, BLOCK_W, BLOCK_H, r);
		ctx.fillStyle = state.fill;
		ctx.fill();
		ctx.strokeStyle = state.border;
		ctx.lineWidth = state.lineWidth;
		if (state.dashed) ctx.setLineDash([4, 3]);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.fillStyle = state.text;
		ctx.font = '600 14px var(--font-mono)';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(String(value), x + BLOCK_W / 2, y + BLOCK_H / 2 + 1);
	}

	function drawLabel(
		text: string,
		x: number,
		y: number,
		color: string,
		align: CanvasTextAlign = 'center'
	) {
		if (!ctx) return;
		ctx.fillStyle = color;
		ctx.font = '600 11px var(--font-mono)';
		ctx.textAlign = align;
		ctx.textBaseline = 'middle';
		ctx.fillText(text, x, y);
	}

	function drawArrow(x1: number, y1: number, x2: number, y2: number, color: string) {
		if (!ctx) return;
		const angle = Math.atan2(y2 - y1, x2 - x1);
		const headLen = 7;
		ctx.strokeStyle = color;
		ctx.lineWidth = 1.4;
		ctx.beginPath();
		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(x2, y2);
		ctx.lineTo(
			x2 - headLen * Math.cos(angle - Math.PI / 6),
			y2 - headLen * Math.sin(angle - Math.PI / 6)
		);
		ctx.moveTo(x2, y2);
		ctx.lineTo(
			x2 - headLen * Math.cos(angle + Math.PI / 6),
			y2 - headLen * Math.sin(angle + Math.PI / 6)
		);
		ctx.stroke();
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const values = step.data;
		const hl = getHighlights(step);

		if (mode === 'stack') {
			drawStack(values, hl);
		} else {
			drawQueue(values, hl);
		}
	}

	function drawStack(
		values: number[],
		hl: { current: Set<number>; compare: Set<number>; pivot: Set<number> }
	) {
		if (!ctx) return;
		const visible = values.slice(-MAX_VISIBLE);
		const offset = values.length - visible.length;
		const step = GAP + BLOCK_H;
		const containerH = visible.length * step - GAP + PAD * 2;
		const containerW = BLOCK_W + PAD * 2;
		const cx = canvasWidth / 2;
		const cy = canvasHeight / 2;
		const containerY = cy - containerH / 2;
		const containerX = cx - containerW / 2;

		// 容器外框
		ctx.strokeStyle = colors.nodeBorder;
		ctx.lineWidth = 1.4;
		ctx.beginPath();
		ctx.roundRect(containerX, containerY, containerW, containerH, 6);
		ctx.stroke();

		// 元素块（自底向上，栈底在下）
		for (let j = 0; j < visible.length; j++) {
			const blockY = containerY + containerH - PAD - (j + 1) * BLOCK_H - j * GAP;
			const idx = offset + j;
			const isCurrent = hl.current.has(idx);
			const isCompare = hl.compare.has(idx);
			const isPivot = hl.pivot.has(idx);

			let fill = colors.node;
			let border = colors.nodeBorder;
			let text = colors.ink;
			let lineWidth = 1.2;

			if (isPivot) {
				fill = colors.pivot;
				border = colors.pivot;
				text = '#FAF9F6';
				lineWidth = 2;
			} else if (isCurrent) {
				fill = colors.current;
				border = colors.current;
				text = '#FAF9F6';
				lineWidth = 2;
			} else if (isCompare) {
				border = colors.compare;
				lineWidth = 2;
			}

			drawBlock(containerX + PAD, blockY, values[idx], { fill, border, text, lineWidth });
		}

		// 折叠提示
		if (offset > 0) {
			const foldY = containerY + PAD;
			drawBlock(containerX + PAD, foldY, `+${offset}`, {
				fill: colors.hover,
				border: colors.nodeBorder,
				text: colors.ink3,
				lineWidth: 1,
				dashed: true
			});
		}

		// top / bottom 标签
		drawLabel('top', cx, containerY - 16, colors.current);
		drawLabel('bottom', cx, containerY + containerH + 16, colors.ink3);
	}

	function drawQueue(
		values: number[],
		hl: { current: Set<number>; compare: Set<number>; pivot: Set<number> }
	) {
		if (!ctx) return;
		const visible = values.slice(0, MAX_VISIBLE);
		const rest = values.length - visible.length;
		const step = GAP + BLOCK_W;
		const containerW = visible.length * step - GAP + PAD * 2;
		const containerH = BLOCK_H + PAD * 2;
		const cx = canvasWidth / 2;
		const cy = canvasHeight / 2;
		const containerX = Math.max(PAD + 30, cx - containerW / 2);
		const containerY = cy - containerH / 2;

		// front / rear 标签与箭头
		const labelY = containerY + containerH / 2;
		drawLabel('front', containerX - 46, labelY, colors.current, 'right');
		drawArrow(containerX - 40, labelY, containerX - 6, labelY, colors.current);
		drawLabel('rear', containerX + containerW + 46, labelY, colors.ink3, 'left');
		drawArrow(
			containerX + containerW + 6,
			labelY,
			containerX + containerW + 40,
			labelY,
			colors.ink3
		);

		// 容器外框
		ctx.strokeStyle = colors.nodeBorder;
		ctx.lineWidth = 1.4;
		ctx.beginPath();
		ctx.roundRect(containerX, containerY, containerW, containerH, 6);
		ctx.stroke();

		for (let j = 0; j < visible.length; j++) {
			const blockX = containerX + PAD + j * step;
			const idx = j;
			const isCurrent = hl.current.has(idx);
			const isCompare = hl.compare.has(idx);
			const isPivot = hl.pivot.has(idx);

			let fill = colors.node;
			let border = colors.nodeBorder;
			let text = colors.ink;
			let lineWidth = 1.2;

			if (isPivot) {
				fill = colors.pivot;
				border = colors.pivot;
				text = '#FAF9F6';
				lineWidth = 2;
			} else if (isCurrent) {
				fill = colors.current;
				border = colors.current;
				text = '#FAF9F6';
				lineWidth = 2;
			} else if (isCompare) {
				border = colors.compare;
				lineWidth = 2;
			}

			drawBlock(blockX, containerY + PAD, values[idx], { fill, border, text, lineWidth });
		}

		// 折叠提示
		if (rest > 0) {
			const foldX = containerX + PAD + visible.length * step - GAP;
			drawBlock(foldX, containerY + PAD, `+${rest}`, {
				fill: colors.hover,
				border: colors.nodeBorder,
				text: colors.ink3,
				lineWidth: 1,
				dashed: true
			});
		}
	}

	function resizeCanvas() {
		if (!browser || !canvasEl) return;
		const container = canvasEl.parentElement;
		if (!container) return;

		dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		canvasWidth = Math.max(300, rect.width - 24);
		canvasHeight = Math.max(200, rect.height - 24);

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
		unwatchTheme = watchThemeChange(() => {
			updateColorsFromCSS();
			draw();
		});
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('resize', resizeCanvas);
		unwatchTheme?.();
	});
</script>

<div class="stack-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.stack-canvas-wrap {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		display: block;
	}
</style>
