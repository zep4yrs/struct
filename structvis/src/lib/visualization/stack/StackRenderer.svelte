<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, lerpColorStr, stepProgress } from '../visualization-utils';
	import { easeOutCubic } from '../array/array-render-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
		mode: 'stack' | 'queue';
	}

	let { steps, playbackPos, mode }: Props = $props();

	// 画布与尺寸由 CanvasHost 统一管理（resize/ResizeObserver/主题监听）；
	// CanvasHost 通过 onDraw 回调注入最新状态（$state 响应式）
	let host: CanvasHostState = $state({
		canvasEl: undefined,
		ctx: null,
		dpr: 1,
		width: 600,
		height: 280
	});
	let ctx = $derived(host.ctx);
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	const BLOCK_W = 84;
	const BLOCK_H = 36;
	const GAP = 6;
	const PAD = 16;
	const MAX_VISIBLE = 6;

	let colors = $state({
		inkInverse: '#FAF9F6',
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
			inkInverse: resolveCSSVar('--color-ink-inverse'),
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
		state: { fill: string; border: string; text: string; lineWidth: number; dashed?: boolean },
		alpha = 1
	) {
		if (!ctx) return;
		if (alpha <= 0.01) return;
		const r = 6;
		ctx.globalAlpha = alpha;
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
		ctx.font = "600 14px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(String(value), x + BLOCK_W / 2, y + BLOCK_H / 2 + 1);
		ctx.globalAlpha = 1;
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
		ctx.font = "600 11px 'JetBrains Mono', Consolas, monospace";
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

		const { fromIdx, toIdx, t } = stepProgress(playbackPos, steps.length);
		const fromStep = steps[fromIdx];
		const toStep = steps[toIdx];
		const easedT = easeOutCubic(t);

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// 目标态布局 + 上一帧/当前帧高亮（颜色平滑过渡）
		const values = toStep.data;
		const hlFrom = getHighlights(fromStep);
		const hlTo = getHighlights(toStep);

		if (mode === 'stack') {
			drawStack(values, hlFrom, hlTo, fromStep.data, easedT);
		} else {
			drawQueue(values, hlFrom, hlTo, fromStep.data, easedT);
		}
	}

	/** 某元素的高亮状态 → 颜色（供插值） */
	function getBlockState(
		idx: number,
		hl: { current: Set<number>; compare: Set<number>; pivot: Set<number> }
	): { fill: string; border: string; text: string; lineWidth: number } {
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
			text = colors.inkInverse;
			lineWidth = 2;
		} else if (isCurrent) {
			fill = colors.current;
			border = colors.current;
			text = colors.inkInverse;
			lineWidth = 2;
		} else if (isCompare) {
			border = colors.compare;
			lineWidth = 2;
		}

		return { fill, border, text, lineWidth };
	}

	function drawStack(
		values: number[],
		hlFrom: { current: Set<number>; compare: Set<number>; pivot: Set<number> },
		hlTo: { current: Set<number>; compare: Set<number>; pivot: Set<number> },
		fromValues: number[],
		t: number
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

		// 消失中的元素（出栈/出队：顶部元素滑出淡出）
		const delCount = fromValues.length - values.length;
		if (delCount > 0) {
			for (let d = 0; d < Math.min(delCount, MAX_VISIBLE); d++) {
				const idx = values.length + d;
				// 用 from 布局计算位置（容器高度按 from 的长度）
				const fromVisible = fromValues.slice(-MAX_VISIBLE);
				const fromOffset = fromValues.length - fromVisible.length;
				const fromContainerH = fromVisible.length * step - GAP + PAD * 2;
				const fromY = cy - fromContainerH / 2;
				const dj = fromOffset + d - offset;
				const fromBlockY = fromY + fromContainerH - PAD - (dj + 1) * BLOCK_H - dj * GAP;
				const fromState = getBlockState(idx, hlFrom);
				// 向下滑出 + 淡出
				const alpha = 1 - t;
				drawBlock(containerX + PAD, fromBlockY + step * t, fromValues[idx], fromState, alpha);
			}
		}

		// 元素块（自底向上，栈底在下）
		for (let j = 0; j < visible.length; j++) {
			const blockY = containerY + containerH - PAD - (j + 1) * BLOCK_H - j * GAP;
			const idx = offset + j;
			const fromState = getBlockState(idx, hlFrom);
			const toState = getBlockState(idx, hlTo);
			// 新增元素（刚入栈）：从上方滑入 + 淡入
			const isNew = idx >= fromValues.length;
			const yOffset = isNew ? (1 - t) * step : 0;
			const alpha = isNew ? t : 1;

			drawBlock(
				containerX + PAD,
				blockY + yOffset,
				values[idx],
				{
					fill: lerpColorStr(fromState.fill, toState.fill, t),
					border: lerpColorStr(fromState.border, toState.border, t),
					text: lerpColorStr(fromState.text, toState.text, t),
					lineWidth: toState.lineWidth
				},
				alpha
			);
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
		hlFrom: { current: Set<number>; compare: Set<number>; pivot: Set<number> },
		hlTo: { current: Set<number>; compare: Set<number>; pivot: Set<number> },
		fromValues: number[],
		t: number
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

		// 消失中的元素（出队：队首元素向左滑出淡出）
		const delCount = fromValues.length - values.length;
		if (delCount > 0) {
			for (let d = 0; d < Math.min(delCount, MAX_VISIBLE); d++) {
				const idx = d;
				const fromState = getBlockState(idx, hlFrom);
				const alpha = 1 - t;
				drawBlock(containerX + PAD - step * t, containerY + PAD, fromValues[idx], fromState, alpha);
			}
		}

		for (let j = 0; j < visible.length; j++) {
			const blockX = containerX + PAD + j * step;
			const idx = j;
			const fromState = getBlockState(idx, hlFrom);
			const toState = getBlockState(idx, hlTo);
			// 新入队元素（队尾）：从右侧滑入 + 淡入
			const isNew = idx >= fromValues.length;
			const xOffset = isNew ? (1 - t) * step : 0;
			const alpha = isNew ? t : 1;

			drawBlock(
				blockX + xOffset,
				containerY + PAD,
				values[idx],
				{
					fill: lerpColorStr(fromState.fill, toState.fill, t),
					border: lerpColorStr(fromState.border, toState.border, t),
					text: lerpColorStr(fromState.text, toState.text, t),
					lineWidth: toState.lineWidth
				},
				alpha
			);
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

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		void mode; // mode 变化（stack/queue 切换）也应触发重绘
		tick().then(() => draw());
	});
</script>

<!-- 画布生命周期（resize/ResizeObserver/主题监听）由 CanvasHost 统一管理 -->
<CanvasHost
	minW={420}
	minH={240}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
