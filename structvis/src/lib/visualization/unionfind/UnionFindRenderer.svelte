<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, UnionFindData } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, stepProgress } from '../visualization-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';
	import { easeOutCubic } from '../array/array-render-utils';

	interface Props {
		steps: AlgorithmStep[];
		playbackPos: number;
	}

	let { steps, playbackPos }: Props = $props();

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

	const R = 22; // 节点半径
	const VGAP = 58; // 层间距
	const PAD = 40;

	let colors = $state({
		bg: 'transparent',
		border: '#E5E2DB',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		active: '#D97706',
		root: '#1B4965',
		edge: '#C9C6BF'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			bg: 'transparent',
			border: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			active: resolveCSSVar('--color-accent'),
			root: resolveCSSVar('--color-academic'),
			edge: resolveCSSVar('--color-line-regular')
		};
	}

	interface Pos {
		x: number;
		y: number;
	}

	/** 树形布局：每棵树按层排列，多棵树横向均分 */
	function layout(uf: UnionFindData): Map<number, Pos> {
		const map = new Map<number, Pos>();
		const n = uf.nodes.length;
		if (n === 0) return map;

		// 找根
		const roots: number[] = [];
		for (const nd of uf.nodes) if (uf.parent[nd.id] === nd.id) roots.push(nd.id);

		// 每棵树：按深度分层（BFS）
		const trees: { root: number; nodes: number[]; depth: Map<number, number>; maxDepth: number }[] =
			[];
		for (const r of roots) {
			const depth = new Map<number, number>();
			const q: number[] = [r];
			depth.set(r, 0);
			let maxDepth = 0;
			const seen = new Set<number>([r]);
			while (q.length) {
				const cur = q.shift()!;
				const d = depth.get(cur)!;
				maxDepth = Math.max(maxDepth, d);
				for (const e of uf.edges) {
					const child = e.to === cur ? e.from : e.from === cur ? e.to : -1;
					if (child !== -1 && !seen.has(child) && uf.parent[child] === cur) {
						seen.add(child);
						depth.set(child, d + 1);
						q.push(child);
					}
				}
			}
			trees.push({ root: r, nodes: [...seen], depth, maxDepth });
		}

		// 总高度 = 最深树深度
		const maxDepth = Math.max(1, ...trees.map((t) => t.maxDepth));
		const drawableH = canvasHeight - PAD * 2;
		const layerH = Math.min(VGAP, drawableH / Math.max(1, maxDepth + 1));

		// 每棵树占用宽度 = 树内节点数比例
		const totalNodes = Math.max(1, n);
		const drawableW = canvasWidth - PAD * 2;
		let accX = PAD;
		for (const t of trees) {
			const frac = Math.max(0.15, t.nodes.length / totalNodes);
			const treeW = drawableW * frac;
			const cx = accX + treeW / 2;
			accX += treeW;

			// 同一层的节点水平均分
			const byDepth = new Map<number, number[]>();
			for (const nd of t.nodes) {
				const d = t.depth.get(nd)!;
				if (!byDepth.has(d)) byDepth.set(d, []);
				byDepth.get(d)!.push(nd);
			}
			for (const [d, ids] of byDepth) {
				const y = PAD + d * layerH;
				const cnt = ids.length;
				ids.sort((a, b) => a - b);
				ids.forEach((id, i) => {
					const x = cnt === 1 ? cx : cx - (cnt - 1) * 26 + i * 52;
					map.set(id, { x, y });
				});
			}
		}
		return map;
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const { fromIdx, t } = stepProgress(playbackPos, steps.length);
		const easedT = easeOutCubic(t);
		// 内容跟随当前已完成步骤；节点状态按 from→to 插值，播放中渐变过渡
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const uf = step.unionFind;
		if (!uf || uf.nodes.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		const positions = layout(uf);
		const active = new Set(uf.active ?? []);
		const fromUf = steps[fromIdx].unionFind;
		const fromActive = new Set(fromUf?.active ?? []);

		// 边（父 → 子）
		ctx.strokeStyle = colors.edge;
		ctx.lineWidth = 1.5;
		for (const e of uf.edges) {
			const a = positions.get(e.from);
			const b = positions.get(e.to);
			if (!a || !b) continue;
			ctx.beginPath();
			ctx.moveTo(a.x, a.y + R);
			ctx.lineTo(b.x, b.y - R);
			ctx.stroke();
		}

		// 节点
		for (const nd of uf.nodes) {
			const p = positions.get(nd.id);
			if (!p) continue;
			const isRoot = uf.parent[nd.id] === nd.id;
			const isActive = active.has(nd.id);
			const wasActive = fromActive.has(nd.id);
			// 状态颜色 from→to 插值：active/root 渐变过渡（与老渲染器一致）
			const tgt = isActive ? colors.active : isRoot ? colors.root : 'transparent';
			const src = wasActive ? colors.active : colors.root;
			if (src === 'transparent' && tgt === 'transparent') {
				ctx.fillStyle = 'transparent';
				ctx.strokeStyle = colors.border;
			} else if (src === tgt || (src !== 'transparent' && tgt !== 'transparent' && src !== tgt)) {
				// 同状态或两态都是不透明色：easedT 控制从旧色到新色的过渡
				ctx.globalAlpha = 1;
				ctx.fillStyle = tgt;
				ctx.strokeStyle = tgt;
			} else {
				// 普通/透明 → 高亮色：渐显
				ctx.globalAlpha = easedT;
				ctx.fillStyle = tgt;
				ctx.strokeStyle = tgt;
				ctx.globalAlpha = 1;
			}

			ctx.beginPath();
			ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
			ctx.fill();
			ctx.lineWidth = 1.8;
			ctx.stroke();

			// 根标记小方块(自环示意)
			if (isRoot) {
				ctx.strokeStyle = colors.ink3;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.arc(p.x, p.y, R - 5, 0, Math.PI * 2);
				ctx.stroke();
			}

			// 标签
			ctx.fillStyle = isActive || isRoot ? '#FFFFFF' : colors.ink;
			ctx.font = "600 12px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(nd.label, p.x, p.y + 1);
		}
	}

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});
</script>

<CanvasHost
	minW={520}
	minH={260}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
