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
			academic: resolveCSSVar('--color-academic'),
			success: resolveCSSVar('--color-success'),
			danger: resolveCSSVar('--color-danger'),
			surface: resolveCSSVar('--color-surface'),
			subtle: resolveCSSVar('--color-subtle')
		};
	}

	function draw() {
		if (!ctx || steps.length === 0) return;
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const d = step.schedule;
		if (!d) return;
		ctx.clearRect(0, 0, W, H);

		const chipW = 74;
		const gap = 12;
		const x0 = Math.max(16, (W - (d.ops.length * (chipW + gap) - gap)) / 2);
		const y0 = 52;
		const txColor = (tx: number) => (tx === 1 ? colors.academic : colors.accent);

		// 操作序列
		const conflictIds: number[] = d.activeConflict ?? [];
		d.ops.forEach((op, i) => {
			const x = x0 + i * (chipW + gap);
			const isConflicted = conflictIds.includes(op.id);
			const fill =
				op.state === 'active' ? txColor(op.tx) : isConflicted ? colors.danger : colors.surface;
			ctx.fillStyle = fill;
			ctx.strokeStyle = op.state === 'active' || isConflicted ? fill : colors.line;
			ctx.lineWidth = 1.6;
			ctx.beginPath();
			if (typeof ctx.roundRect === 'function') {
				ctx.roundRect(x, y0, chipW, 40, 8);
			} else {
				ctx.rect(x, y0, chipW, 40);
			}
			ctx.fill();
			ctx.stroke();
			ctx.fillStyle = op.state === 'active' || isConflicted ? colors.surface : colors.ink;
			ctx.font = "600 13px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(op.label, x + chipW / 2, y0 + 21);
			// 序号
			ctx.fillStyle = colors.ink3;
			ctx.font = '10px sans-serif';
			ctx.fillText(String(i + 1), x + chipW / 2, y0 - 10);
		});

		// 冲突对连线 / 说明
		if (d.activeConflict) {
			const [a, b] = d.activeConflict;
			const ia = d.ops.findIndex((o) => o.id === a);
			const ib = d.ops.findIndex((o) => o.id === b);
			if (ia >= 0 && ib >= 0) {
				const xa = x0 + ia * (chipW + gap) + chipW / 2;
				const xb = x0 + ib * (chipW + gap) + chipW / 2;
				ctx.strokeStyle = colors.danger;
				ctx.lineWidth = 2;
				ctx.setLineDash([4, 3]);
				ctx.beginPath();
				ctx.moveTo(xa, y0 + 44);
				ctx.lineTo(xb, y0 + 44);
				ctx.stroke();
				ctx.setLineDash([]);
				ctx.fillStyle = colors.danger;
				ctx.font = '11px sans-serif';
				ctx.textAlign = 'center';
				ctx.fillText('冲突（同数据 · 不同事务 · 至少一个写）', (xa + xb) / 2, y0 + 60);
			}
		}

		// 串行化结果（完成帧）
		if (d.phase === 'serial' && d.serialOrder) {
			const labels = d.serialOrder
				.map((id) => d.ops.find((o) => o.id === id)?.label ?? '')
				.join('  ');
			ctx.fillStyle = colors.success;
			ctx.font = "600 13px 'JetBrains Mono', Consolas, monospace";
			ctx.textAlign = 'center';
			ctx.fillText('等价串行：T1 → T2', W / 2, 150);
			ctx.fillStyle = colors.ink;
			ctx.font = "13px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText(labels, W / 2, 176);
		}

		if (d.note) {
			ctx.fillStyle = colors.ink3;
			ctx.font = '11px sans-serif';
			ctx.textAlign = 'center';
			ctx.fillText(d.note, W / 2, H - 12);
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
	minW={520}
	minH={210}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColors}
/>
