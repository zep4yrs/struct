<script lang="ts">
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar } from '../visualization-utils';
	import CanvasHost, { type CanvasHostState } from '../CanvasHost.svelte';

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
	let W = $derived(host.width);
	let H = $derived(host.height);

	let colors = $state({
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		line: '#E5E2DB',
		accent: '#D97706',
		academic: '#1B4965',
		success: '#2D6A4F',
		surface: '#FFFFFF',
		subtle: '#F3F1EC'
	});

	function updateColors() {
		if (!browser) return;
		colors = {
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			line: resolveCSSVar('--color-line-regular'),
			accent: resolveCSSVar('--color-accent'),
			academic: resolveCSSVar('--color-academic'),
			success: resolveCSSVar('--color-success'),
			surface: resolveCSSVar('--color-surface'),
			subtle: resolveCSSVar('--color-subtle')
		};
	}

	function draw() {
		if (!ctx || steps.length === 0) return;
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const d = step.indexQuery;
		if (!d) return;
		ctx.clearRect(0, 0, W, H);

		// 坐标换算：树逻辑宽 720 → 画布自适应
		const sx = W / 760;
		const px = (x: number) => x * sx + 8;
		const NW = 150 * sx;
		const NH = 34;
		const active = new Set(d.activeNodes ?? []);
		const isActive = (id: string) => active.has(id);

		// 树边（定位路径高亮）
		const pathSet = new Set((d.pathEdges ?? []).map((e) => e.from + '>' + e.to));
		ctx.lineWidth = 2;
		for (const e of d.edges) {
			const a = d.nodes.find((n) => n.id === e.from);
			const b = d.nodes.find((n) => n.id === e.to);
			if (!a || !b) continue;
			const hot = pathSet.has(e.from + '>' + e.to);
			ctx.strokeStyle = hot ? colors.accent : colors.line;
			ctx.beginPath();
			ctx.moveTo(px(a.x) + NW / 2, a.y + NH);
			ctx.lineTo(px(b.x) + NW / 2, b.y);
			ctx.stroke();
		}

		// 节点
		for (const n of d.nodes) {
			const hot = isActive(n.id);
			ctx.fillStyle = hot ? colors.accent : n.kind === 'root' ? colors.subtle : colors.surface;
			ctx.strokeStyle = hot ? colors.accent : colors.line;
			ctx.lineWidth = 1.5;
			ctx.beginPath();
			if (typeof ctx.roundRect === 'function') {
				ctx.roundRect(px(n.x), n.y, NW, NH, 7);
			} else {
				ctx.rect(px(n.x), n.y, NW, NH);
			}
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = hot ? colors.surface : colors.ink;
			ctx.font = "12px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(n.label, px(n.x) + NW / 2, n.y + NH / 2 + 1);
		}

		// 回表箭头（叶子 → 聚簇行）
		if (d.backFromNode && d.activeRow != null) {
			const from = d.nodes.find((n) => n.id === d.backFromNode);
			const rowY = 250;
			if (from) {
				ctx.strokeStyle = colors.success;
				ctx.lineWidth = 2;
				ctx.setLineDash([5, 4]);
				ctx.beginPath();
				ctx.moveTo(px(from.x) + NW / 2, from.y + NH + 2);
				ctx.lineTo(W * 0.72, rowY - 14);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.fillStyle = colors.success;
				ctx.font = '11px sans-serif';
				ctx.textAlign = 'left';
				ctx.fillText('回表（主键 → 聚簇行）', W * 0.72 + 6, rowY - 20);
			}
		}

		// 聚簇表（主键序）
		ctx.fillStyle = colors.ink2;
		ctx.font = "600 11px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'left';
		ctx.fillText('聚簇索引（主键序 · 整行数据）', 16, 224);
		const rowY0 = 236;
		const rowH = 26;
		d.rows.forEach((r, i) => {
			const y = rowY0 + i * rowH;
			const hit = d.activeRow === r.id;
			ctx.fillStyle = hit ? colors.success : colors.surface;
			ctx.strokeStyle = hit ? colors.success : colors.line;
			ctx.lineWidth = 1.2;
			ctx.beginPath();
			if (typeof ctx.roundRect === 'function') {
				ctx.roundRect(16, y, W * 0.62, rowH - 4, 5);
			} else {
				ctx.rect(16, y, W * 0.62, rowH - 4);
			}
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = hit ? colors.surface : colors.ink;
			ctx.font = "12px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText(r.label, 26, y + rowH / 2 - 2);
		});

		// 底部说明
		if (d.note) {
			ctx.fillStyle = colors.ink3;
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'right';
			ctx.fillText(d.note, W - 12, H - 10);
		}
	}

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		Promise.resolve().then(() => draw());
	});
</script>

<CanvasHost
	minW={480}
	minH={260}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColors}
/>
