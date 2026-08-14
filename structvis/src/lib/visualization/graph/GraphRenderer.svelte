<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type {
		AlgorithmStep,
		GraphData,
		GraphEdge,
		GraphEdgeState,
		GraphNode,
		GraphNodeState
	} from '$lib/engines/algorithm/types';
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

	/** 逻辑空间（环形布局的坐标空间） */
	const LOGICAL_W = 800;
	const LOGICAL_H = 520;

	const NODE_FONT = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
	const WEIGHT_FONT = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';
	const NOTE_FONT = '500 13px ui-monospace, SFMono-Regular, Menlo, monospace';

	let colors = $state({
		inkInverse: '#FAF9F6',
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
			inkInverse: resolveCSSVar('--color-ink-inverse'),
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

	// 环形布局只依赖节点 id 集合（与画布尺寸无关），按签名缓存避免每帧重算
	let layoutCache = new Map<string, Map<number, Pos>>();

	function layout(g: GraphData): Map<number, Pos> {
		const sig = g.nodes.map((n) => n.id).join(',');
		const cached = layoutCache.get(sig);
		if (cached) return cached;
		const n = g.nodes.length;
		const cx = LOGICAL_W / 2;
		const cy = LOGICAL_H / 2;
		const r = Math.min(LOGICAL_W, LOGICAL_H) * 0.38;
		const map = new Map<number, Pos>();
		g.nodes.forEach((node, i) => {
			const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(n, 1);
			map.set(node.id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
		});
		layoutCache.set(sig, map);
		return map;
	}

	function nodeFill(state: GraphNodeState): { fill: string; border: string; text: string } {
		switch (state) {
			case 'current':
				return { fill: colors.accent, border: colors.accent, text: colors.inkInverse };
			case 'visited':
				return { fill: colors.success, border: colors.success, text: colors.inkInverse };
			case 'done':
				return { fill: colors.successDeep, border: colors.successDeep, text: colors.inkInverse };
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

	function drawEdge(
		e: GraphEdge,
		a: Pos,
		b: Pos,
		state: GraphEdgeState,
		directed: boolean,
		fromState: GraphEdgeState,
		t: number
	) {
		const style = edgeStyle(state);
		const fromStyle = edgeStyle(fromState);
		ctx!.strokeStyle = lerpColorStr(fromStyle.color, style.color, t);
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

	function drawNode(
		n: GraphNode,
		pos: Pos,
		state: GraphNodeState,
		note: string | undefined,
		fromState: GraphNodeState,
		t: number
	) {
		const from = nodeFill(fromState);
		const to = nodeFill(state);
		const fill = lerpColorStr(from.fill, to.fill, t);
		const border = lerpColorStr(from.border, to.border, t);
		const text = lerpColorStr(from.text, to.text, t);
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

		const { fromIdx, toIdx, t } = stepProgress(playbackPos, steps.length);
		const easedT = easeOutCubic(t);
		const step = steps[toIdx];
		const fromStep = steps[fromIdx];
		const g = step.graph;
		if (!g || g.nodes.length === 0) return;
		const fromG = fromStep.graph;

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H);
		const ox = (canvasWidth - LOGICAL_W * scale) / 2;
		const oy = (canvasHeight - LOGICAL_H * scale) / 2;

		ctx.save();
		ctx.translate(ox, oy);
		ctx.scale(scale, scale);

		const positions = layout(g);

		// 1. 边（颜色从上一帧平滑过渡）
		g.edges.forEach((e, i) => {
			const a = positions.get(e.from);
			const b = positions.get(e.to);
			if (!a || !b) return;
			const state = g.edgeState?.[i] ?? 'normal';
			const fromState = (fromG?.edgeState?.[i] ?? 'normal') as GraphEdgeState;
			drawEdge(e, a, b, state, !!g.directed, fromState, easedT);
		});

		// 2. 节点（颜色从上一帧平滑过渡）
		for (const n of g.nodes) {
			const p = positions.get(n.id);
			if (!p) continue;
			const state = g.nodeState?.[n.id] ?? 'unvisited';
			const fromState = (fromG?.nodeState?.[n.id] ?? 'unvisited') as GraphNodeState;
			const note = g.nodeNote?.[n.id];
			drawNode(n, p, state, note, fromState, easedT);
		}

		ctx.restore();
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
	minW={680}
	minH={442}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
