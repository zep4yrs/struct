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
		success: '#2D6A4F',
		danger: '#9B2226',
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
			success: resolveCSSVar('--color-success'),
			danger: resolveCSSVar('--color-danger'),
			surface: resolveCSSVar('--color-surface'),
			subtle: resolveCSSVar('--color-subtle')
		};
	}

	const PAD_L = 56;
	const PAD_T = 40;
	const PAD_R = 20;
	const LANE_H = 64;

	function draw() {
		if (!ctx || steps.length === 0) return;
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const d = step.gantt;
		if (!d) return;
		ctx.clearRect(0, 0, W, H);
		const plotW = W - PAD_L - PAD_R;
		const tx = (t: number) => PAD_L + (t / d.total) * plotW;

		// 时间刻度
		ctx.strokeStyle = colors.line;
		ctx.lineWidth = 1;
		ctx.fillStyle = colors.ink3;
		ctx.font = "11px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'center';
		for (let t = 0; t <= d.total; t++) {
			const x = tx(t);
			ctx.beginPath();
			ctx.moveTo(x, PAD_T - 8);
			ctx.lineTo(x, PAD_T + d.lanes.length * LANE_H + 8);
			ctx.stroke();
			ctx.fillText('t' + t, x, PAD_T - 16);
		}

		// 甘特条带
		const kindColor = (kind: string) =>
			kind === 'grant' ? colors.success : kind === 'wait' ? colors.accent : colors.danger;
		const kindText = (kind: string) =>
			kind === 'grant' ? '持有' : kind === 'wait' ? '等待' : '回滚';
		d.lanes.forEach((lane, li) => {
			const y = PAD_T + li * LANE_H;
			ctx.fillStyle = colors.ink;
			ctx.font = "600 13px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'right';
			ctx.fillText(lane.name, PAD_L - 10, y + LANE_H / 2 - 6);
			for (const span of lane.spans) {
				const x0 = tx(span.from);
				const x1 = tx(span.to);
				ctx.fillStyle = kindColor(span.kind);
				ctx.globalAlpha = 0.85;
				ctx.beginPath();
				if (typeof ctx.roundRect === 'function') {
					ctx.roundRect(x0 + 1, y + 8, Math.max(4, x1 - x0 - 2), 28, 6);
				} else {
					ctx.rect(x0 + 1, y + 8, Math.max(4, x1 - x0 - 2), 28);
				}
				ctx.fill();
				ctx.globalAlpha = 1;
				if (x1 - x0 > 34) {
					ctx.fillStyle = colors.surface;
					ctx.font = '11px sans-serif';
					ctx.textAlign = 'center';
					ctx.fillText(kindText(span.kind), (x0 + x1) / 2, y + 26);
				}
			}
		});

		// 当前时间游标
		const cx = tx(d.cursor);
		ctx.strokeStyle = colors.accent;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(cx, PAD_T - 8);
		ctx.lineTo(cx, PAD_T + d.lanes.length * LANE_H + 8);
		ctx.stroke();

		// 资源持有状态
		const resY = PAD_T + d.lanes.length * LANE_H + 26;
		ctx.font = "12px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'left';
		d.resources.forEach((r, i) => {
			const x = PAD_L + i * 150;
			ctx.fillStyle = colors.ink2;
			ctx.fillText(`资源 ${r.name}`, x, resY);
			ctx.fillStyle = r.holder ? colors.success : colors.ink3;
			ctx.fillText(r.holder ? `持有者 ${r.holder}` : '空闲', x + 62, resY);
		});

		// 死锁警示
		if (d.deadlock) {
			ctx.fillStyle = colors.danger;
			ctx.font = '600 15px sans-serif';
			ctx.textAlign = 'right';
			ctx.fillText('⚠ 循环等待 → 死锁', W - 16, resY - 4);
		}

		if (d.note) {
			ctx.fillStyle = colors.ink3;
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'right';
			ctx.fillText(d.note, W - 16, H - 8);
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
	minH={240}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColors}
/>
