<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { browser } from '$app/environment';
	import type {
		AlgorithmStep,
		GraphData,
		GraphEdge,
		GraphEdgeState,
		GraphNode,
		GraphNodeState
	} from '$lib/engines/algorithm/types';
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

	/** 逻辑空间（环形布局的坐标空间） */
	const LOGICAL_W = 800;
	const LOGICAL_H = 520;
	const MIN_SCALE = 0.85;

	const NODE_FONT = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
	const WEIGHT_FONT = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
	const NOTE_FONT = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';

	let colors = $state({
		surface: '#FFFFFF',
		border: '#D4D0C8',
		ink: '#1A1A1A',
		ink2: '#6B6B6B',
		ink3: '#9A9A9A',
		accent: '#D97706',
		success: '#2D6A4F',
		successDeep: '#1F4D38',
		academic: '#1B4965'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			surface: resolveCSSVar('--color-surface'),
			border: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			accent: resolveCSSVar('--color-accent'),
			success: resolveCSSVar('--color-success'),
			successDeep: resolveCSSVar('--color-success-deep') || resolveCSSVar('--color-success'),
			academic: resolveCSSVar('--color-academic')
		};
	}

	interface Pos {
		x: number;
		y: number;
	}

	function layout(g: GraphData): Map<number, Pos> {
		const n = g.nodes.length;
		const cx = LOGICAL_W / 2;
		const cy = LOGICAL_H / 2;
		const r = Math.min(LOGICAL_W, LOGICAL_H) * 0.38;
		const map = new Map<number, Pos>();
		g.nodes.forEach((node, i) => {
			const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
			map.set(node.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
		});
		return map;
	}

	function nodeFill(state: GraphNodeState): { fill: string; border: string; text: string } {
		switch (state) {
			case 'current':
				return { fill: colors.accent, border: colors.accent, text: '#FAF9F6' };
			case 'visited':
				return { fill: colors.success, border: colors.success, text: '#FAF9F6' };
			case 'done':
				return { fill: colors.successDeep, border: colors.successDeep, text: '#FAF9F6' };
			case 'frontier':
				return { fill: colors.surface, border: colors.academic, text: colors.ink };
			default:
				return { fill: colors.surface, border: colors.border, text: colors.ink };
		}
	}

	function edgeStyle(state: GraphEdgeState): { color: string; width: number; dash: number[] } {
		switch (state) {
			case 'current':
				return { color: colors.accent, width: 3.5, dash: [] };
			case 'selected':
				return { color: colors.success, width: 3, dash: [] };
			case 'candidate':
				return { color: colors.academic, width: 2.5, dash: [7, 5] };
			case 'tried':
				return { color: colors.ink3, width: 1.5, dash: [] };
			default:
				return { color: colors.border, width: 1.5, dash: [] };
		}
	}

	function drawEdge(e: GraphEdge, a: Pos, b: Pos, state: GraphEdgeState, directed: boolean) {
		const style = edgeStyle(state);
		ctx!.strokeStyle = style.color;
		ctx!.lineWidth = style.width;
		ctx!.setLineDash(style.dash);
		ctx!.beginPath();
		ctx!.moveTo(a.x, a.y);
		ctx!.lineTo(b.x, b.y);
		ctx!.stroke();
		ctx!.setLineDash([]);

		if (directed) {
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const len = Math.hypot(dx, dy) || 1;
			const ux = dx / len;
			const uy = dy / len;
			const tip = { x: b.x - 16 * ux, y: b.y - 16 * uy };
			ctx!.fillStyle = style.color;
			ctx!.beginPath();
			ctx!.moveTo(tip.x + 11 * ux - 6 * uy, tip.y + 11 * uy + 6 * ux);
			ctx!.lineTo(tip.x, tip.y);
			ctx!.lineTo(tip.x + 11 * ux + 6 * uy, tip.y + 11 * uy - 6 * ux);
			ctx!.closePath();
			ctx!.fill();
		}

		if (e.weight !== undefined || e.label) {
			const mx = (a.x + b.x) / 2;
			const my = (a.y + b.y) / 2;
			ctx!.font = WEIGHT_FONT;
			ctx!.fillStyle = colors.ink2;
			ctx!.textAlign = 'center';
			ctx!.textBaseline = 'middle';
			ctx!.fillText(e.label ?? String(e.weight), mx, my - 8);
		}
	}

	function drawNode(n: GraphNode, pos: Pos, state: GraphNodeState, note?: string) {
		const { fill, border, text } = nodeFill(state);
		const R = 26;
		ctx!.fillStyle = fill;
		ctx!.strokeStyle = border;
		ctx!.lineWidth = state === 'frontier' || state === 'current' ? 2.5 : 1.5;
		ctx!.beginPath();
		ctx!.arc(pos.x, pos.y, R, 0, Math.PI * 2);
		ctx!.fill();
		ctx!.stroke();
		ctx!.fillStyle = text;
		ctx!.font = NODE_FONT;
		ctx!.textAlign = 'center';
		ctx!.textBaseline = 'middle';
		ctx!.fillText(n.label, pos.x, pos.y + 1);
		if (note !== undefined) {
			ctx!.fillStyle = colors.ink2;
			ctx!.font = NOTE_FONT;
			ctx!.fillText(note, pos.x, pos.y + R + 16);
		}
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];
		const g = step.graph;
		if (!g || g.nodes.length === 0) return;

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H);
		const ox = (canvasWidth - LOGICAL_W * scale) / 2;
		const oy = (canvasHeight - LOGICAL_H * scale) / 2;

		ctx.save();
		ctx.translate(ox, oy);
		ctx.scale(scale, scale);

		const positions = layout(g);

		// 1. 边
		g.edges.forEach((e, i) => {
			const a = positions.get(e.from);
			const b = positions.get(e.to);
			if (!a || !b) return;
			const state = g.edgeState?.[i] ?? 'normal';
			drawEdge(e, a, b, state, !!g.directed);
		});

		// 2. 节点
		for (const n of g.nodes) {
			const p = positions.get(n.id);
			if (!p) continue;
			const state = g.nodeState?.[n.id] ?? 'unvisited';
			const note = g.nodeNote?.[n.id];
			drawNode(n, p, state, note);
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

<div class="graph-canvas-wrap">
	<canvas bind:this={canvasEl}></canvas>
</div>

<style>
	.graph-canvas-wrap {
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
