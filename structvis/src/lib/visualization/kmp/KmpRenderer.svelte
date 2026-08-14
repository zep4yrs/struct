<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep, KmpData } from '$lib/engines/algorithm/types';
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
	const LOGICAL_H = 560;

	/** 字符格宽 */
	const CHAR_W = 30;
	const CHAR_H = 34;

	let colors = $state({
		ink: '#1A1A1A',
		ink2: '#6B6B6B',
		ink3: '#9A9A9A',
		accent: '#D97706',
		success: '#2D6A4F',
		successDeep: '#1F4D38',
		danger: '#B4442C',
		line: '#D4D0C8'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			accent: resolveCSSVar('--color-accent'),
			success: resolveCSSVar('--color-success'),
			successDeep: resolveCSSVar('--color-success-deep') || resolveCSSVar('--color-success'),
			danger: resolveCSSVar('--color-danger') || '#B4442C',
			line: resolveCSSVar('--color-line-regular')
		};
	}

	/** 当前帧 */
	function frame(): KmpData | undefined {
		const step = steps[Math.min(Math.floor(playbackPos), steps.length - 1)];
		return step?.kmp;
	}

	/** 上一帧（颜色过渡 / 指针滑动用） */
	function fromFrame(): KmpData | undefined {
		const { fromIdx } = stepProgress(playbackPos, steps.length);
		return steps[Math.min(fromIdx, steps.length - 1)]?.kmp;
	}

	const drawMono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

	function draw() {
		if (!ctx) return;
		const f = frame();
		ctx.save();
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		const scale = Math.min(canvasWidth / LOGICAL_W, canvasHeight / LOGICAL_H, 1.35);
		ctx.scale(scale, scale);
		if (!f) {
			ctx.restore();
			return;
		}

		const m = f.pattern.length;
		const easedT = easeOutCubic(stepProgress(playbackPos, steps.length).t);
		const cellColor = (ch: string): string => (ch === ' ' ? 'transparent' : colors.ink2);
		const phaseAt = (p: KmpData | undefined): string =>
			p?.phase === 'match' || p?.phase === 'found'
				? colors.success
				: p?.phase === 'mismatch'
					? colors.danger
					: colors.accent;
		const phaseColor = lerpColorStr(phaseAt(fromFrame()), phaseAt(f), easedT);
		// 指针平滑滑动（i/j 位置插值）
		const fromF = fromFrame();
		const iPos = (fromF?.i ?? f.i) + (f.i - (fromF?.i ?? f.i)) * easedT;
		const jPos = (fromF?.j ?? f.j) + (f.j - (fromF?.j ?? f.j)) * easedT;

		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		if (f.buildNext) {
			// 阶段 1：求 next。只显示模式串（j/k 双指针）与 next 数组行
			const yPat = 190;
			ctx.font = `600 26px ${drawMono}`;
			const absX = (idx: number) => 120 + idx * CHAR_W + CHAR_W / 2;
			for (let k = 0; k < m; k++) {
				const highlighted = k === f.i || k === f.j;
				ctx.fillStyle = highlighted ? phaseColor : cellColor(f.pattern[k]);
				ctx.fillText(f.pattern[k], absX(k), yPat);
				if (highlighted) {
					ctx.strokeStyle = phaseColor;
					ctx.lineWidth = 2;
					ctx.strokeRect(absX(k) - CHAR_W / 2 + 2, yPat - 20, CHAR_W - 4, CHAR_H - 4);
				}
			}
			ctx.font = `600 16px ${drawMono}`;
			ctx.fillStyle = colors.ink3;
			ctx.fillText('↑ j', absX(Math.min(iPos, m - 1)), yPat + 34);
			ctx.fillText('↑ k', absX(Math.max(jPos, 0)), yPat + 56);
		} else {
			// 阶段 2：匹配。文本行 + 对齐的模式行 + next 行
			const yText = 120;
			ctx.font = `600 26px ${drawMono}`;
			for (let k = 0; k < f.text.length; k++) {
				const x = 120 + k * CHAR_W + CHAR_W / 2;
				const isCompare = k === f.i;
				ctx.fillStyle = isCompare ? phaseColor : cellColor(f.text[k]);
				ctx.fillText(f.text[k], x, yText);
			}
			ctx.font = `600 16px ${drawMono}`;
			ctx.fillStyle = colors.ink3;
			// f.i 越界时指针不绘制（防御异常帧）
			if (f.i >= 0 && f.i < f.text.length) {
				ctx.fillText('↑ i', 120 + iPos * CHAR_W + CHAR_W / 2, yText + 34);
			}

			const yPat = 240;
			ctx.font = `600 26px ${drawMono}`;
			for (let k = 0; k < m; k++) {
				const x = 120 + (f.i + k) * CHAR_W + CHAR_W / 2;
				const isCompare = k === f.j;
				ctx.fillStyle = isCompare ? phaseColor : cellColor(f.pattern[k]);
				ctx.fillText(f.pattern[k], x, yPat);
				if (isCompare) {
					ctx.strokeStyle = phaseColor;
					ctx.lineWidth = 2;
					ctx.strokeRect(120 + (f.i + k) * CHAR_W + 2, yPat - 20, CHAR_W - 4, CHAR_H - 4);
				}
			}
			ctx.font = `600 16px ${drawMono}`;
			ctx.fillStyle = colors.ink3;
			if (f.j >= 0 && f.j < m) {
				ctx.fillText('↑ j', 120 + (iPos + jPos) * CHAR_W + CHAR_W / 2, yPat + 34);
			}

			if (f.phase === 'found' || f.phase === 'failed') {
				const label = f.phase === 'found' ? '匹配成功' : '匹配失败';
				ctx.font = `600 18px ${drawMono}`;
				ctx.fillStyle = f.phase === 'found' ? colors.success : colors.danger;
				ctx.textAlign = 'left';
				ctx.fillText(label, 60, yPat + 80);
			}
		}

		// 阶段 1/2 共用的 next 数组行
		const yNext = f.buildNext ? 330 : 400;
		ctx.font = `500 20px ${drawMono}`;
		ctx.fillStyle = colors.ink3;
		ctx.textAlign = 'left';
		ctx.fillText('next', 60, yNext - 26);
		ctx.textAlign = 'center';
		for (let k = 1; k <= m; k++) {
			const x = 120 + (k - 1) * CHAR_W + CHAR_W / 2;
			const hl = f.nextIndex === k;
			ctx.fillStyle = hl ? phaseColor : colors.ink2;
			ctx.font = `500 20px ${drawMono}`;
			ctx.fillText(String(f.next[k] ?? 0), x, yNext);
			ctx.font = `500 13px ${drawMono}`;
			ctx.fillStyle = colors.ink3;
			ctx.fillText(`[${k}]`, x, yNext + 22);
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
