<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, HuffmanData, HuffmanNode } from '$lib/engines/algorithm/types';
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

	let canvasWidth = 640;
	let canvasHeight = 400;

	const LOGICAL_W = 1000;
	const LOGICAL_H = 540;
	const MIN_SCALE = 0.8;
	const NODE_R = 24;
	const LEVEL_H = 74;
	const PAD_TOP = 70;
	const PAD_SIDE = 40;

	let colors = $state({
		node: '#FFFFFF',
		border: '#D4D0C8',
		edge: '#D4D0C8',
		ink: '#1A1A1A',
		ink2: '#6B6B6B',
		ink3: '#9A9A9A',
		current: '#D97706',
		sorted: '#2D6A4F',
		compare: '#1B4965'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			node: resolveCSSVar('--color-surface'),
			border: resolveCSSVar('--color-line-regular'),
			edge: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			sorted: resolveCSSVar('--color-success'),
			compare: resolveCSSVar('--color-academic')
		};
	}

	function frame(): HuffmanData | undefined {
		const step = steps[Math.min(Math.floor(playbackPos), steps.length - 1)];
		return step?.huffman;
	}

	interface Pos {
		x: number;
		y: number;
	}

	function leafCount(nodes: HuffmanNode[], id: number): number {
		const n = nodes[id];
		if (!n) return 0;
		if (n.left === -1 && n.right === -1) return 1;
		return leafCount(nodes, n.left) + leafCount(nodes, n.right);
	}

	function placeTree(nodes: HuffmanNode[], rootId: number, topY: number): Map<number, Pos> {
		const pos = new Map<number, Pos>();
		const place = (id: number, xLeft: number, depth: number): number => {
			const n = nodes[id];
			if (!n) return 0;
			if (n.left === -1 && n.right === -1) {
				pos.set(id, { x: xLeft + 0.5, y: topY + depth * LEVEL_H });
				return 1;
			}
			const wL = place(n.left, xLeft, depth + 1);
			const wR = place(n.right, xLeft + wL, depth + 1);
			pos.set(id, { x: xLeft + wL, y: topY + depth * LEVEL_H });
			return wL + wR;
		};
		place(rootId, 0, 0);
		return pos;
	}

	function draw() {
		if (!ctx) return;
		const f = frame();
		ctx.save();
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H, 1.35);
		ctx.scale(scale, scale);
		if (!f || f.nodes.length === 0) {
			ctx.restore();
			return;
		}

		// 每棵树布局 + 总叶子数分配水平空间
		const trees = f.roots
			.map((r) => ({ root: r, width: leafCount(f.nodes, r) }))
			.filter((t) => t.width > 0);
		const totalUnits = trees.reduce((a, t) => a + t.width, 0);
		const gap = Math.max(
			16,
			(LOGICAL_W - PAD_SIDE * 2 - totalUnits * 26) / Math.max(1, trees.length + 1)
		);
		const unit = (LOGICAL_W - PAD_SIDE * 2 - gap * (trees.length + 1)) / Math.max(1, totalUnits);

		let xCursor = PAD_SIDE + gap;
		const positions = new Map<number, Pos>();
		let maxDepth = 0;
		for (const t of trees) {
			const pos = placeTree(f.nodes, t.root, PAD_TOP);
			for (const [id, p] of pos) positions.set(id, { x: xCursor + p.x * unit, y: p.y });
			xCursor += t.width * unit + gap;
			const d = depthOf(f.nodes, t.root);
			if (d > maxDepth) maxDepth = d;
		}

		// 垂直居中
		const totalH = PAD_TOP + maxDepth * LEVEL_H;
		const yOff = (LOGICAL_H - totalH) / 2;
		const posFinal = new Map<number, Pos>();
		for (const [id, p] of positions) posFinal.set(id, { x: p.x, y: p.y + yOff });

		const sortedSet = new Set(stepHighlights().sorted);
		const currentSet = new Set(stepHighlights().current);
		const compareSet = new Set(stepHighlights().compare);

		const nodeById = new Map<number, HuffmanNode>();
		for (const n of f.nodes) nodeById.set(n.id, n);

		// 1. 边（先画，避免压住节点文字）
		ctx.strokeStyle = colors.edge;
		ctx.lineWidth = 1;
		for (const n of f.nodes) {
			const p = posFinal.get(n.id);
			if (!p) continue;
			for (const c of [n.left, n.right]) {
				if (c === -1) continue;
				const cp = posFinal.get(c);
				if (!cp) continue;
				ctx.beginPath();
				ctx.moveTo(p.x, p.y + NODE_R);
				ctx.lineTo(cp.x, cp.y - NODE_R);
				ctx.stroke();
			}
		}

		// 2. 节点
		for (const n of f.nodes) {
			const p = posFinal.get(n.id);
			if (!p) continue;
			const isLeaf = n.left === -1 && n.right === -1;
			let fill = colors.node;
			let border = colors.border;
			let textColor = colors.ink;
			let lw = 1.2;

			if (currentSet.has(n.id)) {
				fill = colors.current;
				border = colors.current;
				textColor = '#FAF9F6';
				lw = 2;
			} else if (sortedSet.has(n.id)) {
				fill = colors.sorted;
				border = colors.sorted;
				textColor = '#FAF9F6';
				lw = 2;
			} else if (compareSet.has(n.id)) {
				border = colors.compare;
				lw = 2;
			}

			ctx.beginPath();
			ctx.arc(p.x, p.y, NODE_R, 0, Math.PI * 2);
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.strokeStyle = border;
			ctx.lineWidth = lw;
			ctx.stroke();

			ctx.fillStyle = textColor;
			ctx.font = isLeaf
				? '600 15px ui-monospace, SFMono-Regular, Menlo, monospace'
				: '600 13px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(n.value), p.x, p.y + 1);
		}

		// 3. 完成徽标
		const cur = steps[Math.min(Math.floor(playbackPos), steps.length - 1)];
		if (cur?.type === 'complete' && f.wpl > 0) {
			ctx.font = '600 18px ui-monospace, SFMono-Regular, Menlo, monospace';
			ctx.fillStyle = colors.sorted;
			ctx.textAlign = 'left';
			ctx.fillText(`WPL = ${f.wpl}（最小带权路径长度）`, PAD_SIDE, LOGICAL_H - 24);
		}

		ctx.restore();
	}

	function stepHighlights(): { sorted: number[]; current: number[]; compare: number[] } {
		const step = steps[Math.min(Math.floor(playbackPos), steps.length - 1)];
		return {
			sorted: step?.highlights.find((h) => h.type === 'sorted')?.indices ?? [],
			current: step?.highlights.find((h) => h.type === 'current')?.indices ?? [],
			compare: step?.highlights.find((h) => h.type === 'compare')?.indices ?? []
		};
	}

	function depthOf(nodes: HuffmanNode[], rootId: number): number {
		let max = 0;
		const walk = (id: number, d: number) => {
			const n = nodes[id];
			if (!n) return;
			if (d > max) max = d;
			if (n.left !== -1) walk(n.left, d + 1);
			if (n.right !== -1) walk(n.right, d + 1);
		};
		walk(rootId, 0);
		return max;
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

<div class="huffman-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.huffman-canvas-wrap {
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
