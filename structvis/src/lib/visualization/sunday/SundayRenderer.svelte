<script lang="ts">
	import { tick } from 'svelte';
	import { browser } from '$app/environment';
	import type { AlgorithmStep } from '$lib/engines/algorithm/types';
	import { resolveCSSVar, stepProgress } from '../visualization-utils';
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

	const PAD = 18;
	const CHAR_W = 22;

	let colors = $state({
		bg: 'transparent',
		textBg: '#FFFFFF',
		patBg: '#F3F1EC',
		border: '#E5E2DB',
		ink: '#1A1A1A',
		ink2: '#5A5A5A',
		ink3: '#9A9A9A',
		match: '#2D6A4F',
		mismatch: '#9B2226',
		current: '#D97706',
		shiftChar: '#1B4965'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			bg: 'transparent',
			textBg: resolveCSSVar('--color-surface'),
			patBg: resolveCSSVar('--color-subtle'),
			border: resolveCSSVar('--color-line-regular'),
			ink: resolveCSSVar('--color-ink'),
			ink2: resolveCSSVar('--color-ink-2'),
			ink3: resolveCSSVar('--color-ink-3'),
			match: resolveCSSVar('--color-success'),
			mismatch: resolveCSSVar('--color-danger'),
			current: resolveCSSVar('--color-accent'),
			shiftChar: resolveCSSVar('--color-academic')
		};
	}

	const FONT = '600 15px ui-monospace, SFMono-Regular, Menlo, monospace';
	const SMALL = '10px ui-monospace, SFMono-Regular, Menlo, monospace';

	function draw() {
		if (!ctx || steps.length === 0) return;

		stepProgress(playbackPos, steps.length);
		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const su = step.sunday;
		if (!su) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const n = su.text.length;
		const totalW = n * CHAR_W;
		const x0 = Math.max(PAD, (canvasWidth - totalW) / 2);
		const textY = canvasHeight * 0.32;
		const patY = textY + CHAR_W * 1.8;

		// 文本行
		for (let i = 0; i < n; i++) {
			const x = x0 + i * CHAR_W + CHAR_W / 2;
			const isCur = i === su.cur;
			const inAlign =
				i >= su.align &&
				i < su.align + su.pattern.length &&
				su.phase !== 'found' &&
				su.phase !== 'failed';

			ctx.fillStyle = isCur ? colors.current : inAlign ? colors.textBg : colors.textBg;
			if (isCur || (inAlign && su.phase === 'match-char')) {
				ctx.fillRect(x - CHAR_W / 2 + 1, textY - CHAR_W * 0.75, CHAR_W - 2, CHAR_W * 1.5);
				ctx.strokeStyle = isCur ? colors.current : colors.match;
				ctx.lineWidth = isCur ? 2 : 1.4;
				ctx.strokeRect(x - CHAR_W / 2 + 1, textY - CHAR_W * 0.75, CHAR_W - 2, CHAR_W * 1.5);
			}
			// shift 阶段高亮"下一个字符"
			if (su.phase === 'shift' && i === su.align + su.pattern.length) {
				ctx.fillStyle = colors.shiftChar + '33';
				ctx.fillRect(x - CHAR_W / 2 + 1, textY - CHAR_W * 0.75, CHAR_W - 2, CHAR_W * 1.5);
				ctx.strokeStyle = colors.shiftChar;
				ctx.lineWidth = 2;
				ctx.strokeRect(x - CHAR_W / 2 + 1, textY - CHAR_W * 0.75, CHAR_W - 2, CHAR_W * 1.5);
			}
			ctx.fillStyle = isCur ? colors.current : inAlign ? colors.ink : colors.ink2;
			ctx.font = FONT;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(su.text[i], x, textY);
			// 下标
			ctx.fillStyle = colors.ink3;
			ctx.font = SMALL;
			ctx.fillText(String(i), x, textY + CHAR_W * 0.95);
		}

		// 模式行(对齐)
		const patX = x0 + su.align * CHAR_W + CHAR_W / 2;
		for (let j = 0; j < su.pattern.length; j++) {
			const x = patX + j * CHAR_W;
			const matched =
				su.phase === 'compare' || su.phase === 'match-char' ? j < su.cur - su.align : false;
			ctx.fillStyle =
				su.phase === 'mismatch' && j === su.cur - su.align ? colors.mismatch + '22' : colors.patBg;
			ctx.fillRect(x - CHAR_W / 2 + 1, patY - CHAR_W * 0.7, CHAR_W - 2, CHAR_W * 1.35);
			ctx.strokeStyle =
				su.phase === 'mismatch' && j === su.cur - su.align ? colors.mismatch : colors.border;
			ctx.lineWidth = su.phase === 'mismatch' && j === su.cur - su.align ? 2 : 1.2;
			ctx.strokeRect(x - CHAR_W / 2 + 1, patY - CHAR_W * 0.7, CHAR_W - 2, CHAR_W * 1.35);
			ctx.fillStyle =
				su.phase === 'mismatch' && j === su.cur - su.align
					? colors.mismatch
					: matched
						? colors.match
						: colors.ink;
			ctx.font = FONT;
			ctx.fillText(su.pattern[j], x, patY);
		}
		// 模式标签
		ctx.fillStyle = colors.ink3;
		ctx.font = SMALL;
		ctx.textAlign = 'right';
		ctx.fillText('P', patX - CHAR_W / 2 - 6, patY);

		// 偏移表（底部）
		const entries = Object.entries(su.offset).sort(([a], [b]) => a.localeCompare(b));
		const tableY = canvasHeight - PAD - 16;
		ctx.fillStyle = colors.ink3;
		ctx.font = SMALL;
		ctx.textAlign = 'left';
		ctx.fillText('偏移表:', PAD, tableY);
		let tx = PAD + 52;
		for (const [c, off] of entries) {
			ctx.fillStyle = colors.ink2;
			ctx.fillText(`${c}:${off}`, tx, tableY);
			tx += 42;
		}
		// nextChar 说明
		if (su.nextChar) {
			ctx.fillStyle = colors.shiftChar;
			ctx.fillText(`看 T[i+|P|] = '${su.nextChar}'`, tx + 12, tableY);
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
	minW={480}
	minH={260}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
