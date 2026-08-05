<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, BPlusNode } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, watchThemeChange } from '../visualization-utils';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

	let canvasEl: HTMLCanvasElement | undefined;
	let ctx: CanvasRenderingContext2D | null = null;
	let dpr = 1;
	let unwatchTheme: (() => void) | undefined;

	let canvasWidth = 600;
	let canvasHeight = 360;

	const LOGICAL_W = 900;
	const LOGICAL_H = 420;

	const FONT = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
	const KEY_W = 48;
	const NODE_H = 44;

	/** 最小缩放：容器再小也不低于此值，超出部分靠画布区滚动 */
	const MIN_SCALE = 0.85;

	let colors = $state({
		surface: '#FFFFFF',
		border: '#D4D0C8',
		ink: '#1A1A1A',
		ink3: '#9A9A9A',
		current: '#D97706',
		sorted: '#2D6A4F',
		pivot: '#B3392C',
		compare: '#1B4965'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			surface: resolveCSSVar('--color-surface'),
			border: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			sorted: resolveCSSVar('--color-success'),
			pivot: resolveCSSVar('--color-danger'),
			compare: resolveCSSVar('--color-academic')
		};
	}

	function nodeWidth(n: BPlusNode): number {
		return n.keys.length * KEY_W + 8;
	}

	function drawNode(n: BPlusNode, hl: 'current' | 'sorted' | 'pivot' | 'compare' | null) {
		const w = nodeWidth(n);
		const x = n.x;
		const y = n.y;

		let fill = colors.surface;
		let border = colors.border;
		let text = colors.ink;
		if (hl === 'current' || hl === 'sorted' || hl === 'pivot') {
			fill = hl === 'current' ? colors.current : hl === 'sorted' ? colors.sorted : colors.pivot;
			border = fill;
			text = '#FAF9F6';
		} else if (hl === 'compare') {
			border = colors.compare;
		}

		ctx!.lineWidth = hl ? 2 : 1.2;
		ctx!.strokeStyle = border;
		ctx!.fillStyle = fill;

		if (n.leaf) {
			ctx!.beginPath();
			ctx!.roundRect(x - w / 2, y - NODE_H / 2, w, NODE_H, 6);
			ctx!.fill();
			ctx!.stroke();
		} else {
			ctx!.fillRect(x - w / 2, y - NODE_H / 2, w, NODE_H);
			ctx!.strokeRect(x - w / 2, y - NODE_H / 2, w, NODE_H);
		}

		// 键值 + 分隔线
		ctx!.font = FONT;
		ctx!.textAlign = 'center';
		ctx!.textBaseline = 'middle';
		for (let i = 0; i < n.keys.length; i++) {
			const kx = x - w / 2 + 4 + KEY_W * (i + 0.5);
			ctx!.fillStyle = text;
			ctx!.fillText(String(n.keys[i]), kx, y + 1);
			if (i < n.keys.length - 1) {
				ctx!.strokeStyle = hl ? border : colors.border;
				ctx!.lineWidth = 1;
				ctx!.beginPath();
				ctx!.moveTo(x - w / 2 + 4 + KEY_W * (i + 1), y - NODE_H / 2 + 6);
				ctx!.lineTo(x - w / 2 + 4 + KEY_W * (i + 1), y + NODE_H / 2 - 6);
				ctx!.stroke();
			}
		}
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];
		const tree = step.btree;
		if (!tree) return;

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H);
		const ox = (canvasWidth - LOGICAL_W * scale) / 2;
		const oy = (canvasHeight - LOGICAL_H * scale) / 2;

		ctx.save();
		ctx.translate(ox, oy);
		ctx.scale(scale, scale);

		const byId = new Map(tree.nodes.map((n, i) => [n.id, { node: n, idx: i }]));
		const hlByIdx: Record<number, string> = {};
		for (const h of step.highlights) {
			for (const idx of h.indices) hlByIdx[idx] = h.type;
		}

		// 1. 父子边
		for (const e of tree.edges) {
			const a = byId.get(e.from);
			const b = byId.get(e.to);
			if (!a || !b) continue;
			ctx.strokeStyle = colors.border;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(a.node.x, a.node.y + NODE_H / 2);
			ctx.lineTo(b.node.x, b.node.y - NODE_H / 2);
			ctx.stroke();
		}

		// 2. 叶子链表箭头（按 x 排序的可见叶子）
		const leaves = tree.nodes.filter((n) => n.leaf).sort((a, b) => a.x - b.x);
		for (let i = 0; i < leaves.length - 1; i++) {
			const a = leaves[i];
			const b = leaves[i + 1];
			const x1 = a.x + nodeWidth(a) / 2 + 6;
			const x2 = b.x - nodeWidth(b) / 2 - 6;
			ctx.strokeStyle = colors.ink3;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			ctx.moveTo(x1, a.y);
			ctx.lineTo(x2, a.y);
			ctx.stroke();
			// 箭头
			ctx.beginPath();
			ctx.moveTo(x2 + 6, a.y);
			ctx.lineTo(x2, a.y - 4);
			ctx.lineTo(x2, a.y + 4);
			ctx.closePath();
			ctx.fillStyle = colors.ink3;
			ctx.fill();
		}

		// 3. 节点
		for (const { node, idx } of byId.values()) {
			const hl = hlByIdx[idx] as 'current' | 'sorted' | 'pivot' | 'compare' | undefined;
			drawNode(node, hl ?? null);
		}

		ctx.restore();
	}

	function resizeCanvas() {
		if (!browser || !canvasEl) return;
		const container = canvasEl.parentElement;
		if (!container) return;

		dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		canvasWidth = Math.max(Math.max(320, rect.width - 24), LOGICAL_W * MIN_SCALE);
		canvasHeight = Math.max(Math.max(240, rect.height - 24), LOGICAL_H * MIN_SCALE);

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

<div class="btree-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.btree-canvas-wrap {
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
