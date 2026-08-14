<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, HuffmanData, HuffmanNode } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, lerpColorStr, stepProgress } from '../visualization-utils';
	import { easeOutCubic } from '../array/array-render-utils';
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
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	const LOGICAL_W = 1000;
	const LOGICAL_H = 540;
	const NODE_R = 24;
	const LEVEL_H = 74;
	const PAD_TOP = 70;
	const PAD_SIDE = 40;

	let colors = $state({
		inkInverse: '#FAF9F6',
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
			inkInverse: resolveCSSVar('--color-ink-inverse'),
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

	// 布局缓存：同一 step 坐标恒定，避免每帧重复递归布局
	const layoutCache = new Map<number, Map<number, Pos>>();

	function draw() {
		if (!ctx) return;
		const f = frame();
		const stepIdx = Math.floor(playbackPos);
		ctx.save();
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H, 1.35);
		ctx.scale(scale, scale);
		if (!f || f.nodes.length === 0) {
			ctx.restore();
			return;
		}

		// 布局缓存：同一 step 的森林结构与坐标恒定，避免每帧重复递归布局
		const layoutKey = stepIdx;
		let posFinal = layoutCache.get(layoutKey);
		if (!posFinal) {
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
			posFinal = new Map<number, Pos>();
			for (const [id, p] of positions) posFinal.set(id, { x: p.x, y: p.y + yOff });
			layoutCache.set(layoutKey, posFinal);
		}

		// 高亮集合每帧只算一次（from/to 两帧，供颜色插值）
		const { fromIdx, toIdx, t } = stepProgress(playbackPos, steps.length);
		const easedT = easeOutCubic(t);
		const hlAt = (idx: number) => {
			const s = steps[Math.min(idx, steps.length - 1)];
			return {
				sorted: new Set(s?.highlights.find((h) => h.type === 'sorted')?.indices ?? []),
				current: new Set(s?.highlights.find((h) => h.type === 'current')?.indices ?? []),
				compare: new Set(s?.highlights.find((h) => h.type === 'compare')?.indices ?? [])
			};
		};
		const from = hlAt(fromIdx);
		const to = hlAt(toIdx);

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

		// 2. 节点（颜色从上一帧平滑过渡）
		const stateAt = (
			sorted: Set<number>,
			current: Set<number>,
			compare: Set<number>,
			id: number
		): { fill: string; border: string; text: string; lw: number } => {
			if (current.has(id)) {
				return { fill: colors.current, border: colors.current, text: colors.inkInverse, lw: 2 };
			}
			if (sorted.has(id)) {
				return { fill: colors.sorted, border: colors.sorted, text: colors.inkInverse, lw: 2 };
			}
			if (compare.has(id)) {
				return { fill: colors.node, border: colors.compare, text: colors.ink, lw: 2 };
			}
			return { fill: colors.node, border: colors.border, text: colors.ink, lw: 1.2 };
		};

		for (const n of f.nodes) {
			const p = posFinal.get(n.id);
			if (!p) continue;
			const isLeaf = n.left === -1 && n.right === -1;
			const fromState = stateAt(from.sorted, from.current, from.compare, n.id);
			const toState = stateAt(to.sorted, to.current, to.compare, n.id);
			const fill = lerpColorStr(fromState.fill, toState.fill, easedT);
			const border = lerpColorStr(fromState.border, toState.border, easedT);
			const textColor = lerpColorStr(fromState.text, toState.text, easedT);
			const lw = toState.lw;

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

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});
</script>

<!-- 画布生命周期（resize/ResizeObserver/主题监听）由 CanvasHost 统一管理 -->
<CanvasHost
	minW={320}
	minH={220}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
