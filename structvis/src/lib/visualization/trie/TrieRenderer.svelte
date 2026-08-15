<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';
	import { resolveCSSVar } from '../visualization-utils';

	/**
	 * Trie 字典树渲染器 — 字符节点树形布局
	 * step.trie: { nodes, root, active?, wordPath? }
	 * 节点画圆 + 字符；isWord 节点双圈；active 高亮当前路径；wordPath 标记完整单词。
	 */

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

	const PAD = 36;
	const R = 16; // 节点半径

	let colors = $state({
		ink: '#1a1a1a',
		ink2: '#5a5a5a',
		ink3: '#9a9a9a',
		accent: '#d97706',
		success: '#2d6a4f',
		line: '#e5e2db',
		nodeBg: '#f3f1ec',
		nodeBorder: '#d4d0c8',
		wordBg: 'rgba(45, 106, 79, 0.14)'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			accent: resolveCSSVar('--color-accent'),
			success: resolveCSSVar('--color-success'),
			line: resolveCSSVar('--color-line-hair'),
			nodeBg: resolveCSSVar('--color-subtle'),
			nodeBorder: resolveCSSVar('--color-line-regular'),
			wordBg: 'rgba(45, 106, 79, 0.14)'
		};
	}

	interface LayoutNode {
		id: number;
		x: number;
		y: number;
		subWidth: number;
	}

	/** 树形布局：孩子均分父节点的水平空间 */
	function getLayout(trie: NonNullable<AlgorithmStep['trie']>): Map<number, LayoutNode> {
		const map = new Map<number, LayoutNode>();
		const { nodes, root } = trie;

		function measure(id: number): number {
			const n = nodes[id];
			if (!n) return 1;
			const w = n.children.reduce((a, c) => a + measure(c), 0);
			map.set(id, { id, x: 0, y: 0, subWidth: Math.max(w, 1) });
			return Math.max(w, 1);
		}
		measure(root);

		// 分配坐标
		const depthOf = new Map<number, number>();
		function assign(id: number, depth: number, left: number, right: number) {
			const l = map.get(id);
			if (!l) return;
			depthOf.set(id, depth);
			l.y = PAD + depth * (R * 2 + 22);
			const children = nodes[id].children;
			if (children.length === 0) {
				l.x = (left + right) / 2;
				return;
			}
			// 孩子水平均分
			const totalSub = children.reduce((a, c) => a + (map.get(c)?.subWidth ?? 1), 0);
			let cur = left;
			for (const c of children) {
				const cw = (map.get(c)?.subWidth ?? 1) / totalSub;
				const cl = cur;
				const cr = cur + cw * (right - left);
				assign(c, depth + 1, cl, cr);
				cur = cr;
			}
			l.x = (left + right) / 2;
		}
		assign(root, 0, PAD, canvasWidth - PAD);
		return map;
	}

	function draw() {
		if (!ctx || steps.length === 0) return;
		const pos = Math.max(0, Math.min(steps.length - 1 + 0.999, playbackPos));
		const step = steps[Math.floor(pos)];
		const trie = step.trie;
		if (!trie || trie.nodes.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		const layout = getLayout(trie);
		const active = new Set(trie.active ?? []);
		const wordPath = new Set(trie.wordPath ?? []);

		// 连线
		for (const n of trie.nodes) {
			const l = layout.get(n.id);
			if (!l) continue;
			for (const c of n.children) {
				const cl = layout.get(c);
				if (!cl) continue;
				ctx.strokeStyle = wordPath.has(c) ? colors.accent : colors.line;
				ctx.lineWidth = wordPath.has(c) ? 2 : 1.2;
				ctx.beginPath();
				ctx.moveTo(l.x, l.y + R);
				ctx.lineTo(cl.x, cl.y - R);
				ctx.stroke();
			}
		}

		// 节点
		for (const n of trie.nodes) {
			const l = layout.get(n.id);
			if (!l) continue;
			const isActive = active.has(n.id);
			const onWord = wordPath.has(n.id);

			ctx.fillStyle = onWord ? colors.wordBg : colors.nodeBg;
			ctx.strokeStyle = isActive ? colors.accent : colors.nodeBorder;
			ctx.lineWidth = isActive ? 2.5 : 1.2;
			ctx.beginPath();
			ctx.arc(l.x, l.y, R, 0, Math.PI * 2);
			ctx.fill();
			ctx.stroke();
			// 单词结束：双圈
			if (n.isWord) {
				ctx.beginPath();
				ctx.arc(l.x, l.y, R - 4, 0, Math.PI * 2);
				ctx.strokeStyle = colors.success;
				ctx.lineWidth = 1.2;
				ctx.stroke();
			}
			// 字符
			ctx.fillStyle = isActive ? colors.accent : colors.ink;
			ctx.font = "600 13px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(n.char, l.x, l.y + 0.5);
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
	minW={360}
	minH={240}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
