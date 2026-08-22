<script lang="ts">
	import { tick } from 'svelte';
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
	let canvasWidth = $derived(host.width);
	let canvasHeight = $derived(host.height);

	let colors = $state({
		light: '#F3F1EC',
		dark: '#E5E2DB',
		border: '#C9C6BF',
		queen: '#1B4965',
		current: '#D97706',
		conflict: '#9B2226',
		solved: '#2D6A4F',
		ink3: '#9A9A9A'
	});

	function updateColorsFromCSS() {
		if (!browser) return;
		colors = {
			light: resolveCSSVar('--color-subtle'),
			dark: resolveCSSVar('--color-surface'),
			border: resolveCSSVar('--color-line-regular'),
			queen: resolveCSSVar('--color-academic'),
			current: resolveCSSVar('--color-accent'),
			conflict: resolveCSSVar('--color-danger'),
			solved: resolveCSSVar('--color-success'),
			ink3: resolveCSSVar('--color-ink-3')
		};
	}

	const FONT = '600 18px ui-monospace, SFMono-Regular, Menlo, monospace';

	function draw() {
		if (!ctx || steps.length === 0) return;

		const step = steps[Math.min(steps.length - 1, Math.floor(playbackPos))];
		const q = step.queens;
		if (!q) {
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const size = Math.min(canvasWidth, canvasHeight) - PAD_TOTAL * 2;
		void size;
		const cell = Math.floor(Math.min(canvasWidth, canvasHeight) / (q.n + 2));
		const boardW = cell * q.n;
		const x0 = (canvasWidth - boardW) / 2;
		const y0 = (canvasHeight - boardW) / 2;

		// 棋盘格子
		for (let r = 0; r < q.n; r++) {
			for (let c = 0; c < q.n; c++) {
				ctx.fillStyle = (r + c) % 2 === 0 ? colors.light : colors.dark;
				ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
				ctx.strokeStyle = colors.border;
				ctx.lineWidth = 0.5;
				ctx.strokeRect(x0 + c * cell, y0 + r * cell, cell, cell);
			}
		}

		// 当前试探格
		if (q.curRow >= 0 && q.curCol >= 0) {
			const color =
				q.phase === 'conflict'
					? colors.conflict
					: q.phase === 'try'
						? colors.current
						: q.phase === 'place'
							? colors.queen
							: colors.current;
			ctx.fillStyle = color + '55';
			ctx.fillRect(x0 + q.curCol * cell, y0 + q.curRow * cell, cell, cell);
			ctx.strokeStyle = color;
			ctx.lineWidth = 2.4;
			ctx.strokeRect(x0 + q.curCol * cell + 1, y0 + q.curRow * cell + 1, cell - 2, cell - 2);
		}

		// 冲突标记
		for (const cf of q.conflicts ?? []) {
			ctx.strokeStyle = colors.conflict;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(x0 + cf.col * cell + 4, y0 + cf.row * cell + 4);
			ctx.lineTo(x0 + (cf.col + 1) * cell - 4, y0 + (cf.row + 1) * cell - 4);
			ctx.moveTo(x0 + (cf.col + 1) * cell - 4, y0 + cf.row * cell + 4);
			ctx.lineTo(x0 + cf.col * cell + 4, y0 + (cf.row + 1) * cell - 4);
			ctx.stroke();
		}

		// 已放置的皇后
		q.placed.forEach((col, row) => {
			if (row >= q.n) return;
			const cx = x0 + col * cell + cell / 2;
			const cy = y0 + row * cell + cell / 2;
			ctx.fillStyle = q.phase === 'solution' ? colors.solved : colors.queen;
			ctx.font = FONT;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('Q', cx, cy + 1);
		});

		// 状态文字
		ctx.fillStyle = colors.ink3;
		ctx.font = '11px ui-monospace, monospace';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		const statusText =
			q.phase === 'solution'
				? `解 #${q.solutionIndex}: ${q.placed.join(',')}`
				: `已放置 ${q.placed.length}/${q.n} 行`;
		ctx.fillText(statusText, x0, y0 + boardW + 8);
	}

	const PAD_TOTAL = 30;

	$effect(() => {
		if (!browser) return;
		void playbackPos;
		void steps;
		tick().then(() => draw());
	});
</script>

<CanvasHost
	minW={380}
	minH={300}
	onDraw={(h) => {
		host = h;
		draw();
	}}
	onThemeChange={updateColorsFromCSS}
/>
