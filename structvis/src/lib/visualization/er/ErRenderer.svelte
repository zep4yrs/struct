<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, ErEdge, ErNode } from '$lib/engines/algorithm/types';
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
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	/** 引擎预设布局的逻辑空间 */
	const LOGICAL_W = 900;
	const LOGICAL_H = 420;

	const FONT = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
	const FIELD_FONT = '500 14px ui-monospace, SFMono-Regular, Menlo, monospace';
	const LABEL_FONT = '13px ui-monospace, SFMono-Regular, Menlo, monospace';

	/** 最小缩放：容器再小也不低于此值，超出部分靠画布区滚动 */

	let colors = $state({
		inkInverse: '#FAF9F6',
		surface: '#FFFFFF',
		border: '#D4D0C8',
		ink: '#1A1A1A',
		ink2: '#6B6B6B',
		ink3: '#9A9A9A',
		current: '#D97706',
		sorted: '#2D6A4F',
		pivot: '#B3392C',
		compare: '#1B4965'
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
			current: resolveCSSVar('--color-accent'),
			sorted: resolveCSSVar('--color-success'),
			pivot: resolveCSSVar('--color-danger'),
			compare: resolveCSSVar('--color-academic')
		};
	}

	function nodeSize(n: ErNode): { w: number; h: number } {
		const textW = ctx ? ctx.measureText(n.label).width : n.label.length * 15;
		switch (n.type) {
			case 'entity':
				return { w: Math.max(120, textW + 36), h: 44 };
			case 'attribute':
				return { w: Math.max(104, textW + 48), h: 48 };
			case 'relationship':
				return { w: Math.max(110, textW + 56), h: 44 };
			case 'relation':
				return { w: 220, h: 36 + 21 * (n.fields?.length ?? 0) };
			case 'fd':
				return { w: Math.max(130, textW + 28), h: 32 };
		}
	}

	function drawEdgeLabel(e: ErEdge, from: ErNode, to: ErNode) {
		if (!e.label) return;
		const t = e.labelEnd === 'from' ? 0.25 : e.labelEnd === 'to' ? 0.75 : 0.5;
		const x = from.x + (to.x - from.x) * t;
		const y = from.y + (to.y - from.y) * t;
		ctx!.font = LABEL_FONT;
		ctx!.fillStyle = colors.ink3;
		ctx!.textAlign = 'center';
		ctx!.textBaseline = 'middle';
		ctx!.fillText(e.label, x, y - 10);
	}

	function drawNode(n: ErNode, hl: 'current' | 'sorted' | 'pivot' | 'compare' | null) {
		const { w, h } = nodeSize(n);
		const x = n.x;
		const y = n.y;

		let fill = colors.surface;
		let border = colors.border;
		let text = colors.ink;
		if (hl === 'current' || hl === 'sorted' || hl === 'pivot') {
			fill = hl === 'current' ? colors.current : hl === 'sorted' ? colors.sorted : colors.pivot;
			border = fill;
			text = 'colors.inkInverse';
		} else if (hl === 'compare') {
			border = colors.compare;
		}

		ctx!.lineWidth = hl ? 2 : 1.2;

		if (n.type === 'entity') {
			ctx!.strokeStyle = border;
			ctx!.fillStyle = fill;
			ctx!.fillRect(x - w / 2, y - h / 2, w, h);
			ctx!.strokeRect(x - w / 2, y - h / 2, w, h);
		} else if (n.type === 'attribute') {
			ctx!.strokeStyle = border;
			ctx!.fillStyle = fill;
			ctx!.beginPath();
			ctx!.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
			ctx!.fill();
			ctx!.stroke();
		} else if (n.type === 'relationship') {
			ctx!.strokeStyle = border;
			ctx!.fillStyle = fill;
			ctx!.beginPath();
			ctx!.moveTo(x, y - h / 2);
			ctx!.lineTo(x + w / 2, y);
			ctx!.lineTo(x, y + h / 2);
			ctx!.lineTo(x - w / 2, y);
			ctx!.closePath();
			ctx!.fill();
			ctx!.stroke();
		} else if (n.type === 'fd') {
			ctx!.strokeStyle = border;
			ctx!.fillStyle = fill;
			ctx!.beginPath();
			ctx!.roundRect(x - w / 2, y - h / 2, w, h, 8);
			ctx!.fill();
			ctx!.stroke();
		} else {
			// relation：标题栏 + 字段列表
			const headerH = 30;
			const fieldH = 22;
			ctx!.strokeStyle = border;
			ctx!.fillStyle = fill;
			ctx!.fillRect(x - w / 2, y - h / 2, w, h);
			ctx!.strokeRect(x - w / 2, y - h / 2, w, h);
			ctx!.fillStyle = text;
			ctx!.font = FONT;
			ctx!.textAlign = 'center';
			ctx!.textBaseline = 'middle';
			ctx!.fillText(n.label, x, y - h / 2 + headerH / 2);
			if (n.fields) {
				ctx!.textAlign = 'left';
				ctx!.font = FIELD_FONT;
				for (let i = 0; i < n.fields.length; i++) {
					const fy = y - h / 2 + headerH + 4 + fieldH * (i + 0.5);
					ctx!.fillText(n.fields[i], x - w / 2 + 12, fy);
					if (i === 0) {
						// 主键属性下划线
						const tw = ctx!.measureText(n.fields[i]).width;
						ctx!.beginPath();
						ctx!.moveTo(x - w / 2 + 12, fy + 9);
						ctx!.lineTo(x - w / 2 + 12 + tw, fy + 9);
						ctx!.strokeStyle = text;
						ctx!.lineWidth = 1;
						ctx!.stroke();
					}
				}
			}
		}

		// 节点标签（实体/属性/联系/fd 的居中文字）
		if (n.type !== 'relation') {
			ctx!.fillStyle = text;
			ctx!.font = FONT;
			ctx!.textAlign = 'center';
			ctx!.textBaseline = 'middle';
			ctx!.fillText(n.label, x, y + 1);
		}
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];
		const er = step.er;
		if (!er) return;

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H);
		const ox = (canvasWidth - LOGICAL_W * scale) / 2;
		const oy = (canvasHeight - LOGICAL_H * scale) / 2;

		ctx.save();
		ctx.translate(ox, oy);
		ctx.scale(scale, scale);

		const byId = new Map(er.nodes.map((n, i) => [n.id, { node: n, idx: i }]));
		const hlByIdx: Record<number, string> = {};
		for (const h of step.highlights) {
			for (const idx of h.indices) hlByIdx[idx] = h.type;
		}

		// 1. 边
		for (const e of er.edges) {
			const a = byId.get(e.from);
			const b = byId.get(e.to);
			if (!a || !b) continue;
			ctx.strokeStyle = colors.border;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(a.node.x, a.node.y);
			ctx.lineTo(b.node.x, b.node.y);
			ctx.stroke();
			drawEdgeLabel(e, a.node, b.node);
		}

		// 2. 节点
		for (const { node, idx } of byId.values()) {
			const hl = hlByIdx[idx] as 'current' | 'sorted' | 'pivot' | 'compare' | undefined;
			drawNode(node, hl ?? null);
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
	minW={320}
	minH={220}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
