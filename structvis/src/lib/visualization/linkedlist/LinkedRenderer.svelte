<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar } from '../visualization-utils';
import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

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
	let dpr = $derived(host.dpr);
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	const NODE_W = 56;
	const NODE_H = 36;
	const ARROW_LEN = 44;
	const NULL_W = 28;
	const NULL_H = 16;

	let colors = $state({
		inkInverse: '#FAF9F6',
		node: '#FFFFFF',
		nodeBorder: '#D4D0C8',
		ink: '#1A1A1A',
		ink3: '#9A9A9A',
		current: '#D97706',
		compare: '#1B4965',
		pivot: '#9B2226',
		hover: '#F3F1EC',
		dashed: '#9A9A9A'
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
			hover: resolveCSSVar('--color-subtle'),
			dashed: resolveCSSVar('--color-ink-3')
		};
	}

	function getHighlights(step: AlgorithmStep): {
		current: Set<number>;
		compare: Set<number>;
		pivot: Set<number>;
		hasNewNode: boolean;
	} {
		const current = new Set(step.highlights.find((h) => h.type === 'current')?.indices ?? []);
		const compare = new Set(step.highlights.find((h) => h.type === 'compare')?.indices ?? []);
		const pivot = new Set(step.highlights.find((h) => h.type === 'pivot')?.indices ?? []);
		return { current, compare, pivot, hasNewNode: current.has(-1) || compare.has(-1) };
	}

	function drawNode(
		x: number,
		y: number,
		value: number | string,
		state: {
			fill: string;
			border: string;
			text: string;
			lineWidth: number;
			dashed?: boolean;
		}
	) {
		if (!ctx) return;
		const r = 6;
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.lineTo(x + NODE_W - r, y);
		ctx.quadraticCurveTo(x + NODE_W, y, x + NODE_W, y + r);
		ctx.lineTo(x + NODE_W, y + NODE_H - r);
		ctx.quadraticCurveTo(x + NODE_W, y + NODE_H, x + NODE_W - r, y + NODE_H);
		ctx.lineTo(x + r, y + NODE_H);
		ctx.quadraticCurveTo(x, y + NODE_H, x, y + NODE_H - r);
		ctx.lineTo(x, y + r);
		ctx.quadraticCurveTo(x, y, x + r, y);
		ctx.closePath();
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
		ctx.fillText(String(value), x + NODE_W / 2, y + NODE_H / 2 + 1);
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
		const cy = canvasHeight / 2;

		// 新节点（虚线框）出现在最前面
		const hasNewNode = hl.hasNewNode;
		const segW = NODE_W + ARROW_LEN;
		const totalW = (hasNewNode ? segW + 10 : 0) + values.length * segW + NULL_W + 20;
		const originX = Math.max(10, (canvasWidth - totalW) / 2);

		if (hasNewNode) {
			drawNode(originX, cy - NODE_H / 2, 's', {
				fill: colors.hover,
				border: colors.compare,
				text: colors.ink,
				lineWidth: 1.6,
				dashed: true
			});
			drawArrow(originX + NODE_W, cy, originX + NODE_W + ARROW_LEN, cy, colors.compare);
		}

		const startX = originX + (hasNewNode ? segW + 10 : 0);
		let x = startX;

		// 头指针标记
		ctx.fillStyle = colors.ink3;
		ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'bottom';
		ctx.fillText('head', x + NODE_W / 2, cy - NODE_H / 2 - 10);

		for (let i = 0; i < values.length; i++) {
			const isCurrent = hl.current.has(i);
			const isCompare = hl.compare.has(i);
			const isPivot = hl.pivot.has(i);

			let fill = colors.node;
			let border = colors.nodeBorder;
			let text = colors.ink;
			let lineWidth = 1.2;

			if (isPivot) {
				fill = colors.pivot;
				border = colors.pivot;
				text = 'colors.inkInverse';
				lineWidth = 2;
			} else if (isCurrent) {
				fill = colors.current;
				border = colors.current;
				text = 'colors.inkInverse';
				lineWidth = 2;
			} else if (isCompare) {
				border = colors.compare;
				lineWidth = 2;
			}

			drawNode(x, cy - NODE_H / 2, values[i], { fill, border, text, lineWidth });

			if (isCompare) {
				ctx.fillStyle = colors.compare;
				ctx.font = "600 9px 'JetBrains Mono', Consolas, monospace";
				ctx.textAlign = 'center';
				ctx.textBaseline = 'bottom';
				ctx.fillText(i === 0 ? 'pre / p' : 'p', x + NODE_W / 2, cy - NODE_H / 2 - 2);
			}

			x += NODE_W + ARROW_LEN;
		}

		// NULL 尾
		const nullX = x + 4;
		drawArrow(x - ARROW_LEN + 4, cy, nullX + 8, cy, colors.dashed);
		ctx.fillStyle = colors.hover;
		ctx.strokeStyle = colors.dashed;
		ctx.lineWidth = 1;
		ctx.setLineDash([3, 3]);
		ctx.beginPath();
		ctx.roundRect(nullX, cy - NULL_H / 2, NULL_W, NULL_H, 3);
		ctx.fill();
		ctx.stroke();
		ctx.setLineDash([]);
		ctx.fillStyle = colors.ink3;
		ctx.font = "600 10px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('NULL', nullX + NULL_W / 2, cy + 1);
	}

		$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});

	;

</script>

<!-- 画布生命周期（resize/ResizeObserver/主题监听）由 CanvasHost 统一管理 -->
<CanvasHost
	minW={420}
	minH={180}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>