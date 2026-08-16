<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, stepProgress } from '../visualization-utils';
	import { easeOutCubic } from '../array/array-render-utils';
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
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	const PAD = 16;
	const TOP_H = 0.58; // 上半部分比例(数组柱状)

	let colors = $state({
		bg: 'transparent',
		bar: '#1A1A1A',
		barBorder: '#C9C6BF',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		current: '#D97706',
		pop: '#9B2226',
		done: '#2D6A4F',
		stackBg: '#F3F1EC',
		stackBorder: '#E5E2DB'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			bg: 'transparent',
			bar: resolveCSSVar('--color-ink'),
			barBorder: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			current: resolveCSSVar('--color-accent'),
			pop: resolveCSSVar('--color-danger'),
			done: resolveCSSVar('--color-success'),
			stackBg: resolveCSSVar('--color-subtle'),
			stackBorder: resolveCSSVar('--color-line-regular')
		};
	}

	function draw() {
		if (!ctx || steps.length === 0) return;

		const { fromIdx, t } = stepProgress(playbackPos, steps.length);
		const easedT = easeOutCubic(t);
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const fromStep = steps[fromIdx];
		const mono = step.monoStack;
		if (!mono || mono.temps.length === 0) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const n = mono.temps.length;
		const topH = canvasHeight * TOP_H;
		const stackTop = topH + PAD * 0.5;
		const stackH = canvasHeight - stackTop - PAD;

		// === 上半:温度柱状 ===
		const colW = Math.min(64, (canvasWidth - PAD * 2) / n);
		const maxT = Math.max(...mono.temps, 1);
		const barMaxH = topH - PAD * 2 - 18;
		const current = new Set(step.highlights.find((h) => h.type === 'current')?.indices ?? []);
		const fromCurrent = new Set(
			fromStep.highlights.find((h) => h.type === 'current')?.indices ?? []
		);

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		for (let i = 0; i < n; i++) {
			const x = PAD + colW * i + colW / 2;
			const h = (mono.temps[i] / maxT) * barMaxH;
			const y = topH - PAD - h;

			// 柱体(带插值颜色)
			const isCur = current.has(i);
			const wasCur = fromCurrent.has(i);
			let fill: string;
			if (isCur && wasCur) fill = colors.current;
			else if (isCur) {
				ctx.globalAlpha = easedT;
				fill = colors.current;
			} else if (wasCur) {
				fill = colors.ink3;
			} else {
				fill = colors.bar;
			}
			ctx.fillStyle = fill;
			ctx.fillRect(x - colW / 2 + 4, y, colW - 8, h);
			ctx.strokeStyle = colors.barBorder;
			ctx.lineWidth = 1;
			ctx.strokeRect(x - colW / 2 + 4, y, colW - 8, h);
			ctx.globalAlpha = 1;

			// 温度值
			ctx.fillStyle = isCur ? colors.current : colors.ink;
			ctx.font = "600 12px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText(String(mono.temps[i]), x, y - 9);

			// 下标
			ctx.fillStyle = colors.ink3;
			ctx.font = "10px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText(String(i + 1), x, topH - PAD + 8);

			// 答案(已结算)
			if (mono.answer[i] > 0) {
				ctx.fillStyle = colors.done;
				ctx.font = "600 11px 'JetBrains Mono', Consolas, monospace";
				ctx.fillText('+' + mono.answer[i], x, y - 22);
			}
		}

		// 分隔线
		ctx.strokeStyle = colors.stackBorder;
		ctx.setLineDash([4, 4]);
		ctx.beginPath();
		ctx.moveTo(PAD, topH);
		ctx.lineTo(canvasWidth - PAD, topH);
		ctx.stroke();
		ctx.setLineDash([]);

		// 标签
		ctx.fillStyle = colors.ink3;
		ctx.font = "11px 'JetBrains Mono', Consolas, monospace";
		ctx.textAlign = 'left';
		ctx.fillText('单调递减栈（存下标）', PAD, topH + 14);

		// === 下半:栈 ===
		const blockW = 44;
		const blockH = Math.min(26, (stackH - 24) / Math.max(1, mono.stack.length));
		const stackX = canvasWidth / 2;
		ctx.strokeStyle = colors.stackBorder;
		ctx.strokeRect(stackX - blockW / 2 - 3, stackTop + 18, blockW + 6, stackH - 18);

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		mono.stack.forEach((idx, si) => {
			const y = stackTop + stackH - 18 - blockH * (si + 1);
			const inCur = current.has(idx);
			ctx.fillStyle = inCur ? colors.current : colors.stackBg;
			ctx.fillRect(stackX - blockW / 2, y, blockW, blockH - 2);
			ctx.strokeStyle = inCur ? colors.current : colors.stackBorder;
			ctx.strokeRect(stackX - blockW / 2, y, blockW, blockH - 2);
			ctx.fillStyle = inCur ? '#FFFFFF' : colors.ink;
			ctx.font = "600 11px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText(String(mono.temps[idx]), stackX, y + (blockH - 2) / 2);
			// 下标小字
			ctx.fillStyle = colors.ink3;
			ctx.font = "9px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText('#' + (idx + 1), stackX + blockW / 2 + 4, y + (blockH - 2) / 2);
		});
		// 栈顶标记
		if (mono.stack.length) {
			ctx.fillStyle = colors.ink2;
			ctx.font = "10px 'JetBrains Mono', Consolas, monospace";
			ctx.fillText(
				'栈顶 ↑',
				stackX - blockW / 2 - 26,
				stackTop + stackH - 18 - blockH * mono.stack.length + 10
			);
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
	minW={420}
	minH={260}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
