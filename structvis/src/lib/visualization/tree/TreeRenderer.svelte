<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
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

	const NODE_RADIUS = 22;
	const PADDING_TOP = 40;
	const PADDING_BOTTOM = 20;

	interface TreeNode {
		idx: number;
		value: number;
		depth: number;
		x: number;
		y: number;
		left: number;
		right: number;
	}

	let colors = $state({
		node: '#FFFFFF',
		nodeBorder: '#D4D0C8',
		edge: '#D4D0C8',
		ink: '#1A1A1A',
		ink3: '#9A9A9A',
		current: '#D97706',
		sorted: '#2D6A4F',
		compare: '#1B4965',
		bg: 'transparent'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			node: resolveCSSVar('--color-surface'),
			nodeBorder: resolveCSSVar('--color-line-regular'),
			edge: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			sorted: resolveCSSVar('--color-success'),
			compare: resolveCSSVar('--color-academic'),
			bg: 'transparent'
		};
	}

	/** 从层序数组重建树节点列表（含布局坐标） */
	function buildTree(levelOrder: number[]): TreeNode[] {
		const nodes: TreeNode[] = [];

		for (let i = 0; i < levelOrder.length; i++) {
			if (levelOrder[i] === -1) continue;
			const l = 2 * i + 1;
			const r = 2 * i + 2;
			nodes.push({
				idx: i,
				value: levelOrder[i],
				depth: 0,
				x: 0,
				y: 0,
				left: l < levelOrder.length && levelOrder[l] !== -1 ? l : -1,
				right: r < levelOrder.length && levelOrder[r] !== -1 ? r : -1
			});
		}

		// 计算深度
		for (const n of nodes) {
			n.depth = Math.floor(Math.log2(n.idx + 1));
		}
		const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);

		// 布局：x 按中序位置线性分布，y 按深度分层
		const midOrder: number[] = [];
		const traverse = (idx: number) => {
			if (idx < 0 || idx >= levelOrder.length || levelOrder[idx] === -1) return;
			const l = 2 * idx + 1;
			const r = 2 * idx + 2;
			traverse(l);
			midOrder.push(idx);
			traverse(r);
		};
		traverse(0);

		const levelH =
			(canvasHeight - PADDING_TOP - PADDING_BOTTOM - NODE_RADIUS * 2) / Math.max(1, maxDepth);
		const posInMid: Record<number, number> = {};
		midOrder.forEach((idx, k) => (posInMid[idx] = k));

		for (const n of nodes) {
			const mid = posInMid[n.idx] ?? 0;
			n.x = ((mid + 1) * canvasWidth) / (midOrder.length + 1);
			n.y = PADDING_TOP + n.depth * levelH + 4;
		}

		return nodes;
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const stepIdx = Math.floor(pos);
		const step = steps[stepIdx];

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const nodes = buildTree(step.data);
		if (nodes.length === 0) return;

		const byIdx: Record<number, TreeNode> = {};
		for (const n of nodes) byIdx[n.idx] = n;
		const sortedSet = new Set(step.highlights.find((h) => h.type === 'sorted')?.indices ?? []);
		const currentSet = new Set(step.highlights.find((h) => h.type === 'current')?.indices ?? []);
		const compareSet = new Set(step.highlights.find((h) => h.type === 'compare')?.indices ?? []);

		// 1. 边
		ctx.strokeStyle = colors.edge;
		ctx.lineWidth = 1;
		for (const n of nodes) {
			for (const c of [n.left, n.right]) {
				const child = byIdx[c];
				if (!child) continue;
				ctx.beginPath();
				ctx.moveTo(n.x, n.y + NODE_RADIUS);
				ctx.lineTo(child.x, child.y - NODE_RADIUS);
				ctx.stroke();
			}
		}

		// 2. 节点
		for (const n of nodes) {
			let fill = colors.node;
			let border = colors.nodeBorder;
			let textColor = colors.ink;

			if (currentSet.has(n.idx)) {
				fill = colors.current;
				border = colors.current;
				textColor = '#FAF9F6';
			} else if (sortedSet.has(n.idx)) {
				fill = colors.sorted;
				border = colors.sorted;
				textColor = '#FAF9F6';
			} else if (compareSet.has(n.idx)) {
				fill = colors.node;
				border = colors.compare;
			}

			ctx.beginPath();
			ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.strokeStyle = border;
			ctx.lineWidth = currentSet.has(n.idx) || sortedSet.has(n.idx) ? 2 : 1.2;
			ctx.stroke();

			ctx.fillStyle = textColor;
			ctx.font = '600 13px var(--font-mono)';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(String(n.value), n.x, n.y + 1);
		}
	}

	function resizeCanvas() {
		if (!browser || !canvasEl) return;
		const container = canvasEl.parentElement;
		if (!container) return;

		dpr = window.devicePixelRatio || 1;
		const rect = container.getBoundingClientRect();
		canvasWidth = Math.max(320, rect.width - 24);
		canvasHeight = Math.max(240, rect.height - 24);

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

<div class="tree-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.tree-canvas-wrap {
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
